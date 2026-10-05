import { motion } from 'motion/react'
import type { GuitarString } from '../../lib/content/types'

interface FretboardDiagramProps {
  activeString?: GuitarString
  activeFret?: number
}

const STRINGS: GuitarString[] = [1, 2, 3, 4, 5, 6]
const FRETS = Array.from({ length: 15 }, (_, i) => i) // frets 0-14
const INLAY_FRETS = new Set([3, 5, 7, 9, 12, 15])

const CELL_WIDTH = 30
const CELL_HEIGHT = 20

export default function FretboardDiagram({ activeString, activeFret }: FretboardDiagramProps) {
  const width = FRETS.length * CELL_WIDTH
  const height = STRINGS.length * CELL_HEIGHT

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-2xl overflow-visible">
      {FRETS.filter((f) => INLAY_FRETS.has(f)).map((fret) => (
        <circle
          key={`inlay-${fret}`}
          cx={fret * CELL_WIDTH + CELL_WIDTH / 2}
          cy={height / 2}
          r={3}
          fill="var(--color-text-muted)"
          fillOpacity={0.45}
        />
      ))}

      {FRETS.map((fret) => (
        <line
          key={`fret-line-${fret}`}
          x1={fret * CELL_WIDTH}
          y1={0}
          x2={fret * CELL_WIDTH}
          y2={height}
          stroke="var(--color-text-muted)"
          strokeOpacity={fret === 0 ? 0.75 : 0.35}
          strokeWidth={fret === 0 ? 3 : 1}
        />
      ))}

      {STRINGS.map((string, rowIndex) => (
        <line
          key={`string-line-${string}`}
          x1={0}
          y1={rowIndex * CELL_HEIGHT + CELL_HEIGHT / 2}
          x2={width}
          y2={rowIndex * CELL_HEIGHT + CELL_HEIGHT / 2}
          stroke="var(--color-text-muted)"
          strokeOpacity={0.5}
          strokeWidth={0.75 + string * 0.3}
        />
      ))}

      {STRINGS.map((string, rowIndex) =>
        FRETS.map((fret) => {
          const isActive = activeString === string && activeFret === fret
          return (
            <g
              key={`${string}-${fret}`}
              data-testid={`fret-${string}-${fret}`}
              className={isActive ? 'fret-active' : undefined}
            >
              {isActive && (
                <motion.circle
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  cx={fret * CELL_WIDTH + CELL_WIDTH / 2}
                  cy={rowIndex * CELL_HEIGHT + CELL_HEIGHT / 2}
                  r={7.5}
                  fill="var(--color-accent)"
                  stroke="var(--color-bg)"
                  strokeWidth={1.5}
                />
              )}
            </g>
          )
        }),
      )}
    </svg>
  )
}
