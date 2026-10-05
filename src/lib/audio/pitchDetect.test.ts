import { describe, test, expect } from 'vitest'
import { detectPitch } from './pitchDetect'

function sineWave(freq: number, sampleRate: number, length: number): Float32Array {
  const buffer = new Float32Array(length)
  for (let i = 0; i < length; i++) {
    buffer[i] = Math.sin((2 * Math.PI * freq * i) / sampleRate)
  }
  return buffer
}

describe('detectPitch', () => {
  const sampleRate = 44100
  const length = 4096

  for (const freq of [110, 220, 440]) {
    test(`detects a ${freq} Hz sine wave within +/-1 Hz`, () => {
      const buffer = sineWave(freq, sampleRate, length)
      const detected = detectPitch(buffer, sampleRate)
      expect(detected).not.toBeNull()
      expect(Math.abs((detected as number) - freq)).toBeLessThanOrEqual(1)
    })
  }

  test('returns null for silence', () => {
    const buffer = new Float32Array(length) // all zeros
    expect(detectPitch(buffer, sampleRate)).toBeNull()
  })

  test('returns null for low-amplitude noise', () => {
    const buffer = new Float32Array(length)
    for (let i = 0; i < length; i++) {
      buffer[i] = (Math.random() - 0.5) * 0.001
    }
    expect(detectPitch(buffer, sampleRate)).toBeNull()
  })
})
