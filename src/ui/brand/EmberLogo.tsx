import { motion } from 'framer-motion'

export function EmberLogo(props: { className?: string }) {
  return (
    <motion.div
      className={props.className}
      initial={{ rotate: -2, y: 0 }}
      animate={{ rotate: [ -2, 2, -2 ], y: [0, -2, 0] }}
      transition={{ duration: 6.8, repeat: Infinity, ease: 'easeInOut' }}
      aria-label="Ember"
      title="Ember"
    >
      <svg width="28" height="28" viewBox="0 0 48 48" fill="none" role="img">
        <defs>
          <linearGradient id="ember_g" x1="10" y1="8" x2="42" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FF6F00" />
            <stop offset="1" stopColor="#206FFF" />
          </linearGradient>
        </defs>
        <path
          d="M24 4c7 6 12 13 12 20 0 8-6 14-12 14S12 32 12 24c0-7 5-14 12-20Z"
          fill="url(#ember_g)"
        />
        <path
          d="M24 14c3 3 6 7 6 11 0 4-3 7-6 7s-6-3-6-7c0-4 3-8 6-11Z"
          fill="rgba(255,255,255,0.55)"
        />
      </svg>
    </motion.div>
  )
}

