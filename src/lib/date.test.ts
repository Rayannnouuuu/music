import { describe, test, expect } from 'vitest'
import { localDateString } from './date'

describe('localDateString', () => {
  test('formats year-month-day with zero-padding', () => {
    expect(localDateString(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  test('pads a double-digit month and day correctly (no padding needed)', () => {
    expect(localDateString(new Date(2026, 9, 31))).toBe('2026-10-31')
  })

  test('uses local date components, not UTC ones', () => {
    // A date constructed from local y/m/d components must round-trip
    // through getFullYear/getMonth/getDate, never getUTCFullYear/etc.
    const date = new Date(2026, 2, 1) // local March 1st
    expect(localDateString(date)).toBe('2026-03-01')
  })
})
