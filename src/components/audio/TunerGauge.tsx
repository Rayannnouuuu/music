import { motion } from 'motion/react'

interface TunerGaugeProps {
  cents: number
  hasReading: boolean
  inTune: boolean
}

const IN_TUNE_THRESHOLD = 5
const PIVOT = { x: 150, y: 170 }
const RADIUS = 140

function pointAt(angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180
  return {
    x: PIVOT.x + RADIUS * Math.sin(rad),
    y: PIVOT.y - RADIUS * Math.cos(rad),
  }
}

function angleForCents(cents: number) {
  return (cents / 50) * 60
}

function arcPath(fromCents: number, toCents: number) {
  const from = pointAt(angleForCents(fromCents))
  const to = pointAt(angleForCents(toCents))
  return `M ${from.x} ${from.y} A ${RADIUS} ${RADIUS} 0 0 1 ${to.x} ${to.y}`
}

const TICKS = [-50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50]

export default function TunerGauge({ cents, hasReading, inTune }: TunerGaugeProps) {
  const needleAngle = hasReading ? angleForCents(cents) : 0
  const needleColor = inTune ? 'var(--color-success)' : 'var(--color-accent)'

  return (
    <div
      className="relative mx-auto"
      style={{ width: 'clamp(260px, 80vw, 360px)', aspectRatio: '5 / 3' }}
    >
      <svg viewBox="0 0 300 180" className="absolute inset-0 h-full w-full overflow-visible">
        <path
          d={arcPath(-50, 50)}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={16}
          strokeLinecap="round"
        />
        <path
          d={arcPath(-50, -IN_TUNE_THRESHOLD)}
          fill="none"
          stroke="var(--color-warning-soft)"
          strokeWidth={16}
          strokeLinecap="round"
        />
        <path
          d={arcPath(IN_TUNE_THRESHOLD, 50)}
          fill="none"
          stroke="var(--color-warning-soft)"
          strokeWidth={16}
          strokeLinecap="round"
        />
        <path
          d={arcPath(-IN_TUNE_THRESHOLD, IN_TUNE_THRESHOLD)}
          fill="none"
          stroke={inTune && hasReading ? 'var(--color-success)' : 'var(--color-success-soft)'}
          strokeWidth={16}
          strokeLinecap="round"
          style={{ transition: 'stroke 0.2s ease' }}
        />

        {TICKS.map((tick) => {
          const angle = angleForCents(tick)
          const outer = pointAt(angle)
          const innerPoint = {
            x: PIVOT.x + (RADIUS - 20) * Math.sin((angle * Math.PI) / 180),
            y: PIVOT.y - (RADIUS - 20) * Math.cos((angle * Math.PI) / 180),
          }
          return (
            <line
              key={tick}
              x1={innerPoint.x}
              y1={innerPoint.y}
              x2={outer.x}
              y2={outer.y}
              stroke="var(--color-border-soft)"
              strokeWidth={tick === 0 ? 3 : 1.5}
            />
          )
        })}
      </svg>

      <motion.div
        className="absolute bottom-[6%] left-1/2 w-1 origin-bottom rounded-full"
        style={{
          height: '68%',
          backgroundColor: needleColor,
          boxShadow: `0 0 16px ${needleColor}`,
          marginLeft: '-2px',
        }}
        animate={{ rotate: needleAngle }}
        transition={{ type: 'spring', stiffness: 120, damping: 14 }}
      />
      <div
        className="absolute bottom-[6%] left-1/2 h-4 w-4 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-bg"
        style={{ backgroundColor: needleColor, boxShadow: `0 0 12px ${needleColor}` }}
      />
    </div>
  )
}
