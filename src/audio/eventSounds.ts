// 遊戲事件 → 音效序列(純函式)
import {
  AUTO_VOLUME_RATIO, GRADE_SOUND, OUTCOME_DELAY_MS, REROLL_REVEAL_DELAY_MS, STAMP_FOLLOW_DELAY_MS,
} from '../config/audio'
import { getTier } from '../core/reroll'
import type { AffixSlot, AutoStopReason, Grade, SoundCue, SoundId, StarEffect, Tier } from '../types'

const cue = (id: SoundId, delayMs = 0): SoundCue => ({ id, delayMs })

/** 衝星:打擊音後接結果音;跨階段(evolve)優先於保底 */
export function enhanceSounds(effect: StarEffect, pity: boolean): SoundCue[] {
  const result: SoundId = pity && effect === 'success' ? 'pity' : effect
  return [cue('hammer'), cue(result, OUTCOME_DELAY_MS)]
}

const TIERS_HIGH_FIRST: Tier[] = ['red', 'gold', 'purple', 'blue']

/** 洗練結果出現;rolled 為本次洗到的欄位(沒洗到的給 null) */
export function rerollSounds(rolled: AffixSlot[]): SoundCue[] {
  const tiers = rolled.map((s) => s && getTier(s.lv))
  const top = TIERS_HIGH_FIRST.find((t) => tiers.includes(t))
  return top ? [cue('roll'), cue(top, REROLL_REVEAL_DELAY_MS)] : [cue('roll')]
}

export function settlementSounds(grade: Grade): SoundCue[] {
  const follow = GRADE_SOUND[grade]
  return follow ? [cue('stamp'), cue(follow, STAMP_FOLLOW_DELAY_MS)] : [cue('stamp')]
}

export const autoStartSounds = (): SoundCue[] => [cue('click')]

const STOP_SOUND: Record<AutoStopReason, SoundId | null> = { target: 'pity', noResource: 'error', cancelled: null }

export function autoStopSounds(reason: AutoStopReason): SoundCue[] {
  const id = STOP_SOUND[reason]
  return id ? [cue(id)] : []
}

/** 衝星音效的音量倍率 */
export const enhanceVolume = (auto: boolean) => (auto ? AUTO_VOLUME_RATIO : 1)
