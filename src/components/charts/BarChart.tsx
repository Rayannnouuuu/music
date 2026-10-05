interface BarChartProps {
  data: { label: string; value: number }[]
}

const BAR_WIDTH = 40
const GAP = 12
const CHART_HEIGHT = 120

export default function BarChart({ data }: BarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value))
  const width = Math.max(1, data.length) * (BAR_WIDTH + GAP)

  return (
    <svg viewBox={`0 0 ${width} ${CHART_HEIGHT + 20}`} className="w-full max-w-full">
      {data.map((d, i) => {
        const barHeight = (d.value / max) * CHART_HEIGHT
        const x = i * (BAR_WIDTH + GAP)
        return (
          <g key={d.label}>
            <rect
              x={x}
              y={CHART_HEIGHT - barHeight}
              width={BAR_WIDTH}
              height={barHeight}
              fill="var(--color-accent)"
            />
            <text
              x={x + BAR_WIDTH / 2}
              y={CHART_HEIGHT + 14}
              textAnchor="middle"
              fontSize="10"
              fill="var(--color-text-muted)"
            >
              {d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
