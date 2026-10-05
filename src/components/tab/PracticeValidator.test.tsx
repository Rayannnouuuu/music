import { describe, test, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PracticeValidator from './PracticeValidator'
import { TUNINGS } from '../../lib/audio/tunings'
import type { TabEvent } from '../../lib/content/types'

const standard = TUNINGS.find((t) => t.id === 'standard')!

beforeEach(() => {
  Object.defineProperty(navigator, 'mediaDevices', {
    value: {
      getUserMedia: vi
        .fn()
        .mockRejectedValue(new DOMException('Permission denied', 'NotAllowedError')),
    },
    writable: true,
    configurable: true,
  })
})

function event(overrides: Partial<TabEvent> = {}): TabEvent {
  return { string: 6, fret: 0, startBeat: 0, duration: 1, ...overrides }
}

describe('PracticeValidator', () => {
  test('starts at 0 validated notes out of the total', async () => {
    render(<PracticeValidator activeEvent={event()} tuning={standard} totalNotes={4} />)
    expect(await screen.findByText('0/4 notes')).toBeInTheDocument()
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  test('manual "Valider" counts the current note and then disables itself', async () => {
    render(<PracticeValidator activeEvent={event()} tuning={standard} totalNotes={4} />)
    const validateButton = await screen.findByRole('button', { name: /valider/i })

    fireEvent.click(validateButton)
    expect(await screen.findByText('1/4 notes')).toBeInTheDocument()
    expect(validateButton).toBeDisabled()

    fireEvent.click(validateButton)
    expect(screen.getByText('1/4 notes')).toBeInTheDocument()
  })

  test('moving to a different note re-enables validation and counts it separately', async () => {
    const { rerender } = render(
      <PracticeValidator activeEvent={event({ fret: 0 })} tuning={standard} totalNotes={4} />,
    )
    const validateButton = await screen.findByRole('button', { name: /valider/i })
    fireEvent.click(validateButton)
    expect(await screen.findByText('1/4 notes')).toBeInTheDocument()

    rerender(<PracticeValidator activeEvent={event({ fret: 3 })} tuning={standard} totalNotes={4} />)
    const stillButton = screen.getByRole('button', { name: /valider/i })
    expect(stillButton).not.toBeDisabled()
    fireEvent.click(stillButton)
    expect(await screen.findByText('2/4 notes')).toBeInTheDocument()
  })

  test('revisiting an already-validated note does not double count it', async () => {
    const { rerender } = render(
      <PracticeValidator activeEvent={event({ fret: 0 })} tuning={standard} totalNotes={4} />,
    )
    fireEvent.click(await screen.findByRole('button', { name: /valider/i }))
    expect(await screen.findByText('1/4 notes')).toBeInTheDocument()

    rerender(<PracticeValidator activeEvent={event({ fret: 3 })} tuning={standard} totalNotes={4} />)
    rerender(<PracticeValidator activeEvent={event({ fret: 0 })} tuning={standard} totalNotes={4} />)
    expect(screen.getByRole('button', { name: /valider/i })).toBeDisabled()
    expect(screen.getByText('1/4 notes')).toBeInTheDocument()
  })

  test('fires onValidated once coverage reaches 90%, not before', async () => {
    const onValidated = vi.fn()
    let current = event({ fret: 0, startBeat: 0 })
    const { rerender } = render(
      <PracticeValidator activeEvent={current} tuning={standard} totalNotes={10} onValidated={onValidated} />,
    )

    // Validate 8 of 10 distinct notes (80%) — should not fire yet.
    for (let i = 0; i < 8; i++) {
      current = event({ fret: i, startBeat: i })
      rerender(
        <PracticeValidator activeEvent={current} tuning={standard} totalNotes={10} onValidated={onValidated} />,
      )
      fireEvent.click(screen.getByRole('button', { name: /valider/i }))
    }
    expect(await screen.findByText('8/10 notes')).toBeInTheDocument()
    expect(onValidated).not.toHaveBeenCalled()

    // A 9th distinct note crosses 90%.
    current = event({ fret: 9, startBeat: 9 })
    rerender(
      <PracticeValidator activeEvent={current} tuning={standard} totalNotes={10} onValidated={onValidated} />,
    )
    fireEvent.click(screen.getByRole('button', { name: /valider/i }))

    expect(await screen.findByText('9/10 notes')).toBeInTheDocument()
    expect(onValidated).toHaveBeenCalledTimes(1)
    expect(await screen.findByText(/morceau validé/i)).toBeInTheDocument()
  })

  test('shows a mic-unavailable state when microphone access is denied', async () => {
    render(<PracticeValidator activeEvent={event()} tuning={standard} totalNotes={4} />)
    expect(await screen.findByText(/micro indisponible/i)).toBeInTheDocument()
  })
})
