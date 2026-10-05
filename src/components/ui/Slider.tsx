interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  formatValue?: (value: number) => string
  disabled?: boolean
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  formatValue,
  disabled = false,
}: SliderProps) {
  const percent = ((value - min) / (max - min)) * 100

  return (
    <label className="flex flex-col gap-2 text-sm select-none">
      <span className="flex items-center justify-between text-text-muted">
        <span>{label}</span>
        <span className="font-mono font-medium text-text tabular-nums">
          {formatValue ? formatValue(value) : value}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="guitar-slider"
        style={{
          background: `linear-gradient(to right, var(--color-accent) ${percent}%, var(--color-border) ${percent}%)`,
        }}
      />
    </label>
  )
}
