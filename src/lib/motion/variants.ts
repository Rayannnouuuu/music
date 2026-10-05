import type { Variants } from 'motion/react'

const EASE_OUT = [0.16, 1, 0.3, 1] as const

// Shared Framer Motion variants so list/grid reveals feel consistent across pages.
export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05, delayChildren: 0.02 },
  },
}

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE_OUT } },
}

export const fadeInScale: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: EASE_OUT } },
}

// For grids that can grow large (100 exercises, 40+ tabs), per-item
// staggerChildren would take seconds to finish. This gives each item its
// own initial/animate/transition with a delay capped regardless of the
// list length, instead of relying on parent-driven staggerChildren.
export function fadeInUpDelayed(index: number, step = 0.03, max = 0.3) {
  return {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: EASE_OUT, delay: Math.min(index * step, max) },
  }
}

export const shake = {
  x: [0, -6, 6, -4, 4, 0],
  transition: { duration: 0.4, ease: 'easeInOut' as const },
}
