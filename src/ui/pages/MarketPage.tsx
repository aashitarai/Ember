import { Link } from 'react-router-dom'
import { useAuth } from '../../core/auth'
import { Lock, Check } from 'lucide-react'

const TIER_WEIGHT: Record<string, number> = {
  Bronze: 1,
  Silver: 2,
  Gold: 3,
  Diamond: 4
}

const DROPS = [
  { brand: 'Gym', perk: '20% off annual', need: 'Gold', img: '/drop-gym.jpg' },
  { brand: 'Meal', perk: 'Free delivery (1 month)', need: 'Silver', img: '/drop-meal.jpg' },
  { brand: 'Courses', perk: '50% off cert', need: 'Gold', img: '/drop-courses.jpg' },
  { brand: 'Transit', perk: 'Cashback week', need: 'Bronze', img: '/drop-transit.jpg' },
]

export function MarketPage() {
  const { user } = useAuth()
  
  // Safe extraction of tier weight
  const userTier = user?.tier || 'Bronze'
  const userPower = TIER_WEIGHT[userTier] || 1

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Exclusive Drops</h2>
        <p className="text-zinc-400">
          High-leverage perks that unlock dynamically as you upgrade your discipline tier.{' '}
          <Link to="/dashboard" className="font-medium text-orange-400 hover:text-orange-300">
            See streaks on the dashboard →
          </Link>
        </p>
        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm">
           <span className="text-zinc-500">Your current power:</span>
           <span className="font-bold text-orange-400 uppercase tracking-widest">{userTier}</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {DROPS.map((d) => {
          const reqPower = TIER_WEIGHT[d.need] || 1
          const isUnlocked = userPower >= reqPower

          return (
            <div 
              key={d.brand} 
              className={`relative overflow-hidden rounded-[20px] transition-all duration-300 border ${
                isUnlocked 
                  ? 'border-orange-500/30 shadow-[0_0_30px_rgba(249,115,22,0.1)] hover:scale-[1.02] hover:border-orange-500/60' 
                  : 'border-zinc-800/50 opacity-60 grayscale-[80%]'
              }`}
            >
              <div className="w-full aspect-[16/9] relative bg-zinc-900">
                <img 
                  src={d.img} 
                  alt={d.brand}
                  className={`w-full h-full object-cover transition-transform duration-700 ${isUnlocked ? 'hover:scale-105' : ''}`}
                  onError={(e) => {
                     // Fallback if image fails to load
                     e.currentTarget.style.display = 'none'
                  }}
                />
                
                {/* Overlay gradient for text readability if image fails or is present */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
                
                {/* Status Badge */}
                <div className="absolute top-4 right-4 z-10">
                   {isUnlocked ? (
                     <div className="flex items-center gap-1.5 font-black text-[10px] tracking-widest uppercase bg-green-500/20 text-green-400 px-3 py-1.5 rounded-full border border-green-500/30 backdrop-blur-md">
                        <Check className="w-3 h-3" /> Unlocked
                     </div>
                   ) : (
                     <div className="flex items-center gap-1.5 font-bold text-[10px] tracking-widest uppercase bg-zinc-900/80 text-zinc-400 px-3 py-1.5 rounded-full border border-zinc-700/50 backdrop-blur-md">
                        <Lock className="w-3 h-3" /> Requires {d.need}
                     </div>
                   )}
                </div>

                <div className="absolute bottom-0 left-0 w-full p-6">
                  <div className="text-xl font-bold text-white mb-1 drop-shadow-md">{d.brand} Reward</div>
                  <div className="text-sm font-medium text-orange-200 drop-shadow-md">{d.perk}</div>
                </div>
              </div>

              <div className="p-4 bg-[#0a0c10] border-t border-zinc-800 flex justify-between items-center">
                 <div className="text-xs text-zinc-500 uppercase tracking-widest">
                    Network Partner
                 </div>
                 <button 
                   className={`px-6 py-2 rounded-lg font-bold transition-all text-sm ${
                     isUnlocked 
                       ? 'bg-green-500 text-black hover:bg-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]' 
                       : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                   }`}
                   disabled={!isUnlocked}
                 >
                   {isUnlocked ? 'Redeem Drop' : 'Locked'}
                 </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
