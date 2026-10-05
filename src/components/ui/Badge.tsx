import type { HTMLAttributes } from 'react'

export function Badge({ className = '', children, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-[var(--radius-control)] border border-border-soft bg-panel px-2.5 py-1 text-xs text-text-muted ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
