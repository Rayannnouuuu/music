export function xpToNext(level: number): number {
  return 100 + (level - 1) * 50
}

export function cumulativeXpForLevel(level: number): number {
  let total = 0
  for (let l = 1; l < level; l++) {
    total += xpToNext(l)
  }
  return total
}

export function levelFromXp(xpTotal: number): number {
  let level = 1
  while (cumulativeXpForLevel(level + 1) <= xpTotal) {
    level++
  }
  return level
}

export type Tier = 'Débutant' | 'Intermédiaire' | 'Avancé' | 'Expert' | 'Virtuose'

export function tierName(level: number): Tier {
  if (level < 10) return 'Débutant'
  if (level < 20) return 'Intermédiaire'
  if (level < 35) return 'Avancé'
  if (level < 50) return 'Expert'
  return 'Virtuose'
}
