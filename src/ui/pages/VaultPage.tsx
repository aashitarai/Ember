import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '../../web3/wallet'
import { assertHardhat, fmtEth, getBrowserProvider, getSigner, getVaultContract, readVault, toEth } from '../../web3/contracts'

type TierCard = { tier: 'Bronze' | 'Silver' | 'Gold' | 'Diamond'; apy: string; perks: string }

const tierCards: TierCard[] = [
  { tier: 'Bronze', apy: '5.00%', perks: 'Starter APY + basic streak tracking' },
  { tier: 'Silver', apy: '6.00%', perks: 'Higher APY + partner starter offers' },
  { tier: 'Gold', apy: '7.50%', perks: 'Premium APY + curated partner perks' },
  { tier: 'Diamond', apy: '10.00%', perks: 'Top APY + governance/premium perks' },
]

export function VaultPage() {
  const HISTORY_KEY = 'ember.vault.txHistory'
  const wallet = useWallet()
  const [mode, setMode] = useState<'idle' | 'stake' | 'withdraw'>('idle')
  const [amount, setAmount] = useState('0.01')
  const [withdrawAmount, setWithdrawAmount] = useState('0.005')
  const [busy, setBusy] = useState<null | 'stake' | 'withdraw'>(null)
  const [walletBalanceWei, setWalletBalanceWei] = useState<bigint>(0n)
  const [chain, setChain] = useState<{ balanceWei: bigint; streakDays: bigint; tier: number; apyBps: bigint } | null>(
    null,
  )
  const [err, setErr] = useState<string | null>(null)
  const [history, setHistory] = useState<
    Array<{ hash: string; type: 'stake' | 'withdraw'; amountEth: string; status: 'confirmed' | 'failed'; at: number }>
  >(() => {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    } catch {
      return []
    }
  })

  useEffect(() => {
    if (!wallet.address) return
    let alive = true
    const tick = async () => {
      try {
        const [next, bal] = await Promise.all([
          readVault(wallet.address!),
          getBrowserProvider().getBalance(wallet.address!) as Promise<bigint>,
        ])
        if (alive) {
          setChain(next)
          setWalletBalanceWei(bal)
        }
      } catch {
        // ignore
      }
    }
    void tick()
    const id = window.setInterval(tick, 2500)
    return () => {
      alive = false
      window.clearInterval(id)
    }
  }, [wallet.address])

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  }, [history])

  const currentTier = useMemo(() => {
    if (!chain) return 'Bronze'
    return chain.tier === 3 ? 'Diamond' : chain.tier === 2 ? 'Gold' : chain.tier === 1 ? 'Silver' : 'Bronze'
  }, [chain])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-white">Vault</h2>
        <p className="mt-1 text-sm text-zinc-200">
          Build streaks with transparent APY tiers. Withdraw anytime (flex withdrawal resets streak yield for that period).{' '}
          <Link to="/dashboard" className="font-medium text-orange-400 hover:text-orange-300">
            View dashboard →
          </Link>
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {tierCards.map((t) => (
          <div key={t.tier} className={`card p-6 relative overflow-hidden group transition-all duration-500 hover:scale-105 border ${currentTier === t.tier ? 'border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.15)] ring-1 ring-orange-500/50' : 'border-zinc-800 hover:border-orange-500/30 hover:shadow-[0_0_20px_rgba(249,115,22,0.1)]'}`}>
            <div className={`absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 ${currentTier === t.tier ? 'opacity-100' : ''}`} />
            <div className="relative z-10">
              <div className="text-sm font-black uppercase tracking-widest text-orange-400">{t.tier}</div>
              <div className="mt-2 text-3xl font-black text-white tracking-tighter drop-shadow-md">{t.apy}</div>
              <div className="mt-3 text-xs text-zinc-400 font-medium">{t.perks}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <div className="text-sm text-zinc-200">
          Wallet: <span className="font-mono">{wallet.address ?? 'not connected'}</span> · Balance:{' '}
          <span className="font-semibold text-white">{Number(fmtEth(walletBalanceWei)).toFixed(4)} ETH</span>
          {chain ? (
            <>
              {' '}
              · Staked: <span className="font-semibold text-white">{Number(fmtEth(chain.balanceWei)).toFixed(4)} ETH</span>
              {' '}
              · Streak: <span className="font-semibold text-white">{chain.streakDays.toString()}d</span>
              {' '}
              · APY: <span className="font-semibold text-white">{(Number(chain.apyBps) / 100).toFixed(2)}%</span>
            </>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button className={'btn ' + (mode === 'stake' ? 'btn-primary' : '')} onClick={() => setMode('stake')} type="button">
            Stake
          </button>
          <button className={'btn ' + (mode === 'withdraw' ? 'btn-primary' : '')} onClick={() => setMode('withdraw')} type="button">
            Withdraw
          </button>
        </div>

        {mode === 'stake' ? (
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="block space-y-2">
              <div className="text-xs font-medium text-zinc-100">Stake amount (ETH)</div>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-56 rounded-xl border border-orange-500/30 bg-[#0a0c10] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/50"
              />
            </label>
            <button
              className="btn btn-primary"
              type="button"
              disabled={busy === 'stake'}
              onClick={async () => {
                setErr(null)
                try {
                  await wallet.connect()
                  await wallet.ensureHardhat()
                  assertHardhat(wallet.chainId)
                  setBusy('stake')
                  const signer = await getSigner()
                  const vault = getVaultContract(signer)
                  const tx = await vault.stake({ value: toEth(amount) })
                  await tx.wait()
                  setHistory((h) => [{ hash: tx.hash, type: 'stake', amountEth: amount, status: 'confirmed', at: Date.now() }, ...h])
                  if (wallet.address) setChain(await readVault(wallet.address))
                } catch (e: any) {
                  const msg = String(e?.message ?? e)
                  setErr(msg.includes('ACTION_REJECTED') ? 'Transaction rejected in MetaMask.' : msg)
                } finally {
                  setBusy(null)
                }
              }}
            >
              Confirm Stake
            </button>
          </div>
        ) : null}

        {mode === 'withdraw' ? (
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="block space-y-2">
              <div className="text-xs font-medium text-zinc-100">Withdraw amount (ETH)</div>
              <input
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-56 rounded-xl border border-orange-500/30 bg-[#0a0c10] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/50"
              />
            </label>
            <button
              className="btn btn-primary"
              type="button"
              disabled={busy === 'withdraw'}
              onClick={async () => {
                setErr(null)
                try {
                  await wallet.connect()
                  await wallet.ensureHardhat()
                  assertHardhat(wallet.chainId)
                  setBusy('withdraw')
                  const signer = await getSigner()
                  const vault = getVaultContract(signer)
                  const tx = await vault.withdraw(toEth(withdrawAmount))
                  await tx.wait()
                  setHistory((h) => [{ hash: tx.hash, type: 'withdraw', amountEth: withdrawAmount, status: 'confirmed', at: Date.now() }, ...h])
                  if (wallet.address) setChain(await readVault(wallet.address))
                } catch (e: any) {
                  const msg = String(e?.message ?? e)
                  setErr(msg.includes('ACTION_REJECTED') ? 'Transaction rejected in MetaMask.' : msg)
                } finally {
                  setBusy(null)
                }
              }}
            >
              Confirm Withdraw
            </button>
          </div>
        ) : null}

        {err ? <div className="mt-3 text-sm text-red-600">{err}</div> : null}
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-white">Transaction History</div>
          <button className="btn" type="button" onClick={() => setHistory([])}>
            Clear
          </button>
        </div>
        {history.length === 0 ? (
          <div className="mt-3 text-sm text-zinc-200">No transactions yet.</div>
        ) : (
          <div className="mt-3 overflow-hidden rounded-2xl border border-orange-500/30">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#0a0c10] text-xs text-zinc-200">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {history.slice(0, 20).map((tx) => (
                  <tr key={tx.hash}>
                    <td className="px-4 py-3 text-zinc-100">{new Date(tx.at).toLocaleString()}</td>
                    <td className="px-4 py-3 font-medium text-white">{tx.type}</td>
                    <td className="px-4 py-3 text-zinc-100">{tx.amountEth} ETH</td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-100">{tx.hash.slice(0, 12)}…{tx.hash.slice(-8)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

