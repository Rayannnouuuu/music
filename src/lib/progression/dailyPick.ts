import type { Tab } from '../content/types'

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

export function pickDailyTab(tabs: Tab[], date: string): Tab {
  return tabs[hashString(date) % tabs.length]
}
