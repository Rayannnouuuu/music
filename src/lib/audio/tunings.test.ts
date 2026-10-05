import { describe, test, expect } from 'vitest'
import { findTuningByLabel, TUNINGS } from './tunings'

describe('findTuningByLabel', () => {
  test('matches by exact id, case-insensitively', () => {
    expect(findTuningByLabel('Standard').id).toBe('standard')
    expect(findTuningByLabel('eb').id).toBe('eb')
  })

  test('matches a short label like "Drop D" against the fuller label', () => {
    expect(findTuningByLabel('Drop D').id).toBe('dropD')
  })

  test('matches "Open G" and "Open D" against their labels', () => {
    expect(findTuningByLabel('Open G').id).toBe('openG')
    expect(findTuningByLabel('Open D').id).toBe('openD')
  })

  test('falls back to standard tuning for an unrecognized label', () => {
    expect(findTuningByLabel('Some Weird Tuning').id).toBe(TUNINGS[0].id)
  })
})
