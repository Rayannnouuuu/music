import { validateTab, ContentValidationError } from './validate'
import type { Tab } from './types'

export function loadAllTabs(): Tab[] {
  const modules = import.meta.glob('/src/content/tabs/*.json', { eager: true }) as Record<
    string,
    { default: unknown }
  >

  const tabs: Tab[] = []
  for (const [path, mod] of Object.entries(modules)) {
    try {
      tabs.push(validateTab(mod.default))
    } catch (err) {
      if (err instanceof ContentValidationError) {
        console.warn(`loadAllTabs: skipping invalid tab at "${path}": ${err.message}`)
      } else {
        throw err
      }
    }
  }
  return tabs
}

export interface TabFilter {
  subgenre?: string
  tuning?: string
  maxDifficulty?: number
}

export function filterTabs(tabs: Tab[], filter: TabFilter): Tab[] {
  return tabs.filter((tab) => {
    if (filter.subgenre && tab.subgenre !== filter.subgenre) return false
    if (filter.tuning && tab.tuning !== filter.tuning) return false
    if (filter.maxDifficulty !== undefined && tab.difficulty > filter.maxDifficulty) return false
    return true
  })
}
