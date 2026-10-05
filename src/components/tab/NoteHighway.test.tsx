import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import NoteHighway from './NoteHighway'
import type { TabEvent } from '../../lib/content/types'

describe('NoteHighway', () => {
  const events: TabEvent[] = [
    { string: 1, fret: 5, startBeat: 0, duration: 1 },
    { string: 6, fret: 3, startBeat: 1, duration: 1, technique: 'hammer' },
  ]

  test('renders a note badge per event with its fret number', () => {
    render(<NoteHighway events={events} totalBeats={4} />)
    expect(screen.getByTestId('note-1-5')).toHaveTextContent('5')
    expect(screen.getByTestId('note-6-3')).toHaveTextContent('3')
  })

  test('shows a technique label next to the note', () => {
    render(<NoteHighway events={events} totalBeats={4} />)
    expect(screen.getByTestId('note-6-3')).toHaveTextContent('H')
  })

  test('marks the note at the current beat as active, others as not', () => {
    render(<NoteHighway events={events} totalBeats={4} activeBeat={0.5} />)
    expect(screen.getByTestId('note-1-5').className).toContain('border-accent')
    expect(screen.getByTestId('note-6-3').className).not.toContain('border-accent')
  })

  test('with no activeBeat, nothing is marked active', () => {
    render(<NoteHighway events={events} totalBeats={4} />)
    expect(screen.getByTestId('note-1-5').className).not.toContain('border-accent')
  })
})
