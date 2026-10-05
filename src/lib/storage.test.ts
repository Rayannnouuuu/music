import { describe, test, expect, beforeEach, vi } from 'vitest'
import { loadJSON, saveJSON } from './storage'

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('loadJSON', () => {
  test('returns fallback when key is missing', () => {
    expect(loadJSON('missing-key', { a: 1 })).toEqual({ a: 1 })
  })

  test('returns fallback when stored string is invalid JSON', () => {
    localStorage.setItem('bad-key', '{not valid json')
    expect(loadJSON('bad-key', { a: 1 })).toEqual({ a: 1 })
  })
})

describe('saveJSON + loadJSON round trip', () => {
  test('loadJSON returns what saveJSON stored', () => {
    saveJSON('round-trip-key', { a: 1, b: [1, 2, 3] })
    expect(loadJSON('round-trip-key', null)).toEqual({ a: 1, b: [1, 2, 3] })
  })
})

describe('saveJSON', () => {
  test('does not throw when localStorage.setItem throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota exceeded', 'QuotaExceededError')
    })
    expect(() => saveJSON('quota-key', { a: 1 })).not.toThrow()
  })
})
