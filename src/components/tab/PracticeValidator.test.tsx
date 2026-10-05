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
  test('starts at 0 validated notes', async () => {
    render(<PracticeValidator activeEvent={event()} tuning={standard} />)
    expect(await screen.findByText(/0 bonne note/i)).toBeInTheDocument()
  })

  test('manual "Valider" increments the counter and then disables itself', async () => {
    render(<PracticeValidator activeEvent={event()} tuning={standard} />)
    const validateButton = await screen.findByRole('button', { name: /valider/i })

    fireEvent.click(validateButton)
    expect(await screen.findByText(/1 bonne note/i)).toBeInTheDocument()
    expect(validateButton).toBeDisabled()

    fireEvent.click(validateButton)
    expect(screen.getByText(/1 bonne note/i)).toBeInTheDocument()
  })

  test('moving to a different note re-enables validation', async () => {
    const { rerender } = render(<PracticeValidator activeEvent={event({ fret: 0 })} tuning={standard} />)
    const validateButton = await screen.findByRole('button', { name: /valider/i })
    fireEvent.click(validateButton)
    expect(await screen.findByText(/1 bonne note/i)).toBeInTheDocument()

    rerender(<PracticeValidator activeEvent={event({ fret: 3 })} tuning={standard} />)
    const stillButton = screen.getByRole('button', { name: /valider/i })
    expect(stillButton).not.toBeDisabled()
    fireEvent.click(stillButton)
    expect(await screen.findByText(/2 bonnes notes/i)).toBeInTheDocument()
  })

  test('shows a mic-unavailable state when microphone access is denied', async () => {
    render(<PracticeValidator activeEvent={event()} tuning={standard} />)
    expect(await screen.findByText(/micro indisponible/i)).toBeInTheDocument()
  })
})
