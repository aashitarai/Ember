import React from 'react';
import DashboardUI, { DashboardUIProps } from './DashboardUI';
import { useAuth } from '../../core/auth';
import { useWallet, shortAddr } from '../../web3/wallet';

export function DashboardPage() {
  const { user } = useAuth();
  const wallet = useWallet();

  // MOCK DATA PAYLOAD GENERATOR FOR PRESENTATIONAL BINDINGS
  const activeAddress = wallet.address || "0x517f839...06a0";

  const mockProps: DashboardUIProps = {
    userName: user?.name || "Aashi",
    walletAddress: activeAddress,
    
    stakedAmount: "2.45",
    weeklyGain: "+ 0.12 ETH this week",
    currentStreak: 47,
    maxStreak: 60,
    currentTier: 'Diamond',
    apy: 12.4,

    badgeTier: 'Diamond',
    badgeEarnedAt: new Date(Date.now() - 86400000 * 12),
    nextTierName: 'Maxed Out',
    nextTierDaysRequired: 0,

    // Historical 13 days
    checkInHistory: Array.from({ length: 35 }).map((_, i) => ({
      date: new Date(Date.now() - 86400000 * (35 - i)).toISOString(),
      checkedIn: Math.random() > 0.2
    })),

    leaderboard: [
      { rank: 1, address: "0x343B...CAB2", displayName: "Satoshi", streak: 65, stakeAmount: "12.1", tier: 'Diamond', isCurrentUser: false },
      { rank: 2, address: "0x7333B...C44D2", displayName: "Aashi (You)", streak: 47, stakeAmount: "17.5", tier: 'Diamond', isCurrentUser: true },
      { rank: 3, address: "0x70766...342", displayName: "Guimen", streak: 35, stakeAmount: "3.5", tier: 'Gold', isCurrentUser: false },
      { rank: 4, address: "0x2311...A11", streak: 12, stakeAmount: "1.2", tier: 'Silver', isCurrentUser: false },
      { rank: 5, address: "0x987...2B3", streak: 5, stakeAmount: "0.5", tier: 'Bronze', isCurrentUser: false },
    ],

    feedItems: [
      { id: "1", type: "checkin", address: "0x343B...CAB2", detail: "checked in 🔥", timestamp: new Date(Date.now() - 120000) },
      { id: "2", type: "tierUpgrade", address: activeAddress, displayName: "Aashi", detail: "upgraded to Diamond ◆", timestamp: new Date(Date.now() - 3600000) },
      { id: "3", type: "join", address: "0xNEW...WALLET", detail: "joined the pool +", timestamp: new Date(Date.now() - 7200000) },
    ],

    refetchLeaderboard: () => {
      console.log("Mock refetch triggered")
    }
  };

  return <DashboardUI {...mockProps} />;
}
