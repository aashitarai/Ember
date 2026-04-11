import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '../../web3/wallet'
import { assertHardhat, fmtEth, getPoolContract, getSigner, toEth } from '../../web3/contracts'

type PoolView = {
  id: number
  name: string
  stakeWei: bigint
  creator: string
  startTs: number
  members: string[]
}

type Activity = { at: number; kind: 'create' | 'join' | 'checkin'; poolId: number; hash: string }

/** Single-pool flow: create one pool on-chain, then join / check-in on that same pool only. */
export function PoolsPage() {
  const wallet = useWallet()
  const [busy, setBusy] = useState<null | 'create' | 'join' | 'checkin'>(null)
  const [err, setErr] = useState<string | null>(null)
  const [pool, setPool] = useState<PoolView | null>(null)
  const [name, setName] = useState('Ember Squad')
  const [stakeEth, setStakeEth] = useState('0.01')
  const [activities, setActivities] = useState<Activity[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('ember.pool.activities') || '[]')
    } catch {
      return []
    }
  })

  async function refreshPool() {
    try {
      const signer = await getSigner()
      const c = getPoolContract(signer)
      const next = Number(await c.nextPoolId())
      if (next <= 1) {
        setPool(null)
        return
      }
      const id = 1
      const p = await c.pools(BigInt(id))
      const members = (await c.getMembers(BigInt(id))) as string[]
      setPool({
        id,
        name: p[0] as string,
        stakeWei: p[1] as bigint,
        creator: p[2] as string,
        startTs: Number(p[3]),
        members,
      })
    } catch {
      setPool(null)
    }
  }

  useEffect(() => {
    if (!wallet.address) return
    void refreshPool()
    const id = setInterval(() => void refreshPool(), 5000)
    return () => clearInterval(id)
  }, [wallet.address])

  useEffect(() => {
    localStorage.setItem('ember.pool.activities', JSON.stringify(activities))
  }, [activities])

  const streakDaysWithFire = useMemo(() => {
    const key = `${wallet.address || ''}:${pool?.id || 0}`
    const dates = activities
      .filter((a) => a.kind === 'checkin')
      .filter((a) => `${wallet.address || ''}:${a.poolId}` === key)
      .map((a) => new Date(a.at).toDateString())
    return new Set(dates)
  }, [activities, pool?.id, wallet.address])

  // Fake historic calendar members data generation mapped specifically up to 'today'
  const calendarData = useMemo(() => {
     const today = new Date()
     const year = today.getFullYear()
     const month = today.getMonth()
     const daysInMonth = new Date(year, month + 1, 0).getDate()
     
     const data = []
     for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(year, month, i)
        // If it's a future date
        if (d > today && d.getDate() !== today.getDate()) {
            data.push({ date: i, total: 4, staked: 0, isFuture: true, dateObj: d })
            continue
        }

        // Check Native real history for 'Today'
        if (d.getDate() === today.getDate()) {
            const hasCheckedIn = streakDaysWithFire.has(today.toDateString()) ? 1 : 0
            data.push({ date: i, total: pool ? Math.max(pool.members.length, 4) : 4, staked: 3 + hasCheckedIn, isFuture: false, dateObj: d })
            continue
        }

        // Mock historical data logically using deterministic math instead of Math.random
        const pseudoRandom = (i * 7 + month * 13) % 5; // 0 to 4 deterministically
        data.push({ date: i, total: 4, staked: pseudoRandom, isFuture: false, dateObj: d })
     }
     return data
  }, [streakDaysWithFire, pool])

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Pool</h2>
        <p className="text-zinc-400">
          Shared accountability. Create or join the on-chain pool, stake ETH, and hold your teammates accountable visually.{' '}
          <Link to="/dashboard" className="font-medium text-orange-400 hover:text-orange-300">
            Discipline dashboard →
          </Link>
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Data Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 bg-[#0a0c10] border-orange-500/20 shadow-[0_0_25px_rgba(249,115,22,0.06)] relative overflow-hidden group transition-all duration-500 hover:border-orange-500/40 hover:shadow-[0_0_40px_rgba(249,115,22,0.12)]">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(249,115,22,0.08),transparent_50%)] opacity-30 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            {!pool ? (
              <div className="relative z-10 space-y-5">
                <div className="text-sm font-bold tracking-widest uppercase text-orange-400">Deploy New Pool</div>
                <p className="text-sm text-zinc-400">Only the first pool (ID #1) is used in this simplified demo. After you deploy, everyone joins this exact address.</p>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="block space-y-2">
                    <div className="text-xs font-black uppercase tracking-widest text-zinc-500">Pool Name</div>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-zinc-800 bg-[#12151a] px-4 py-3 text-sm text-white outline-none focus:border-orange-500/50 transition-colors"
                    />
                  </label>
                  <label className="block space-y-2">
                    <div className="text-xs font-black uppercase tracking-widest text-zinc-500">Stake Limit (ETH)</div>
                    <input
                      value={stakeEth}
                      onChange={(e) => setStakeEth(e.target.value)}
                      className="w-full rounded-xl border border-zinc-800 bg-[#12151a] px-4 py-3 text-sm text-white outline-none focus:border-orange-500/50 transition-colors"
                    />
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    className="w-full py-4 rounded-xl flex items-center justify-center gap-2 bg-[#f97316] text-white font-bold transition-all shadow-[0_0_20px_rgba(249,115,22,0.2)] hover:bg-[#ea580c] disabled:opacity-50 disabled:cursor-not-allowed"
                    type="button"
                    disabled={busy === 'create'}
                    onClick={async () => {
                      setErr(null)
                      try {
                        await wallet.connect()
                        await wallet.ensureHardhat()
                        assertHardhat(wallet.chainId)
                        setBusy('create')
                        const signer = await getSigner()
                        const c = getPoolContract(signer)
                        const tx = await c.createPool(name, toEth(stakeEth), [])
                        await tx.wait()
                        setActivities((a) => [{ at: Date.now(), kind: 'create', poolId: 1, hash: tx.hash }, ...a])
                        await refreshPool()
                      } catch (e: any) {
                        setErr(String(e?.message ?? e))
                      } finally {
                        setBusy(null)
                      }
                    }}
                  >
                    {busy === 'create' ? 'Deploying to Chain...' : 'Deploy Smart Contract'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold tracking-widest uppercase text-orange-400">Active Pool</div>
                  <span className="px-3 py-1 bg-orange-500/10 text-orange-400 rounded-full text-xs font-bold ring-1 ring-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.2)]">ID: #1</span>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-[#12151a] p-5 text-sm">
                  <div className="text-xl font-black text-white mb-4">
                    {pool.name}
                  </div>
                  <div className="grid grid-cols-2 gap-y-4 text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                    <div>
                      <div>Creator</div>
                      <div className="text-white font-mono lowercase tracking-normal mt-1">{short(pool.creator)}</div>
                    </div>
                    <div>
                      <div>Stake Req</div>
                      <div className="text-white normal-case tracking-normal mt-1 text-sm font-bold">{Number(fmtEth(pool.stakeWei)).toFixed(4)} ETH</div>
                    </div>
                    <div>
                      <div>Total Members</div>
                      <div className="text-white normal-case tracking-normal mt-1 text-sm font-bold">{pool.members.length} Users</div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-2">
                  <button
                    className="flex-1 py-4 rounded-xl flex items-center justify-center gap-2 bg-[#f97316] text-white font-bold transition-all shadow-[0_0_20px_rgba(249,115,22,0.2)] hover:bg-[#ea580c] disabled:opacity-50 disabled:shadow-none"
                    type="button"
                    disabled={busy === 'join'}
                    onClick={async () => {
                      setErr(null)
                      try {
                        await wallet.connect()
                        await wallet.ensureHardhat()
                        assertHardhat(wallet.chainId)
                        setBusy('join')
                        const signer = await getSigner()
                        const c = getPoolContract(signer)
                        const tx = await c.joinPool(BigInt(pool.id), { value: pool.stakeWei })
                        await tx.wait()
                        setActivities((a) => [{ at: Date.now(), kind: 'join', poolId: pool.id, hash: tx.hash }, ...a])
                        await refreshPool()
                      } catch (e: any) {
                        setErr(String(e?.message ?? e))
                      } finally {
                        setBusy(null)
                      }
                    }}
                  >
                    {busy === 'join' ? 'Connecting...' : 'Join & Stake'}
                  </button>
                  <button
                    className="flex-1 py-4 rounded-xl flex items-center justify-center gap-2 bg-[#1a1d24] text-white font-bold transition-all hover:bg-[#22262e] border border-zinc-700 disabled:opacity-50"
                    type="button"
                    disabled={busy === 'checkin'}
                    onClick={async () => {
                      setErr(null)
                      try {
                        await wallet.connect()
                        await wallet.ensureHardhat()
                        assertHardhat(wallet.chainId)
                        setBusy('checkin')
                        const signer = await getSigner()
                        const c = getPoolContract(signer)
                        const tx = await c.checkIn(BigInt(pool.id))
                        await tx.wait()
                        setActivities((a) => [{ at: Date.now(), kind: 'checkin', poolId: pool.id, hash: tx.hash }, ...a])
                      } catch (e: any) {
                        setErr(String(e?.message ?? e))
                      } finally {
                        setBusy(null)
                      }
                    }}
                  >
                    {busy === 'checkin' ? 'Verifying...' : 'Daily Check-in 🔥'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div className="card p-6 bg-[#0a0c10] border-zinc-800">
            <div className="text-sm font-bold tracking-widest text-zinc-500 uppercase mb-4">On-Chain Activity</div>
            {activities.length === 0 ? (
              <div className="py-4 text-center text-sm text-zinc-600 font-medium">No actions broadcasted locally yet.</div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-zinc-800">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#12151a] text-xs text-zinc-500 uppercase tracking-wider font-bold">
                    <tr>
                      <th className="px-4 py-3 font-medium">Time (Local)</th>
                      <th className="px-4 py-3 font-medium">Function</th>
                      <th className="px-4 py-3 font-medium">Hash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50 bg-[#0c0e12]">
                    {activities.slice(0, 15).map((a) => (
                      <tr key={a.hash + a.at} className="hover:bg-[#12151a] transition-colors">
                        <td className="px-4 py-3 text-zinc-400">{new Date(a.at).toLocaleTimeString()}</td>
                        <td className="px-4 py-3 font-bold text-white capitalize">{a.kind}</td>
                        <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                          {a.hash.slice(0, 8)}…{a.hash.slice(-6)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Nav: Interactive Compact Calendar component */}
        <div className="space-y-6">
           <div className="card p-6 bg-[#0a0c10] border border-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.04)] h-full">
              <h3 className="text-sm font-bold tracking-widest text-zinc-400 uppercase mb-5 flex items-center justify-between">
                <span>Monthly Tracking</span>
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.8)]" />
              </h3>

              <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center text-[10px] font-black uppercase text-zinc-600 tracking-wider mb-2">
                 <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
                 
                 {/* Offset padding for 1st day of month */}
                 {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay() }).map((_, i) => (
                    <div key={'gap'+i} className="aspect-square" />
                 ))}

                 {/* The Calendar Matrix */}
                 {calendarData.map((day) => {
                    const fillRatio = day.isFuture ? 0 : (day.staked / day.total) * 100
                    const isToday = day.dateObj.getDate() === new Date().getDate()
                    const isComplete = day.staked === day.total && !day.isFuture
                    
                    return (
                       <div 
                         key={day.date} 
                         title={day.isFuture ? 'Upcoming' : `${day.staked}/${day.total} members staked on ${day.dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                         className={`relative aspect-square rounded overflow-hidden flex items-center justify-center group transition-all duration-300 cursor-pointer 
                            ${day.isFuture ? 'bg-[#D4CFC4]/5' : 'bg-[#D4CFC4]/15'}
                            ${isToday ? 'ring-2 ring-orange-500/60 ring-offset-1 ring-offset-[#0a0c10]' : 'hover:ring-1 hover:ring-zinc-500'}
                         `}
                       >
                          {/* Inner CSS Volumetric Fill relying on proportional percentage mapping */}
                          <div 
                            className={`absolute bottom-0 left-0 w-full transition-all duration-1000 ease-out flex items-end
                              ${isComplete ? 'bg-[#FF7A00]' : 'bg-[#FF7A00]/50'}
                            `} 
                            style={{ height: `${fillRatio}%` }} 
                          >
                             {/* Adds an inner top gradient for depth so it perfectly fits the Fox's aesthetic */}
                             <div className="w-full h-1 bg-gradient-to-b from-white/20 to-transparent" />
                          </div>
                          
                          {/* Exact Number Mask mapped exactly over top */}
                          <span className={`relative z-10 text-xs font-bold leading-none ${day.isFuture ? 'text-zinc-600' : 'text-white text-shadow-sm'}`}>
                             {day.date}
                          </span>

                          {/* Interactive Hover Context Box avoiding DOM tables entirely */}
                          {!day.isFuture && (
                            <div className="absolute top-0 right-0 p-0.5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                               {isComplete && <div className="w-1.5 h-1.5 bg-orange-200 rounded-full shadow-[0_0_3px_rgba(255,255,255,0.8)]" />}
                            </div>
                          )}
                       </div>
                    )
                 })}
              </div>

              {/* Progress Summary Legend */}
              <div className="mt-6 pt-5 border-t border-zinc-800 flex justify-between items-center text-xs">
                 <div className="flex items-center gap-2 text-zinc-400 font-medium">
                    <div className="w-3 h-3 rounded-sm bg-[#D4CFC4]/15 border border-zinc-700" />
                    Pending
                 </div>
                 <div className="flex items-center gap-2 text-zinc-400 font-medium">
                    <div className="w-3 h-3 rounded-sm bg-[#FF7A00]" />
                    Staked
                 </div>
              </div>
           </div>
        </div>
      </div>
      
      {err && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 bg-red-950/80 border border-red-500 text-red-200 text-sm font-bold rounded-full backdrop-blur-md shadow-[0_0_30px_rgba(220,38,38,0.3)] z-50 animate-in slide-in-from-bottom-5">
           {err}
        </div>
      )}
    </div>
  )
}

function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}
