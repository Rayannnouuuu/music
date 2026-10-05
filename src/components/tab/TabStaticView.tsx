import type { Measure } from '../../lib/content/types'
import { renderMeasureToLines, columnForBeat, TECHNIQUE_SUFFIX } from '../../lib/tab/renderGrid'

interface TabStaticViewProps {
  measure: Measure
  highlightIndex?: number
}

export default function TabStaticView({ measure, highlightIndex }: TabStaticViewProps) {
  const lines = renderMeasureToLines(measure)
  const highlightEvent = highlightIndex !== undefined ? measure.events[highlightIndex] : undefined
  const highlightLine = highlightEvent ? highlightEvent.string - 1 : -1
  const highlightCol = highlightEvent ? columnForBeat(highlightEvent.startBeat) : -1
  const highlightSuffix = highlightEvent?.technique ? TECHNIQUE_SUFFIX[highlightEvent.technique] : ''
  const highlightLen = highlightEvent ? String(highlightEvent.fret).length + highlightSuffix.length : 0

  return (
    <pre className="font-mono text-text leading-tight whitespace-pre">
      {lines.map((line, i) =>
        i === highlightLine ? (
          <div key={i}>
            {line.slice(0, highlightCol)}
            <span className="text-accent font-bold">
              {line.slice(highlightCol, highlightCol + highlightLen)}
            </span>
            {line.slice(highlightCol + highlightLen)}
          </div>
        ) : (
          <div key={i}>{line}</div>
        ),
      )}
    </pre>
  )
}
