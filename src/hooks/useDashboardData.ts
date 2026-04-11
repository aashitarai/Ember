import { useCallback, useEffect, useRef, useState } from 'react'
import {
  BrowserProvider,
  Contract,
  formatEther,
  getAddress,
  ZeroAddress,
  type EventLog,
} from 'ethers'
import chainAddresses from '../contracts/addresses.json'
import {
  EmberVaultAbi,
  KizunaPoolAbi,
  TamashiiNFTAbi,
} from '../web3/contracts'

const EXPECTED_CHAIN_ID = Number((chainAddresses as { chainId?: number }).chainId ?? 31337)
const BLOCKS_PER_DAY_ESTIMATE = 5760

export interface DashboardData {
  badgeTier: 'Bronze' | 'Silver' | 'Gold' | 'Diamond' | null
  badgeEarnedAt: Date | null
  currentStreak: number
  maxStreak: number
  nextTierName: string
  nextTierDaysRequired: number
  checkInHistory: { date: string; checkedIn: boolean; txHash?: string }[]
  leaderboard: {
    rank: number
    address: string
    streak: number
    stakeAmount: string
    tier: 'Bronze' | 'Silver' | 'Gold' | 'Diamond'
    score: number
    isCurrentUser: boolean
  }[]
  feedItems: {
    id: string
    type: 'join' | 'checkin' | 'tierUpgrade'
    address: string
    detail: string
    timestamp: Date
  }[]
  loading: boolean
  error: string | null
  refetchLeaderboard: () => void
  /** Reload badge, streaks, heatmap, leaderboard (on-chain), and activity feed. */
  refetchAll: () => void
}

type DashboardState = Omit<DashboardData, 'refetchLeaderboard' | 'refetchAll'>

function evArgs(log: EventLog): unknown[] {
  const a = log.args
  if (!a) return []
  const n = typeof (a as { length?: number }).length === 'number' ? (a as { length: number }).length : 0
  const out: unknown[] = []
  for (let i = 0; i < n; i++) out.push((a as Record<number, unknown>)[i])
  return out
}

function computeMaxStreak(dates: string[]): number {
  const sorted = [...new Set(dates)].sort()
  let max = 0
  let cur = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + 'T12:00:00.000Z')
    const curr = new Date(sorted[i] + 'T12:00:00.000Z')
    const diff = (curr.getTime() - prev.getTime()) / 86400000
    if (diff === 1) {
      cur++
      max = Math.max(max, cur)
    } else {
      cur = 1
    }
  }
  return Math.max(max, sorted.length > 0 ? 1 : 0)
}

function utcDateStringFromBlockTimestamp(ts: bigint): string {
  const d = new Date(Number(ts) * 1000)
  return d.toISOString().slice(0, 10)
}

function tokenIdToBadgeTier(tokenId: bigint): 'Bronze' | 'Silver' | 'Gold' | 'Diamond' {
  const n = Number(tokenId)
  if (n >= 301) return 'Diamond'
  if (n >= 201) return 'Gold'
  if (n >= 101) return 'Silver'
  return 'Bronze'
}

function tierRank(t: 'Bronze' | 'Silver' | 'Gold' | 'Diamond'): number {
  return { Bronze: 0, Silver: 1, Gold: 2, Diamond: 3 }[t]
}

function streakToTier(streak: number): 'Bronze' | 'Silver' | 'Gold' | 'Diamond' {
  if (streak >= 90) return 'Diamond'
  if (streak >= 60) return 'Gold'
  if (streak >= 30) return 'Silver'
  return 'Bronze'
}

function nextStreakMilestone(current: number): { name: string; daysRequired: number } {
  if (current < 30) return { name: 'Silver', daysRequired: Math.max(0, 30 - current) }
  if (current < 60) return { name: 'Gold', daysRequired: Math.max(0, 60 - current) }
  if (current < 90) return { name: 'Diamond', daysRequired: Math.max(0, 90 - current) }
  return { name: '', daysRequired: 0 }
}

function vaultTierLabel(tier: number): string {
  if (tier >= 3) return 'Diamond'
  if (tier === 2) return 'Gold'
  if (tier === 1) return 'Silver'
  return 'Bronze'
}

async function collectOwnedTokenIds(nft: Contract, owner: string): Promise<bigint[]> {
  const bal = (await nft.balanceOf(owner)) as bigint
  if (bal === 0n) return []
  const ids: bigint[] = []
  const n = Number(bal)
  for (let i = 0; i < n; i++) {
    try {
      const fn = nft.getFunction('tokenOfOwnerByIndex')
      const id = (await fn(owner, i)) as bigint
      ids.push(id)
    } catch {
      break
    }
  }
  if (ids.length === 0) {
    try {
      const id = (await nft.tokenOf(owner)) as bigint
      if (id > 0n) ids.push(id)
    } catch {
      /* ignore */
    }
  }
  return ids
}

async function fetchBadge(
  nft: Contract,
  provider: BrowserProvider,
  userAddress: string,
): Promise<{ tier: DashboardData['badgeTier']; earnedAt: Date | null }> {
  const ids = await collectOwnedTokenIds(nft, userAddress)
  if (ids.length === 0) return { tier: null, earnedAt: null }

  let best: { tier: 'Bronze' | 'Silver' | 'Gold' | 'Diamond'; tokenId: bigint } | null = null
  for (const tokenId of ids) {
    const t = tokenIdToBadgeTier(tokenId)
    if (!best || tierRank(t) > tierRank(best.tier)) best = { tier: t, tokenId }
  }
  if (!best) return { tier: null, earnedAt: null }

  const mintLogs = (await nft.queryFilter(
    nft.filters.Transfer(ZeroAddress, userAddress),
    0,
    'latest',
  )) as EventLog[]

  let earnedAt: Date | null = null
  for (const log of mintLogs) {
    const tid = log.args?.tokenId as bigint | undefined
    if (tid !== undefined && tid === best.tokenId) {
      const block = await provider.getBlock(log.blockNumber)
      if (block?.timestamp != null) {
        earnedAt = new Date(Number(block.timestamp) * 1000)
        break
      }
    }
  }
  return { tier: best.tier, earnedAt }
}

async function blockTimestampMap(
  provider: BrowserProvider,
  blockNumbers: number[],
): Promise<Map<number, number>> {
  const unique = [...new Set(blockNumbers)]
  const map = new Map<number, number>()
  await Promise.all(
    unique.map(async (bn) => {
      const b = await provider.getBlock(bn)
      map.set(bn, b?.timestamp != null ? Number(b.timestamp) : 0)
    }),
  )
  return map
}

function emptyHistory(): DashboardData['checkInHistory'] {
  const out: DashboardData['checkInHistory'] = []
  const today = new Date()
  for (let i = 89; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i))
    out.push({ date: d.toISOString().slice(0, 10), checkedIn: false })
  }
  return out
}

async function buildLeaderboard(
  provider: BrowserProvider,
  vault: Contract,
  pool: Contract,
  userAddress: string,
): Promise<DashboardData['leaderboard']> {
  const joined = (await pool.queryFilter(pool.filters.Joined(), 0, 'latest')) as EventLog[]

  const firstJoinBlock = new Map<string, number>()
  for (const log of joined) {
    const arr = evArgs(log)
    const memberRaw = arr[1]
    if (memberRaw === undefined || memberRaw === null) continue
    const member = getAddress(String(memberRaw))
    const bn = Number(log.blockNumber)
    const prev = firstJoinBlock.get(member)
    if (prev === undefined || bn < prev) firstJoinBlock.set(member, bn)
  }

  const ordered: string[] = [getAddress(userAddress)]
  const seen = new Set(ordered.map((a) => a.toLowerCase()))
  for (const log of joined) {
    const arr = evArgs(log)
    const memberRaw = arr[1]
    if (memberRaw === undefined || memberRaw === null) continue
    const member = getAddress(String(memberRaw))
    const key = member.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      ordered.push(member)
    }
    if (ordered.length >= 20) break
  }

  const joinBlocks = ordered
    .map((a) => firstJoinBlock.get(a))
    .filter((b): b is number => b !== undefined)
  const tsMap = await blockTimestampMap(provider, joinBlocks)
  const nowSec = Date.now() / 1000

  const rows = await Promise.all(
    ordered.map(async (addr) => {
      const [streakBn, rawBalance] = await Promise.all([
        vault.getStreakDays(addr) as Promise<bigint>,
        vault.getBalance(addr) as Promise<bigint>,
      ])
      const streak = Number(streakBn)
      const stakeAmount = formatEther(rawBalance)
      const jb = firstJoinBlock.get(addr)
      const firstJoinTs = jb !== undefined ? tsMap.get(jb) ?? nowSec : nowSec - 30 * 86400
      const daysSinceJoin = Math.max(1 / 86400, (nowSec - firstJoinTs) / 86400)
      const score = (streak * parseFloat(stakeAmount || '0')) / (daysSinceJoin + 1)
      return {
        address: addr,
        streak,
        stakeAmount: Number.isFinite(parseFloat(stakeAmount))
          ? parseFloat(stakeAmount).toFixed(4)
          : '0',
        tier: streakToTier(streak),
        score,
        isCurrentUser: addr.toLowerCase() === userAddress.toLowerCase(),
      }
    }),
  )

  rows.sort((a, b) => b.score - a.score)
  return rows.map((r, i) => ({
    rank: i + 1,
    address: r.address,
    streak: r.streak,
    stakeAmount: r.stakeAmount,
    tier: r.tier,
    score: r.score,
    isCurrentUser: r.isCurrentUser,
  }))
}

async function buildFeed(
  provider: BrowserProvider,
  vault: Contract,
  pool: Contract,
  latest: number,
): Promise<DashboardData['feedItems']> {
  const fromBlock = Math.max(0, latest - 25_000)
  const [checkpoints, joins, checkins] = await Promise.all([
    vault.queryFilter(vault.filters.Checkpoint(), fromBlock, 'latest') as Promise<EventLog[]>,
    pool.queryFilter(pool.filters.Joined(), fromBlock, 'latest') as Promise<EventLog[]>,
    pool.queryFilter(pool.filters.CheckedIn(), fromBlock, 'latest') as Promise<EventLog[]>,
  ])

  const blocks = new Set<number>()
  for (const logs of [checkpoints, joins, checkins]) {
    for (const log of logs) blocks.add(Number(log.blockNumber))
  }
  const tsMap = await blockTimestampMap(provider, [...blocks])

  type Item = { sortKey: number; item: DashboardData['feedItems'][0] }
  const items: Item[] = []

  for (const log of joins) {
    const ja = evArgs(log)
    const poolId = ja[0] as bigint | undefined
    const member = String(ja[1] ?? '')
    if (!member.startsWith('0x')) continue
    const ts = tsMap.get(Number(log.blockNumber)) ?? 0
    items.push({
      sortKey: Number(log.blockNumber) * 1_000_000 + (log.index ?? 0),
      item: {
        id: `${log.transactionHash}-${log.index ?? 0}`,
        type: 'join',
        address: getAddress(member),
        detail: `Joined pool #${poolId?.toString?.() ?? '?'}`,
        timestamp: new Date(ts * 1000),
      },
    })
  }

  for (const log of checkins) {
    const ca = evArgs(log)
    const poolId = ca[0] as bigint | undefined
    const member = String(ca[1] ?? '')
    const dayIndex = ca[2] as bigint | undefined
    if (!member.startsWith('0x')) continue
    const ts = tsMap.get(Number(log.blockNumber)) ?? 0
    items.push({
      sortKey: Number(log.blockNumber) * 1_000_000 + (log.index ?? 0),
      item: {
        id: `${log.transactionHash}-${log.index ?? 0}`,
        type: 'checkin',
        address: getAddress(member),
        detail: `Checked in — pool #${poolId?.toString?.() ?? '?'} (day ${dayIndex?.toString?.() ?? '?'})`,
        timestamp: new Date(ts * 1000),
      },
    })
  }

  for (const log of checkpoints) {
    const pa = evArgs(log)
    const user = String(pa[0] ?? '')
    if (!user.startsWith('0x')) continue
    const streakDays = pa[1] as bigint | undefined
    const tier = Number(pa[2] ?? 0)
    const ts = tsMap.get(Number(log.blockNumber)) ?? 0
    items.push({
      sortKey: Number(log.blockNumber) * 1_000_000 + (log.index ?? 0),
      item: {
        id: `${log.transactionHash}-${log.index ?? 0}`,
        type: 'tierUpgrade',
        address: getAddress(user),
        detail: `Vault checkpoint — ${vaultTierLabel(tier)} tier (${String(streakDays)}d streak)`,
        timestamp: new Date(ts * 1000),
      },
    })
  }

  items.sort((a, b) => b.sortKey - a.sortKey)
  return items.slice(0, 40).map((x) => x.item)
}

const initialState: DashboardState = {
  badgeTier: null,
  badgeEarnedAt: null,
  currentStreak: 0,
  maxStreak: 0,
  nextTierName: '',
  nextTierDaysRequired: 0,
  checkInHistory: emptyHistory(),
  leaderboard: [],
  feedItems: [],
  loading: true,
  error: null,
}

export function useDashboardData(): DashboardData {
  const [state, setState] = useState<DashboardState>(initialState)
  const [refetchTick, setRefetchTick] = useState(0)
  const ctxRef = useRef<{
    provider: BrowserProvider
    vault: Contract
    pool: Contract
    nft: Contract
    userAddress: string
  } | null>(null)

  const refetchLeaderboard = useCallback(() => {
    const ctx = ctxRef.current
    if (!ctx) return
    void (async () => {
      try {
        const leaderboard = await buildLeaderboard(ctx.provider, ctx.vault, ctx.pool, ctx.userAddress)
        setState((s) => ({ ...s, leaderboard }))
      } catch {
        /* ignore */
      }
    })()
  }, [])

  const refetchAll = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }))
    setRefetchTick((n) => n + 1)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      const eth = (window as Window & { ethereum?: { request: (p: { method: string }) => Promise<unknown> } })
        .ethereum
      if (!eth) {
        setState((s) => ({
          ...s,
          loading: false,
          error: 'Please connect your wallet',
        }))
        return
      }

      try {
        await eth.request({ method: 'eth_requestAccounts' })
      } catch {
        setState((s) => ({
          ...s,
          loading: false,
          error: 'Please connect your wallet',
        }))
        return
      }

      const provider = new BrowserProvider(eth)
      let userAddress: string
      try {
        const network = await provider.getNetwork()
        if (Number(network.chainId) !== EXPECTED_CHAIN_ID) {
          setState((s) => ({
            ...s,
            loading: false,
            error: `Switch MetaMask to chain ${EXPECTED_CHAIN_ID} (Hardhat local).`,
          }))
          return
        }
        const signer = await provider.getSigner()
        userAddress = await signer.getAddress()
      } catch {
        setState((s) => ({
          ...s,
          loading: false,
          error: 'Please connect your wallet',
        }))
        return
      }

      const vaultAddr = (chainAddresses as { EmberVault: string }).EmberVault
      const poolAddr = (chainAddresses as { KizunaPool: string }).KizunaPool
      const nftAddr = (chainAddresses as { TamashiiNFT: string }).TamashiiNFT

      const vault = new Contract(vaultAddr, EmberVaultAbi, provider)
      const pool = new Contract(poolAddr, KizunaPoolAbi, provider)
      const nft = new Contract(nftAddr, TamashiiNFTAbi, provider)

      ctxRef.current = { provider, vault, pool, nft, userAddress: userAddress! }

      try {
        const latest = await provider.getBlockNumber()
        const fromHeat = Math.max(0, latest - 90 * BLOCKS_PER_DAY_ESTIMATE)

        const [badge, currentStreakBn, checkInLogs, allUserCheckIns] = await Promise.all([
          fetchBadge(nft, provider, userAddress!),
          vault.getStreakDays(userAddress!) as Promise<bigint>,
          pool.queryFilter(pool.filters.CheckedIn(null, userAddress!), fromHeat, 'latest') as Promise<
            EventLog[]
          >,
          pool.queryFilter(pool.filters.CheckedIn(null, userAddress!), 0, 'latest') as Promise<EventLog[]>,
        ])

        const currentStreak = Number(currentStreakBn)

        const checkBlocks = [...new Set(allUserCheckIns.map((l) => Number(l.blockNumber)))]
        const checkTs = await blockTimestampMap(provider, checkBlocks)
        const streakDates: string[] = []
        for (const log of allUserCheckIns) {
          const ts = checkTs.get(Number(log.blockNumber))
          if (ts) streakDates.push(utcDateStringFromBlockTimestamp(BigInt(ts)))
        }
        const maxStreak = computeMaxStreak(streakDates)
        const next = nextStreakMilestone(currentStreak)

        const byDate = new Map<string, string>()
        for (const log of checkInLogs) {
          const ts = checkTs.get(Number(log.blockNumber))
          if (!ts) continue
          const dateStr = utcDateStringFromBlockTimestamp(BigInt(ts))
          byDate.set(dateStr, String(log.transactionHash))
        }

        const history = emptyHistory()
        for (let i = 0; i < history.length; i++) {
          const tx = byDate.get(history[i].date)
          if (tx) history[i] = { ...history[i], checkedIn: true, txHash: tx }
        }

        const [leaderboard, feedItems] = await Promise.all([
          buildLeaderboard(provider, vault, pool, userAddress!),
          buildFeed(provider, vault, pool, latest),
        ])

        if (cancelled) return

        setState({
          badgeTier: badge.tier,
          badgeEarnedAt: badge.earnedAt,
          currentStreak,
          maxStreak,
          nextTierName: next.name,
          nextTierDaysRequired: next.daysRequired,
          checkInHistory: history,
          leaderboard,
          feedItems,
          loading: false,
          error: null,
        })
      } catch (e: unknown) {
        if (cancelled) return
        const msg = e instanceof Error ? e.message : String(e)
        setState((s) => ({
          ...s,
          loading: false,
          error: msg || 'Failed to load dashboard',
        }))
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [refetchTick, refetchLeaderboard])

  return { ...state, refetchLeaderboard, refetchAll }
}
