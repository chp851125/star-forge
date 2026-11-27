import type { Resources } from '../types'

export const QUOTA_PRESETS: { id: 'easy' | 'normal' | 'hard'; label: string; quota: Resources }[] = [
  { id: 'easy', label: '簡單', quota: { starStone: 150, rerollStone: 100 } },
  { id: 'normal', label: '普通', quota: { starStone: 80, rerollStone: 50 } },
  { id: 'hard', label: '困難', quota: { starStone: 40, rerollStone: 25 } },
]

export const DEFAULT_TURNS = 50
export const DEFAULT_CUSTOM: Resources = { starStone: 100, rerollStone: 60 }

/** 數字輸入的範圍與快速選項 */
export const STONE_INPUT = {
  starStone: { min: 1, max: 9999, presets: [100, 300, 1000] },
  rerollStone: { min: 1, max: 9999, presets: [50, 150, 500] },
}
export const TURNS_INPUT = { min: 1, max: 999, presets: [30, 60, 100] }
