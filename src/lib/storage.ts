export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch (err) {
    console.warn(`loadJSON: failed to read "${key}", using fallback`, err)
    return fallback
  }
}

export function saveJSON<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    console.warn(`saveJSON: failed to write "${key}"`, err)
  }
}
