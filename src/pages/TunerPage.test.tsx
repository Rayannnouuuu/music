import { describe, test, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import TunerPage from './TunerPage'

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

describe('TunerPage', () => {
  test('shows a fallback message when microphone access is denied', async () => {
    render(<TunerPage />)

    const message = await screen.findByText(/microphone/i)
    expect(message).toBeInTheDocument()
    expect(screen.queryByTestId('tuner-reading')).not.toBeInTheDocument()
  })
})
