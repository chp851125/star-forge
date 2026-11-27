import type { GameMode, Resources } from '../types'

type Preset = Extract<GameMode, { kind: 'limited' }>['preset']
type Difficulty = 'easy' | 'normal' | 'hard'

export const PRESET_LABEL: Record<Preset, string> = {
  easy: '簡單', normal: '普通', hard: '困難', custom: '自訂額度', turns: '次數制',
}

export const QUOTA_PRESETS: { id: Difficulty; quota: Resources }[] = [
  { id: 'easy', quota: { starStone: 800, rerollStone: 300 } },
  { id: 'normal', quota: { starStone: 400, rerollStone: 150 } },
  { id: 'hard', quota: { starStone: 200, rerollStone: 80 } },
]

/** 次數制預設操作次數(石頭不設限) */
export const TURNS_PRESETS: { id: Difficulty; turns: number }[] = [
  { id: 'easy', turns: 120 },
  { id: 'normal', turns: 80 },
  { id: 'hard', turns: 50 },
]

export const DEFAULT_TURNS = 80
export const DEFAULT_CUSTOM: Resources = { starStone: 100, rerollStone: 60 }

/** 剩餘量低於此比例時,頂部列改用警示色 */
export const LOW_REMAINING_RATIO = 0.1

/** 數字輸入的範圍與快速選項 */
export const STONE_INPUT = {
  starStone: { min: 1, max: 9999, presets: [100, 300, 1000] },
  rerollStone: { min: 1, max: 9999, presets: [50, 150, 500] },
}
export const TURNS_INPUT = { min: 1, max: 999, presets: TURNS_PRESETS.map((p) => p.turns) }
