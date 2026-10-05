interface DifficultyMeterProps {
  value: number
  max?: number
}

export function DifficultyMeter({ value, max = 10 }: DifficultyMeterProps) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Difficulté ${value}/${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${i < value ? 'bg-accent' : 'bg-border'}`}
        />
      ))}
    </div>
  )
}
