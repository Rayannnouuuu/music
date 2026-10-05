export interface BadgeCheckInput {
  streakCurrent: number
  globalLevel: number
  skillLevels: Record<string, number>
  tabsCompletedCount: number
}

export interface Badge {
  id: string
  label: string
  isUnlocked(input: BadgeCheckInput): boolean
}

function anySkillAtLeast(skillLevels: Record<string, number>, threshold: number): boolean {
  return Object.values(skillLevels).some((level) => level >= threshold)
}

export const BADGES: Badge[] = [
  {
    id: 'premiere-semaine',
    label: 'Première semaine',
    isUnlocked: (input) => input.streakCurrent >= 7,
  },
  {
    id: 'un-mois',
    label: 'Un mois de rigueur',
    isUnlocked: (input) => input.streakCurrent >= 30,
  },
  {
    id: 'centurion',
    label: 'Centurion',
    isUnlocked: (input) => input.streakCurrent >= 100,
  },
  {
    id: 'premier-riff',
    label: 'Premier riff',
    isUnlocked: (input) => input.tabsCompletedCount >= 1,
  },
  {
    id: 'dix-riffs',
    label: 'Dix riffs',
    isUnlocked: (input) => input.tabsCompletedCount >= 10,
  },
  {
    id: 'monte-en-gamme',
    label: 'Monte en gamme',
    isUnlocked: (input) => anySkillAtLeast(input.skillLevels, 10),
  },
  {
    id: 'virtuose-en-herbe',
    label: 'Virtuose en herbe',
    isUnlocked: (input) => input.globalLevel >= 25,
  },
  {
    id: 'shred-master',
    label: 'Shred Master',
    isUnlocked: (input) => anySkillAtLeast(input.skillLevels, 25),
  },
]

export function evaluateBadges(input: BadgeCheckInput, alreadyUnlocked: string[]): string[] {
  return BADGES.filter(
    (badge) => badge.isUnlocked(input) && !alreadyUnlocked.includes(badge.id),
  ).map((badge) => badge.id)
}
