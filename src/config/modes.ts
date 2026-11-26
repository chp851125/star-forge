import type { Resources } from '../types'

export const QUOTA_PRESETS: { id: 'easy' | 'normal' | 'hard'; label: string; quota: Resources }[] = [
  { id: 'easy', label: '簡單', quota: { starStone: 150, rerollStone: 100 } },
  { id: 'normal', label: '普通', quota: { starStone: 80, rerollStone: 50 } },
  { id: 'hard', label: '困難', quota: { starStone: 40, rerollStone: 25 } },
]

export const DEFAULT_TURNS = 50
export const DEFAULT_CUSTOM: Resources = { starStone: 100, rerollStone: 60 }
export const INFINITE_GOALS = ['', '+15', '+15 且三條皆金以上', '三條皆頂規']
