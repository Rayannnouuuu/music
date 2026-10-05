import type { GuitarString } from '../../lib/content/types'

interface FretboardDiagramProps {
  activeString?: GuitarString
  activeFret?: number
}

const STRINGS: GuitarString[] = [1, 2, 3, 4, 5, 6]
const FRETS = Array.from({ length: 15 }, (_, i) => i) // frets 0-14

const CELL_WIDTH = 30
const CELL_HEIGHT = 20

export default function FretboardDiagram({ activeString, activeFret }: FretboardDiagramProps) {
  const width = FRETS.length * CELL_WIDTH
  const height = STRINGS.length * CELL_HEIGHT

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-2xl">
      {STRINGS.map((string, rowIndex) =>
        FRETS.map((fret) => {
          const isActive = activeString === string && activeFret === fret
          return (
            <g
              key={`${string}-${fret}`}
              data-testid={`fret-${string}-${fret}`}
              className={isActive ? 'fret-active' : undefined}
            >
              <rect
                x={fret * CELL_WIDTH}
                y={rowIndex * CELL_HEIGHT}
                width={CELL_WIDTH}
                height={CELL_HEIGHT}
                fill="none"
                stroke="var(--color-border)"
              />
              {isActive && (
                <circle
                  cx={fret * CELL_WIDTH + CELL_WIDTH / 2}
                  cy={rowIndex * CELL_HEIGHT + CELL_HEIGHT / 2}
                  r={7}
                  fill="var(--color-accent)"
                />
              )}
            </g>
          )
        }),
      )}
    </svg>
  )
}
