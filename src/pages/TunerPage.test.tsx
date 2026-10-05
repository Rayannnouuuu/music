import { describe, test, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TunerPage from './TunerPage'
import { ProgressionProvider } from '../lib/progression/ProgressionContext'

beforeEach(() => {
  localStorage.clear()
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

describe('TunerPage', () => {
  test('shows a fallback message when microphone access is denied', async () => {
    render(
      <ProgressionProvider>
        <TunerPage />
      </ProgressionProvider>,
    )

    const message = await screen.findByText(/microphone/i)
    expect(message).toBeInTheDocument()
    expect(screen.queryByTestId('tuner-reading')).not.toBeInTheDocument()
  })

  test('selecting a tuning persists it to progress state for use elsewhere (e.g. exercises)', () => {
    render(
      <ProgressionProvider>
        <TunerPage />
      </ProgressionProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: /drop d/i }))

    const saved = JSON.parse(localStorage.getItem('guitar-progress') ?? '{}')
    expect(saved.guitarTuningId).toBe('dropD')
  })
})
