import type { HTMLAttributes } from 'react'
import { motion } from 'motion/react'

type DivPropsSafeForMotion = Omit<
  HTMLAttributes<HTMLDivElement>,
  'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'
>

interface CardProps extends DivPropsSafeForMotion {
  interactive?: boolean
}

export function Card({ interactive = false, className = '', children, ...props }: CardProps) {
  if (!interactive) {
    return (
      <div className={`rounded-[var(--radius-card)] border border-border bg-panel ${className}`} {...props}>
        {children}
      </div>
    )
  }

  return (
    <motion.div
      className={`rounded-[var(--radius-card)] border border-border bg-panel
        transition-colors duration-200 hover:bg-panel-hover hover:border-accent-soft
        ${className}`}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.985, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
