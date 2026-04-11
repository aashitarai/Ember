import { useEffect, useRef, type ReactNode } from 'react'
import gsap from 'gsap'

interface MagneticProps {
  children: ReactNode
  className?: string
  strength?: number
}

export function Magnetic({ children, className = '', strength = 30 }: MagneticProps) {
  const magneticRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = magneticRef.current
    if (!el) return

    const xTo = gsap.quickTo(el, "x", { duration: 1, ease: "elastic.out(1, 0.3)" })
    const yTo = gsap.quickTo(el, "y", { duration: 1, ease: "elastic.out(1, 0.3)" })

    const mouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e
      const { height, width, left, top } = el.getBoundingClientRect()
      
      const x = clientX - (left + width / 2)
      const y = clientY - (top + height / 2)

      xTo(x * (strength / 100))
      yTo(y * (strength / 100))
    }

    const mouseLeave = () => {
      xTo(0)
      yTo(0)
    }

    el.addEventListener('mousemove', mouseMove)
    el.addEventListener('mouseleave', mouseLeave)

    return () => {
      el.removeEventListener('mousemove', mouseMove)
      el.removeEventListener('mouseleave', mouseLeave)
    }
  }, [strength])

  return (
    <div ref={magneticRef} className={`inline-block ${className}`}>
      {children}
    </div>
  )
}
