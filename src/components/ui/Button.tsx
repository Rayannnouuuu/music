import { type ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'md' | 'sm' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-accent text-text hover:bg-accent-strong shadow-[0_0_0_1px_var(--color-accent-soft),0_8px_24px_-8px_var(--color-accent-soft)]',
  secondary:
    'bg-transparent text-text border border-border hover:border-accent hover:text-accent-strong',
  ghost: 'bg-transparent text-text-muted hover:text-text hover:bg-panel-hover',
}

const SIZE_CLASSES: Record<Size, string> = {
  md: 'h-11 px-5 text-sm gap-2',
  sm: 'h-9 px-4 text-xs gap-1.5',
  icon: 'h-11 w-11 shrink-0',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className = '', children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center rounded-[var(--radius-control)] font-semibold
        transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]
        active:scale-[0.96] disabled:opacity-40 disabled:pointer-events-none
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg
        ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
})
