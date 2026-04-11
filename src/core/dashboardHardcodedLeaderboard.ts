/** Demo roster for the dashboard leaderboard (design + UX). On-chain stats stay live elsewhere on the page. */

export type HardcodedLeaderboardRow = {
  rank: number
  address: string
  displayName: string
  streak: number
  stakeAmount: string
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Diamond'
  score: number
}

export const HARDCODED_LEADERBOARD: HardcodedLeaderboardRow[] = [
  {
    rank: 1,
    address: '0x1111111111111111111111111111111111111111',
    displayName: 'Riya M.',
    streak: 142,
    stakeAmount: '14.5000',
    tier: 'Diamond',
    score: 412.8,
  },
  {
    rank: 2,
    address: '0x2222222222222222222222222222222222222222',
    displayName: 'Dev K.',
    streak: 120,
    stakeAmount: '8.2500',
    tier: 'Gold',
    score: 288.4,
  },
  {
    rank: 3,
    address: '0x3333333333333333333333333333333333333333',
    displayName: 'Sam T.',
    streak: 89,
    stakeAmount: '4.1000',
    tier: 'Silver',
    score: 156.2,
  },
  {
    rank: 4,
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    displayName: 'Anvil #0',
    streak: 76,
    stakeAmount: '2.8000',
    tier: 'Silver',
    score: 98.5,
  },
  {
    rank: 5,
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    displayName: 'Anvil #1',
    streak: 54,
    stakeAmount: '1.9500',
    tier: 'Bronze',
    score: 61.3,
  },
  {
    rank: 6,
    address: '0x4444444444444444444444444444444444444444',
    displayName: 'Mira P.',
    streak: 45,
    stakeAmount: '1.2000',
    tier: 'Bronze',
    score: 44.0,
  },
  {
    rank: 7,
    address: '0x5555555555555555555555555555555555555555',
    displayName: 'Noah L.',
    streak: 31,
    stakeAmount: '0.8500',
    tier: 'Bronze',
    score: 28.7,
  },
  {
    rank: 8,
    address: '0x6666666666666666666666666666666666666666',
    displayName: 'Priya S.',
    streak: 18,
    stakeAmount: '0.5000',
    tier: 'Bronze',
    score: 12.1,
  },
]
