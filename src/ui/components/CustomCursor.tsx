import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const trailerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const cursor = cursorRef.current
    const trailer = trailerRef.current
    if (!cursor || !trailer) return

    const cursorTo = gsap.quickTo(cursor, "x", { duration: 0.1, ease: "power3" })
    const cursorToY = gsap.quickTo(cursor, "y", { duration: 0.1, ease: "power3" })
    
    const trailerTo = gsap.quickTo(trailer, "x", { duration: 0.5, ease: "power3.out" })
    const trailerToY = gsap.quickTo(trailer, "y", { duration: 0.5, ease: "power3.out" })

    const onMove = (e: MouseEvent) => {
      cursorTo(e.clientX)
      cursorToY(e.clientY)
      trailerTo(e.clientX)
      trailerToY(e.clientY)
    }

    const onHoverEnter = () => {
      gsap.to(cursor, { scale: 1.5, duration: 0.2 })
      gsap.to(trailer, { scale: 0.5, opacity: 0, duration: 0.2 })
    }
    const onHoverLeave = () => {
      gsap.to(cursor, { scale: 1, duration: 0.2 })
      gsap.to(trailer, { scale: 1, opacity: 0.8, duration: 0.2 })
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    
    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('button, a, input, select, textarea, [role="button"]')) {
        onHoverEnter()
      } else {
        onHoverLeave()
      }
    }
    window.addEventListener('mouseover', onMouseOver, { passive: true })

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onMouseOver)
    }
  }, [])

  return (
    <>
      <div 
        ref={cursorRef} 
        className="fixed top-0 left-0 w-3 h-3 rounded-full pointer-events-none z-[9999] shadow-[0_0_15px_rgba(255,255,255,1)] bg-[#0a0c10] -translate-x-1/2 -translate-y-1/2 transition-shadow"
      />
      <div 
        ref={trailerRef} 
        className="fixed top-0 left-0 w-8 h-8 rounded-full pointer-events-none z-[9998] opacity-80 backdrop-blur-[2px] bg-[#0a0c10]/10 shadow-[0_0_20px_rgba(255,255,255,0.4)] border border-white/40 -translate-x-1/2 -translate-y-1/2"
      />
    </>
  )
}

