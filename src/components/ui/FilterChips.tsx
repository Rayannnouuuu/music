import { motion } from 'motion/react'

interface FilterChipsProps<T extends string> {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  layoutId: string
  className?: string
}

export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  layoutId,
  className = '',
}: FilterChipsProps<T>) {
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`relative rounded-[var(--radius-control)] border px-3.5 py-1.5 text-sm font-medium capitalize transition-colors ${
              active
                ? 'border-accent-soft text-accent-strong'
                : 'border-border text-text-muted hover:border-accent-soft hover:text-text'
            }`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-[var(--radius-control)] bg-accent-soft"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}
