import type { Grade, SoundId } from '../types'

/** 全域預設(只存在記憶體,重新整理回到此值) */
export const DEFAULT_VOLUME = 0.6
export const DEFAULT_MUTED = false

/** 各音效音量微調(倍率) */
export const SOUND_VOLUME: Record<SoundId, number> = {
  hammer: 1,
  success: 1,
  evolve: 1,
  keep: 1,
  drop: 1,
  reset: 1,
  pity: 1,
  roll: 1,
  blue: 1,
  purple: 1,
  gold: 1,
  red: 1,
  lock: 1,
  unlock: 1,
  click: 1,
  confirm: 1,
  error: 1,
  stamp: 1,
}

/** 同一個音效最小間隔(ms) */
export const SOUND_MIN_INTERVAL_MS: Record<SoundId, number> = {
  hammer: 80,
  success: 120,
  evolve: 300,
  keep: 100,
  drop: 150,
  reset: 300,
  pity: 200,
  roll: 100,
  blue: 80,
  purple: 100,
  gold: 150,
  red: 300,
  lock: 80,
  unlock: 80,
  click: 50,
  confirm: 80,
  error: 120,
  stamp: 300,
}

/** 同時發聲數量上限;超過時略過新的低優先音效 */
export const MAX_VOICES = 12
export const LOW_PRIORITY_SOUNDS: readonly SoundId[] = ['click', 'roll', 'keep']

/** 自動升星中衝星音效的音量倍率 */
export const AUTO_VOLUME_RATIO = 0.6

/** 衝星打擊音到結果音(ms) */
export const OUTCOME_DELAY_MS = 380
/** 洗練中到結果揭示(ms) */
export const REROLL_REVEAL_DELAY_MS = 320
/** 評級印章到後續音(ms) */
export const STAMP_FOLLOW_DELAY_MS = 500
/** 評級印章後續音;null = 不補播 */
export const GRADE_SOUND: Record<Grade, SoundId | null> = { S: 'red', A: 'gold', B: 'purple', C: null }
