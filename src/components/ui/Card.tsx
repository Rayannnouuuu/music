import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
}

export function Card({ interactive = false, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-[var(--radius-card)] border border-border bg-panel
        ${interactive ? 'transition-colors duration-200 hover:bg-panel-hover hover:border-accent-soft' : ''}
        ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
