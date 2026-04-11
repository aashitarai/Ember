import { ArrowRight, Bot, Shield, Pickaxe, Users, HeartHandshake, LayoutDashboard } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../core/auth'
import { BigPetView } from '../pet/PetWidget'
import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const pinContainerRef = useRef<HTMLDivElement>(null)
  const petWrapperRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Fox initialization bounds
      if (petWrapperRef.current) {
        gsap.set(petWrapperRef.current, { x: '-5vw', y: '-10vh', scale: 1.3 });
      }

      // We only animate the pinned container if it exists
      if (!pinContainerRef.current) return

      const boxes = gsap.utils.toArray<HTMLElement>('.gsap-box')

      // Set initial state of all boxes explicitly centered from the top/left to mathematically eliminate visual drifting
      gsap.set(boxes, { top: '50%', left: '50%', xPercent: -50, yPercent: -50, scale: 1.5, y: '50vh', opacity: 0, zIndex: (i) => i })

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pinContainerRef.current,
          start: 'top top',
          end: '+=4000', // Significantly shortened for dramatically faster, punchier scrolling
          scrub: 1, // Smooth scrub tracking
          pin: true,
        }
      })

      // The GSAP Sequence Loop - Organized strictly so NO BOX overlaps.
      boxes.forEach((box, i) => {
        // Grid Assignment
        let xTarget = '0vw'
        let yTarget = '0vh'
        
        if (i === 0) { xTarget = '-25vw'; yTarget = '-28vh' } // Deep Top Left (lowered to avoid cutoff)
        if (i === 1) { xTarget = '25vw'; yTarget = '-28vh' }  // Deep Top Right (lowered to avoid cutoff)
        if (i === 2) { xTarget = '-25vw'; yTarget = '32vh' }  // Deep Bottom Left
        if (i === 3) { xTarget = '25vw'; yTarget = '32vh' }   // Deep Bottom Right
        if (i === 4) { xTarget = '0vw'; yTarget = '5vh' }     // Center box slightly bumped up

        const scaleTarget = 0.65 // Exploit the corner spacing to heavily boost the maximum resting size of all boxes

        tl.to(box, { y: '0vh', scale: 1.1, opacity: 1, duration: 4, ease: 'power2.out' }) // Zoom in HUGE dynamically from bottom
          .to(box, { duration: 2 }) // Hold pure focus in the center so user reads it securely
          .to(box, { x: xTarget, y: yTarget, scale: scaleTarget, opacity: 1, duration: 3, ease: 'power3.inOut' }) // Swoop it to its unique grid corner!
          .to(box, { duration: 0.5 }) // Short pause before next box enters
      })

      // After the final box, hold the view of all the compiled boxes on screen
      tl.to({}, { duration: 4 })

      // EXPLOSION PHASE: One-by-one Multi-directional scatter
      tl.addLabel('explode')
      
      boxes.forEach((box, i) => {
        // Map each box to scatter outward from the center into empty space
        let destX = '0vw'
        let destY = '0vh'
        let rot = 0
        
        if (i === 0) { destX = '-100vw'; destY = '-100vh'; rot = -30 } // Top Left shoots Northwest
        if (i === 1) { destX = '100vw'; destY = '-100vh'; rot = 30 }   // Top Right shoots Northeast
        if (i === 2) { destX = '-100vw'; destY = '100vh'; rot = -15 }  // Bottom Left shoots Southwest
        if (i === 3) { destX = '100vw'; destY = '100vh'; rot = 15 }    // Bottom Right shoots Southeast
        if (i === 4) { destX = '0vw'; destY = '-150vh'; rot = 45 }     // Center shoots Straight Up
        
        tl.to(box, { 
          x: destX, 
          y: destY, 
          rotation: rot, 
          opacity: 0, 
          duration: 6, // Slower proportion extending the exit animation
          ease: 'power2.inOut' // Elegantly peels away without sudden jags
        }, `explode+=${i * 1.5}`) // Staggers them one by one heavily
      })

    })

    return () => ctx.revert()
  }, [])

  return (
    <div className="relative w-full bg-[#0b0f14] min-h-screen text-zinc-100 font-sans -mt-28">
      
      {/* 
        3D BACKGROUND FOX
        The Fox is fixed and controlled natively. It sits elegantly without zooming on scroll.
      */}
      <div ref={petWrapperRef} className="fixed top-0 left-0 w-full h-screen pointer-events-auto z-0 transform-origin-center">
        <BigPetView />
      </div>

      <div className="relative z-10 w-full pointer-events-none">
        
        {/* HERO SECTION - Standard Native Scroll */}
        <section className="min-h-[120vh] flex flex-col justify-start px-6 md:px-20 pt-[22vh]">
          <div className="max-w-4xl pointer-events-auto">
            <p className="text-sm font-bold tracking-[0.3em] uppercase text-orange-400 mb-4 drop-shadow-sm">Heart . Mind . Spirit</p>
            
            {/* EXACTLY MAINTAINED HERO TITLE STYLING */}
            <h1 className="text-[5rem] md:text-[8rem] font-bold tracking-tight leading-[0.95] mb-8 text-white">
              Stake Your<br/> Ambition.
            </h1>
            <p className="max-w-xl text-xl text-white/70 font-medium leading-relaxed mb-10 drop-shadow-lg">
              The definitive Web3 vault for disciplined wealth building. The first Web3 platform that rewards discipline, not just deposits.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate(user ? '/talk' : '/login')}
                className="group inline-flex items-center gap-3 bg-white text-orange-950 px-8 py-4 rounded-full font-bold text-lg hover:bg-orange-50 transition-colors shadow-[0_0_40px_rgba(255,255,255,0.2)]"
              >
                {user ? 'Start Building' : 'Start Building'}
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-6 py-4 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10"
              >
                <LayoutDashboard className="h-5 w-5 text-orange-300" />
                Dashboard
              </button>
            </div>
          </div>
        </section>

        {/* 
          PINNED ANIMATION CONTAINER
          This section freezes on screen while the internal boxes shoot out dynamically on scroll
        */}
        <section ref={pinContainerRef} className="relative w-full h-screen flex items-center justify-center overflow-hidden">
          
          {/* BOX 1: AI CONFESSION */}
          <div className="gsap-box absolute w-full max-w-2xl bg-[#080b0f] border-2 border-cyan-500/40 p-10 rounded-[2rem] pointer-events-auto shadow-[0_0_60px_rgba(34,211,238,0.15)] flex flex-col items-center text-center">
            <Bot className="w-12 h-12 text-white mb-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-white">
              Real Financial Talk .
            </h2>
            <p className="text-lg text-white/70 leading-relaxed mb-8">
              Speak naturally to our AI for 5 minutes. Share what keeps you up at night about money. We build your personalized financial profile—not from numbers, but from what actually matters to you.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <span className="px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm font-semibold">Voice-first onboarding</span>
              <span className="px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm font-semibold">Financial AI with Emotional Quotient</span>
              <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-sm font-semibold">Private & encrypted</span>
            </div>
          </div>

          {/* BOX 2: STAKING */}
          <div className="gsap-box absolute w-full max-w-2xl bg-[#080b0f] border-2 border-blue-500/40 p-10 rounded-[2rem] pointer-events-auto shadow-[0_0_60px_rgba(59,130,246,0.15)] flex flex-col items-center text-center">
            <Shield className="w-12 h-12 text-orange-400 mb-6 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-white">
              Stake. Earn. Level Up.
            </h2>
            <p className="text-lg text-white/70 leading-relaxed mb-8">
              Back your goals securely on Ethereum. Every staked rupee increases your APY and unlocks your next tier—Bronze to Silver to Diamond. Better discipline. Better rewards.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <span className="px-4 py-1.5 rounded-full bg-white/10 border border-white/30 text-white text-sm font-bold">5% → 10% APY</span>
              <span className="px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm font-semibold">Soulbound NFT Tiers</span>
              <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-sm font-semibold">Non-custodial vaults</span>
            </div>
          </div>

          {/* BOX 3: COMMITMENT PAGE */}
          <div className="gsap-box absolute w-full max-w-2xl bg-[#080b0f] border-2 border-orange-500/40 p-10 rounded-[2rem] pointer-events-auto shadow-[0_0_60px_rgba(249,115,22,0.15)] flex flex-col items-center text-center">
            <Pickaxe className="w-12 h-12 text-white mb-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-orange-50">
              Commitment Page
            </h2>
            <p className="text-lg text-white/70 leading-relaxed mb-8">
              Track Every Rupee. Watch It Grow. Real-time visibility into your staked assets and earned yield. Every transaction logged. Every percentage point transparent. Your financial discipline, fully accountable.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <span className="px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm font-semibold">Live transaction log</span>
              <span className="px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-sm font-semibold">Dynamic APY tracker</span>
              <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-sm font-semibold">On-chain verified</span>
            </div>
          </div>

          {/* BOX 4: SOCIAL POOLS */}
          <div className="gsap-box absolute w-full max-w-2xl bg-[#080b0f] border-2 border-rose-500/40 p-10 rounded-[2rem] pointer-events-auto shadow-[0_0_60px_rgba(244,63,94,0.15)] flex flex-col items-center text-center">
            <Users className="w-12 h-12 text-orange-400 mb-6 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-white">
              Save Together. Win Together.
            </h2>
            <p className="text-lg text-white/70 leading-relaxed mb-8">
              Create a private pool with 3-4 friends. Everyone stakes. Everyone commits. Hit the group goal—unlock a bonus multiplier. Miss it? Small yield deduction. Positive peer pressure that works.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <span className="px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm font-semibold">Group staking</span>
              <span className="px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-sm font-bold">Bonus multipliers</span>
              <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-sm font-semibold">Private circles</span>
            </div>
          </div>

          {/* BOX 5: EMERGENCY WITHDRAWAL */}
          <div className="gsap-box absolute w-full max-w-2xl bg-[#080b0f] border-2 border-amber-500/40 p-10 rounded-[2rem] pointer-events-auto shadow-[0_0_60px_rgba(245,158,11,0.15)] flex flex-col items-center text-center">
            <HeartHandshake className="w-12 h-12 text-white mb-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-white">
              Life Happens. No Penalty.<br/>Just Patience.
            </h2>
            <p className="text-base md:text-lg text-white/70 leading-relaxed mb-8">
              Job loss. Medical emergency. Real life doesn't follow a smart contract schedule. Our AI detects genuine hardship — but even without it, you can withdraw anytime. No questions asked. Breaking a streak only extends your tier timeline. Your principal and past earnings stay safe.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <span className="px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm font-semibold">Withdraw anytime</span>
              <span className="px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-sm font-semibold">No APY for broken streak</span>
              <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-sm font-semibold">Tier time extends, not funds lost</span>
            </div>
          </div>

        </section>
        
        {/* FINAL CTA SECTION (Revealed after explosion) */}
        <section className="min-h-[100vh] flex flex-col justify-center items-center text-center px-6 pt-[10vh]">
          <h2 className="text-6xl md:text-8xl font-black tracking-tight mb-10 text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-200 to-orange-400 pointer-events-auto drop-shadow-2xl">
            Your Discipline.<br/>Your Legacy.
          </h2>
          <div className="pointer-events-auto flex flex-col items-center gap-4">
            <button
              onClick={() => navigate(user ? '/talk' : '/login')}
              className="group inline-flex items-center gap-3 bg-white text-orange-950 px-10 py-5 rounded-full font-bold text-xl hover:bg-orange-50 transition-colors shadow-[0_0_50px_rgba(249,115,22,0.3)]"
            >
              {user ? 'Launch App' : 'Launch App →'}
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform text-orange-500" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="text-sm font-semibold text-orange-200/90 underline-offset-4 hover:text-white hover:underline"
            >
              Open discipline dashboard
            </button>
          </div>
        </section>

      </div>


    </div>
  )
}
