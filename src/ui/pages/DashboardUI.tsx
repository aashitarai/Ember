import React, { useState } from 'react';

export interface DashboardUIProps {
  // User
  userName: string;
  walletAddress: string;

  // Stats
  stakedAmount: string;
  weeklyGain: string;
  currentStreak: number;
  maxStreak: number;
  currentTier: 'Bronze' | 'Silver' | 'Gold' | 'Diamond';
  apy: number;

  // Badge
  badgeTier: 'Bronze' | 'Silver' | 'Gold' | 'Diamond' | null;
  badgeEarnedAt: Date | null;
  nextTierName: string;
  nextTierDaysRequired: number;

  // Heatmap
  checkInHistory: { date: string; checkedIn: boolean; txHash?: string; intensity?: number }[];

  // Leaderboard
  leaderboard: {
    rank: number;
    address: string;
    displayName?: string;
    streak: number;
    stakeAmount: string;
    tier: 'Bronze' | 'Silver' | 'Gold' | 'Diamond';
    isCurrentUser: boolean;
  }[];

  // Feed
  feedItems: {
    id: string;
    type: 'join' | 'checkin' | 'tierUpgrade';
    address: string;
    displayName?: string;
    detail: string;
    timestamp: Date;
  }[];

  refetchLeaderboard: () => void;
}

export default function DashboardUI(props: DashboardUIProps) {
  const [hoveredBadge, setHoveredBadge] = useState<number | null>(null);

  // Shorten address helper
  const shortAddr = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="w-full min-h-screen bg-[#0A0A0A] font-sans text-zinc-100 selection:bg-[#FF6B35]/30">
      
      {/* CSS ENGINE INJECTION */}
      <style>{`
        @keyframes diamondPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(103,232,249,0.4), 0 0 40px rgba(103,232,249,0.1); }
          50% { box-shadow: 0 0 30px rgba(103,232,249,0.7), 0 0 60px rgba(103,232,249,0.25); }
        }
        @keyframes badgeFlip {
          0% { transform: rotateY(0deg) scale(1); }
          50% { transform: rotateY(90deg) scale(1.05); }
          100% { transform: rotateY(0deg) scale(1); }
        }
        @keyframes bronzeGlow {
          0%, 100% { box-shadow: 0 0 15px rgba(205,127,50,0.3); }
          50% { box-shadow: 0 0 25px rgba(205,127,50,0.55); }
        }
        @keyframes goldGlow {
          0%, 100% { box-shadow: 0 0 15px rgba(255,215,0,0.3); }
          50% { box-shadow: 0 0 30px rgba(255,215,0,0.6); }
        }
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
        @keyframes feedSlide {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes streakPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }

        .anim-live-pulse { animation: livePulse 1.5s ease-in-out infinite; }
        .anim-feed-slide { animation: feedSlide 0.25s ease-out; }
        .anim-streak-pulse { animation: streakPulse 1s ease-in-out infinite; }
        
        /* Ideogram Soft Edge Overrides */
        .glass-panel {
          background: linear-gradient(180deg, rgba(30,30,30,0.5) 0%, rgba(20,20,20,0.8) 100%);
          box-shadow: inset 0 1px 1px rgba(255,255,255,0.05);
        }

        /* Webkit scrollbar override */
        .scrollbar-thin::-webkit-scrollbar { width: 6px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #2A2A2A; border-radius: 4px; }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #444; }
      `}</style>


      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-8">

        {/* SECTION 1 — STAT CARDS (Image Matching Logic) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
           
           {/* Card 1: Stake & Upward Trend */}
           <div className="bg-[#141414] rounded-2xl border-l-[3px] border-[#1F1F1F] border-l-[#4ADE80]/80 p-5 relative overflow-hidden group hover:border-[#2A2A2A] hover:bg-[#181818] transition-all duration-300 cursor-default shadow-lg shadow-[#4ADE80]/[0.02]">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(74,222,128,0.15),transparent_70%)] pointer-events-none" />
              <div className="relative z-10 flex flex-col h-full">
                 <div className="text-white text-3xl font-bold tracking-tight">{props.stakedAmount} <span className="text-xl font-medium text-zinc-400">ETH</span></div>
                 
                 <div className="flex-1 flex justify-center items-center py-6">
                    {/* Massive Green Arrow Vector */}
                    <svg viewBox="0 0 100 120" className="w-20 h-24 filter drop-shadow-[0_10px_20px_rgba(74,222,128,0.3)] opacity-90 group-hover:opacity-100 group-hover:-translate-y-2 transition-all duration-500">
                      <defs>
                        <linearGradient id="greenArrow" x1="0" y1="1" x2="0" y2="0">
                          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#4ADE80" />
                        </linearGradient>
                      </defs>
                      <path d="M50 0 L90 40 L65 40 L65 120 L35 120 L35 40 L10 40 Z" fill="url(#greenArrow)" />
                    </svg>
                 </div>

                 <div className="flex justify-between items-end mt-auto">
                    <div className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">Current Stake</div>
                    <div className="bg-[#4ADE80]/10 border border-[#4ADE80]/30 rounded-full px-2 py-1 flex items-center justify-center">
                       <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l7-7 7 7"/><path d="M12 19V5"/></svg>
                    </div>
                 </div>
              </div>
           </div>

           {/* Card 2: Streak & Flame Focus */}
           <div className="bg-[#141414] rounded-2xl border-l-[3px] border-[#1F1F1F] border-l-[#FF6B35]/80 p-5 relative overflow-hidden group hover:border-[#2A2A2A] hover:bg-[#181818] transition-all duration-300 cursor-default shadow-lg shadow-[#FF6B35]/[0.02]">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(255,107,53,0.18),transparent_70%)] pointer-events-none" />
              <div className="relative z-10 flex flex-col h-full">
                 <div className="flex justify-between items-start">
                    <div className="text-white text-3xl font-bold tracking-tight">{props.currentStreak} <span className="text-lg font-medium text-zinc-400">Days</span></div>
                 </div>
                 
                 <div className="flex-1 flex justify-center items-center py-4">
                    {/* Massive Flame Graphic */}
                    <div className={`${props.currentStreak === props.maxStreak ? 'anim-streak-pulse' : ''} group-hover:scale-105 transition-transform duration-500`}>
                       <svg viewBox="0 0 64 64" className="w-[88px] h-[88px] filter drop-shadow-[0_10px_25px_rgba(255,107,53,0.5)]">
                          <defs>
                             <linearGradient id="flameGrad" x1="0" y1="1" x2="0" y2="0">
                               <stop offset="0%" stopColor="#ea580c" />
                               <stop offset="60%" stopColor="#FF6B35" />
                               <stop offset="100%" stopColor="#fbbf24" />
                             </linearGradient>
                          </defs>
                          <path d="M32 0C32 0 16 16 16 32C16 43 23.2 52.3 33.2 55.4C30 52 28 47.3 28 42C28 32 36 26 36 26C36 26 39 31 39 36C39 42 35.4 47 30.6 49.3C33 50.4 35.6 51 38.4 51C47.8 51 55.4 43.4 55.4 34C55.4 19.3 32 0 32 0Z" fill="url(#flameGrad)" />
                       </svg>
                    </div>
                 </div>

                 <div className="flex justify-between items-end mt-auto">
                    <div className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">Current Streak</div>
                    <div className="text-white/40 text-[10px] bg-white/5 border border-white/10 rounded-full px-2 py-0.5">Best: {props.maxStreak}</div>
                 </div>
              </div>
           </div>

           {/* Card 3: Tier Diamond (Explosive Gradient Match) */}
           <div className={`rounded-2xl border-t border-[#1F1F1F] p-5 relative overflow-hidden group transition-all duration-300 cursor-default shadow-3xl ${
               props.currentTier === 'Diamond' ? 'bg-gradient-to-b from-[#ffdbb5] via-[#ff906b] to-[#c75d4a] shadow-[#ff906b]/20 border-white/20' 
             : props.currentTier === 'Gold' ? 'bg-gradient-to-b from-[#FFECAA] via-[#D4AF37] to-[#8C6D1F] border-white/20'
             : props.currentTier === 'Silver' ? 'bg-[#141414] border-l-[3px] border-l-[#C0C0C0]'
             : 'bg-[#141414] border-l-[3px] border-l-[#CD7F32]'
           }`}>
              
              <div className="relative z-10 flex flex-col h-full">
                 <div className={`text-3xl font-black tracking-tight ${props.currentTier === 'Diamond' ? 'text-zinc-900 drop-shadow-sm' : 'text-white'}`}>
                    {props.currentTier}
                 </div>
                 
                 <div className="flex-1 flex justify-center items-center py-2 relative">
                    {/* Inner Diamond Glow/Shine Element */}
                    {props.currentTier === 'Diamond' && (
                       <>
                         <div className="absolute w-[200px] h-[200px] bg-white/40 blur-[40px] mix-blend-overlay rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                         <div className="absolute bottom-0 w-[1px] h-[60px] bg-gradient-to-t from-white to-transparent shadow-[0_0_10px_#fff]" />
                       </>
                    )}
                    
                    <svg viewBox="0 0 100 100" className={`w-28 h-28 transform transition-transform duration-700 group-hover:scale-110 ${props.currentTier === 'Diamond' ? 'filter drop-shadow-[0_15px_30px_rgba(0,100,255,0.4)]' : ''}`}>
                       {props.currentTier === 'Diamond' ? (
                         <>
                           <defs>
                             <linearGradient id="diamondGrad" x1="0" y1="0" x2="1" y2="1">
                               <stop offset="0%" stopColor="#ffffff" />
                               <stop offset="50%" stopColor="#67E8F9" />
                               <stop offset="100%" stopColor="#3B82F6" />
                             </linearGradient>
                           </defs>
                           <path d="M50 10 L85 35 L50 90 L15 35 Z" fill="url(#diamondGrad)" stroke="#fff" strokeWidth="1" />
                           <path d="M50 10 L50 90 M15 35 L50 45 L85 35 M50 10 L30 35 L50 45 L70 35 Z" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
                         </>
                       ) : props.currentTier === 'Gold' ? (
                         <polygon points="50,10 61,35 88,35 66,54 74,80 50,65 26,80 34,54 12,35 39,35" fill="#FFECAA" stroke="#fff" strokeWidth="2" className="drop-shadow-xl" />
                       ) : props.currentTier === 'Silver' ? (
                         <path d="M20 20 L80 20 L50 80 Z" fill="#E8E8E8" stroke="#444" strokeWidth="4" />
                       ) : (
                         <circle cx="50" cy="50" r="30" fill="#CD7F32" stroke="#8B4513" strokeWidth="3" />
                       )}
                    </svg>
                 </div>

                 <div className="flex justify-between items-end mt-auto">
                    <div className={`text-xs uppercase tracking-wider font-extrabold ${props.currentTier === 'Diamond' ? 'text-zinc-800' : 'text-zinc-400'}`}>Tier Level</div>
                 </div>
              </div>
           </div>

           {/* Card 4: APY Ring */}
           <div className="bg-[#141414] rounded-2xl border-l-[3px] border-[#1F1F1F] border-l-yellow-500/80 p-5 relative overflow-hidden group hover:border-[#2A2A2A] hover:bg-[#181818] transition-all duration-300 cursor-default flex flex-col shadow-lg shadow-yellow-500/[0.02]">
              <div className="text-white text-3xl font-bold tracking-tight">{props.apy}%</div>
              
              <div className="flex-1 flex justify-center items-center py-4 relative">
                 <div className="w-[100px] h-[100px] relative flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                       <circle cx="50" cy="50" r="40" fill="none" stroke="#222" strokeWidth="8" />
                       <circle 
                          cx="50" cy="50" r="40" fill="none" stroke="url(#apyGrad)" strokeWidth="8" 
                          strokeLinecap="round" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * (props.apy/20))}
                          className="transition-all duration-1000 ease-out drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" 
                       />
                       <defs>
                          <linearGradient id="apyGrad" x1="0" y1="0" x2="1" y2="1">
                             <stop offset="0%" stopColor="#facc15" />
                             <stop offset="100%" stopColor="#84cc16" />
                          </linearGradient>
                       </defs>
                    </svg>
                    <span className="absolute text-white font-bold text-lg">{props.apy}%</span>
                 </div>
              </div>

              <div className="flex justify-between items-end mt-auto">
                 <div className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">Earning Rate</div>
                 <div className="bg-gradient-to-r from-yellow-500/20 to-green-500/20 rounded-full w-12 h-4 border border-zinc-700/50" />
              </div>
           </div>

        </div>

        {/* SECTION 3 & 4 Layout Matching the provided image (Heatmap Left, Leaderboard Right) */}
        <div className="grid lg:grid-cols-3 gap-6 mt-2">
           
           {/* LEFT COLUMN: Discipline Heatmap (Massive geometric blocks like the ideogram) */}
           <div className="lg:col-span-2 bg-[#1A1A1A]/40 rounded-[28px] border border-[#222] p-8 glass-panel">
              <div className="flex justify-between items-center mb-8">
                 <h2 className="text-2xl font-bold text-white tracking-tight">Discipline Heatmap</h2>
                 <div className="flex gap-2">
                   <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs text-zinc-400 hover:text-white hover:border-zinc-500 transition cursor-pointer font-bold">V</div>
                   <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs text-zinc-400 hover:text-white hover:border-zinc-500 transition cursor-pointer font-bold">28</div>
                   <div className="w-8 h-8 rounded-full bg-[#FF6B35] border border-[#FF6B35] flex items-center justify-center text-xs text-white shadow-lg cursor-default font-bold">↑</div>
                 </div>
              </div>

              {/* Chunky 6-column grid matching the exact vibes of the visual prompt */}
              <div className="grid grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
                 {/* Creating dummy bulky aesthetic cells mapping to deep pastel sunset colors from image */}
                 {[
                   ...Array(6).fill({ bg: 'bg-[#C1D2C6]', txt: 'text-[#3E4A43]' }),
                   ...Array(6).fill({ bg: 'bg-[#F2D798]', txt: 'text-[#5A4D27]' }),
                   ...Array(6).fill({ bg: 'bg-[#FFB76B]', txt: 'text-[#6B4125]' }),
                   ...Array(6).fill({ bg: 'bg-[#F18867]', txt: 'text-[#562214]' }),
                   ...Array(6).fill({ bg: 'bg-[#DE656B]', txt: 'text-[#4A1E22]' }),
                 ].map((cell, idx) => (
                    <div 
                      key={idx} 
                      className={`aspect-square rounded-[18px] sm:rounded-[22px] flex items-center justify-center font-black text-xl md:text-2xl cursor-pointer hover:scale-105 transition-transform duration-200 shadow-inner 
                          ${idx > 27 ? 'bg-zinc-800/50 text-zinc-600' : cell.bg + ' ' + cell.txt}
                          ${idx === 22 ? 'ring-4 ring-white ring-offset-2 ring-offset-[#1A1A1A]' : ''}
                      `}
                      title={`Mock block ${idx}`}
                    >
                       {(idx * 1.5 + 40).toFixed(0)}
                    </div>
                 ))}
              </div>

              {/* Bottom Summary Bar */}
              <div className="mt-10 rounded-2xl bg-[#0D0D0D]/50 border border-zinc-800/80 p-5 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-zinc-900 rounded-full border border-zinc-800 flex items-center justify-center">
                       <svg viewBox="0 0 64 64" className="w-[28px] h-[28px]">
                          <path d="M32 0C32 0 16 16 16 32C16 43 23.2 52.3 33.2 55.4C30 52 28 47.3 28 42C28 32 36 26 36 26C36 26 39 31 39 36C39 42 35.4 47 30.6 49.3C33 50.4 35.6 51 38.4 51C47.8 51 55.4 43.4 55.4 34C55.4 19.3 32 0 32 0Z" fill="#fbbf24" stroke="#ea580c" strokeWidth="2" />
                       </svg>
                    </div>
                    <div>
                       <div className="text-zinc-500 text-[11px] font-bold tracking-widest uppercase">Latest Milestone</div>
                       <div className="text-white text-base font-semibold">Day 12: <span className="text-zinc-400 font-normal">Check in objective complete</span></div>
                    </div>
                 </div>
                 <div className="opacity-40 hover:opacity-100 transition-opacity cursor-pointer">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2A10 10 0 1 0 22 12A10 10 0 0 0 12 2Z"/><path d="M12 8l4 4-4 4M8 12h8"/></svg>
                 </div>
              </div>
           </div>

           {/* RIGHT COLUMN: Leaderboard List */}
           <div className="lg:col-span-1 bg-[#1A1A1A]/40 rounded-[28px] border border-[#222] p-8 glass-panel flex flex-col">
              <h2 className="text-2xl font-bold text-white tracking-tight mb-6">Leaderboard</h2>
              
              <div className="flex-1 overflow-y-auto pr-2 pb-4 scrollbar-thin">
                 <div className="space-y-3">
                    {props.leaderboard.map((user, idx) => (
                       <div 
                         key={user.address} 
                         className={`p-4 rounded-[20px] flex items-center justify-between transition-colors
                            ${user.isCurrentUser ? 'bg-[#FF6B35]/10 border border-[#FF6B35]/30 shadow-[0_0_15px_rgba(255,107,53,0.1)]' : 'bg-[#141414] border border-[#1F1F1F] hover:bg-[#1a1a1a] cursor-default'}
                         `}
                       >
                          <div className="flex items-center gap-4">
                             {/* Mock Generative Avatar Style Box */}
                             <div className={`w-12 h-12 rounded-full overflow-hidden border-2 flex items-center justify-center shrink-0
                                ${idx === 0 ? 'border-purple-500 bg-purple-500/20 text-purple-400' 
                                : idx === 1 ? 'border-teal-500 bg-teal-500/20 text-teal-400'
                                : idx === 2 ? 'border-amber-700 bg-amber-900/40 text-amber-500'
                                : 'border-zinc-600 bg-zinc-800 text-zinc-400'}
                             `}>
                                <div className="text-[10px] font-black uppercase text-center">{user.address.slice(2,5)}</div>
                             </div>

                             <div className="flex flex-col">
                                <div className="text-white/90 text-[13px] font-bold tracking-wide uppercase font-mono">{user.displayName || shortAddr(user.address)}</div>
                                <div className="text-zinc-400 text-xs font-medium mt-0.5">{user.streak} Days 🔥</div>
                             </div>
                          </div>

                          <div className="flex flex-col items-end">
                             <div className="text-[#4ADE80] font-mono text-[11px] font-bold mb-1 tracking-widest">{user.rank === 1 ? '1 2 1 0 2' : user.rank === 2 ? '1 7 5 6 2' : '3 5 8 5 5'}</div>
                             <div className="text-[#FF6B35] font-bold text-xs">{Number(user.stakeAmount).toFixed(1)} <span className="text-[9px] text-zinc-500 uppercase">Eth</span></div>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

           </div>
        </div>

        {/* SECTION 2 — BADGE GALLERY and SECTION 5 — FEED (Appended securely below main block mirroring standard UI extensions) */}
        <div className="grid lg:grid-cols-3 gap-6">
           {/* Extended Live Feed Box mapped closely behind Leaderboard structure in prompt */}
           <div className="lg:col-span-1 bg-[#141414] rounded-[24px] border border-[#1F1F1F] p-6 flex flex-col hidden sm:block">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-lg font-bold text-white tracking-tight">Live Activity</h2>
                 <div className="w-2.5 h-2.5 rounded-full bg-[#4ADE80] anim-live-pulse" />
              </div>
              <div className="max-h-[250px] overflow-y-auto scrollbar-thin pr-2 space-y-0.5">
                 {props.feedItems.length === 0 ? (
                    <div className="text-zinc-500 text-sm text-center py-10 font-medium">No recent events broadcasted natively.</div>
                 ) : props.feedItems.map((item) => (
                    <div key={item.id} className="anim-feed-slide flex items-start gap-4 py-3 border-b border-[#1A1A1A]/60 last:border-0 hover:bg-[#1A1A1A]/40 rounded-xl px-2 -mx-2 transition-colors">
                       <div className={`w-8 h-8 rounded-full flex gap-1 items-center justify-center shrink-0 border
                          ${item.type === 'join' ? 'bg-[#1a2a1a] text-[#4ADE80] border-[#4ADE80]/20' 
                          : item.type === 'checkin' ? 'bg-[#2a1a0a] text-[#FF6B35] border-[#FF6B35]/20'
                          : 'bg-[#0a1a2a] text-[#67E8F9] border-[#67E8F9]/20'}
                       `}>
                          {item.type === 'join' ? '+' : item.type === 'checkin' ? '🔥' : '◆'}
                       </div>
                       <div className="flex-1 mt-0.5">
                          <span className="text-white font-mono text-xs">{item.displayName || shortAddr(item.address)}</span>
                          <span className="text-zinc-400 text-[13px] ml-2 block sm:inline mt-0.5 sm:mt-0">{item.detail}</span>
                       </div>
                       <div className="text-zinc-600 text-[10px] uppercase font-bold tracking-wider mt-1">{item.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    </div>
                 ))}
               </div>
           </div>

           {/* Simplified Badge Gallery Grid mimicking the logic but keeping footprint neat */}
           <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-end mb-2 px-2">
                 <h2 className="text-xl font-bold text-white tracking-tight">Tamashii Badge Gallery</h2>
                 <p className="text-zinc-500 text-sm font-medium">Earn badges by strictly maintaining streaks</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {(['Bronze','Silver','Gold','Diamond'] as const).map((t, idx) => {
                    const isUnlocked = t === 'Bronze' || t === 'Silver' // Mock logic
                    
                    return (
                       <div 
                         key={t}
                         onMouseEnter={() => setHoveredBadge(idx)}
                         onMouseLeave={() => setHoveredBadge(null)}
                         className={`bg-[#141414] rounded-[24px] border p-6 flex flex-col items-center text-center transition-all duration-300 cursor-pointer overflow-hidden
                            ${isUnlocked ? `border-${t === 'Bronze' ? 'amber-700/50' : 'zinc-400/50'} hover:scale-105` : 'border-[#1F1F1F] grayscale opacity-50'}
                         `}
                       >
                          <div 
                            className={`w-20 h-20 rounded-full flex justify-center items-center relative mb-4 transition-transform duration-700
                               ${hoveredBadge === idx && isUnlocked ? 'rotate-[360deg]' : ''}
                               ${t === 'Diamond' && isUnlocked ? 'shadow-[0_0_30px_rgba(103,232,249,0.5)]' : ''}
                            `}
                            style={{ 
                               background: t === 'Bronze' ? 'linear-gradient(135deg, #CD7F32, #8B4513)' 
                                         : t === 'Silver' ? 'linear-gradient(135deg, #E8E8E8, #9A9A9A)'
                                         : t === 'Gold' ? 'linear-gradient(135deg, #FFD700, #B8860B)'
                                         : 'linear-gradient(135deg, #67E8F9, #3B82F6)'
                            }}
                          >
                             {/* Placeholder Graphic within the Circle */}
                             <span className="text-3xl font-black text-white/90 drop-shadow-lg">{t.charAt(0)}</span>
                             {!isUnlocked && (
                                <div className="absolute inset-0 flex justify-center items-center bg-black/40 rounded-full">
                                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                </div>
                             )}
                          </div>

                          <div className="text-white font-bold tracking-tight">{t}</div>
                          {isUnlocked ? (
                             <div className="mt-3 px-3 py-1 text-[10px] uppercase tracking-widest font-bold bg-[#4ADE80]/15 text-[#4ADE80] rounded-full border border-[#4ADE80]/30 shadow-[0_0_10px_rgba(74,222,128,0.2)]">Unlocked</div>
                          ) : (
                             <div className="w-full mt-3 flex flex-col gap-1 items-center">
                                <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Locked</div>
                                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden"><div className="w-1/3 h-full bg-[#FF6B35]" /></div>
                             </div>
                          )}
                       </div>
                    )
                 })}
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
