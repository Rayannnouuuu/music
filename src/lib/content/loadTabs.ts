import { validateTab } from './validate'
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
      // Never let one bad content file blank the whole app — skip and warn,
      // regardless of what validateTab happened to throw.
      console.warn(`loadAllTabs: skipping invalid tab at "${path}":`, err)
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
