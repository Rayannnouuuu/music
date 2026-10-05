import { motion } from 'motion/react'

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
    <svg
      viewBox={`0 0 ${width} ${CHART_HEIGHT + 34}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ height: CHART_HEIGHT + 34 }}
      className="w-full max-w-full overflow-visible"
    >
      <defs>
        <linearGradient id="bar-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-accent-strong)" />
          <stop offset="100%" stopColor="var(--color-accent)" />
        </linearGradient>
      </defs>
      {data.map((d, i) => {
        const barHeight = (d.value / max) * CHART_HEIGHT
        const x = i * (BAR_WIDTH + GAP)
        return (
          <g key={d.label}>
            <text
              x={x + BAR_WIDTH / 2}
              y={CHART_HEIGHT - barHeight - 8}
              textAnchor="middle"
              fontSize="11"
              fontWeight={600}
              fill="var(--color-text-muted)"
            >
              {d.value}
            </text>
            <motion.rect
              x={x}
              width={BAR_WIDTH}
              rx={6}
              fill="url(#bar-gradient)"
              initial={{ height: 0, y: CHART_HEIGHT }}
              animate={{ height: barHeight, y: CHART_HEIGHT - barHeight }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: i * 0.03 }}
            />
            <text
              x={x + BAR_WIDTH / 2}
              y={CHART_HEIGHT + 20}
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
