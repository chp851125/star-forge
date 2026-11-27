import { describe, expect, it } from 'vitest'
import {
  AUTO_VOLUME_RATIO, OUTCOME_DELAY_MS, REROLL_REVEAL_DELAY_MS, STAMP_FOLLOW_DELAY_MS,
} from '../config/audio'
import type { AffixSlot, StarEffect } from '../types'
import { bindAudio, getState, play, setMuted, setVolume } from './engine'
import { autoStopSounds, enhanceSounds, enhanceVolume, rerollSounds, settlementSounds } from './eventSounds'
import { SOUND_IDS } from './sounds'

const affix = (lv: number): AffixSlot => ({ id: 'attack', lv, locked: false })

describe('衝星音效', () => {
  const seq = (result: string) => [{ id: 'hammer', delayMs: 0 }, { id: result, delayMs: OUTCOME_DELAY_MS }]

  it.each<StarEffect>(['success', 'evolve', 'keep', 'drop', 'reset'])('%s:打擊音後接結果音', (effect) => {
    expect(enhanceSounds(effect, false)).toEqual(seq(effect))
  })

  it('保底成功播 pity,跨階段仍播 evolve', () => {
    expect(enhanceSounds('success', true)).toEqual(seq('pity'))
    expect(enhanceSounds('evolve', true)).toEqual(seq('evolve'))
  })

  it('自動模式音量倍率', () => {
    expect(enhanceVolume(true)).toBe(AUTO_VOLUME_RATIO)
    expect(enhanceVolume(false)).toBe(1)
  })
})

describe('洗練音效', () => {
  it.each([
    [[affix(1), affix(15), affix(11)], 'red'],
    [[affix(6), affix(11), affix(1)], 'gold'],
    [[affix(1), affix(10), null], 'purple'],
    [[null, affix(5), null], 'blue'],
  ])('取最高階 %#', (rolled, tier) => {
    expect(rerollSounds(rolled)).toEqual([{ id: 'roll', delayMs: 0 }, { id: tier, delayMs: REROLL_REVEAL_DELAY_MS }])
  })

  it('全空只播 roll', () => {
    expect(rerollSounds([null, null, null])).toEqual([{ id: 'roll', delayMs: 0 }])
  })
})

describe('結算與自動升星', () => {
  it('評級對應後續音', () => {
    const follow = (id: string) => [{ id: 'stamp', delayMs: 0 }, { id, delayMs: STAMP_FOLLOW_DELAY_MS }]
    expect(settlementSounds('S')).toEqual(follow('red'))
    expect(settlementSounds('A')).toEqual(follow('gold'))
    expect(settlementSounds('B')).toEqual(follow('purple'))
    expect(settlementSounds('C')).toEqual([{ id: 'stamp', delayMs: 0 }])
  })

  it('自動停止原因對應', () => {
    expect(autoStopSounds('target')).toEqual([{ id: 'pity', delayMs: 0 }])
    expect(autoStopSounds('noResource')).toEqual([{ id: 'error', delayMs: 0 }])
    expect(autoStopSounds('cancelled')).toEqual([])
  })
})

describe('引擎(沒有 AudioContext 的環境)', () => {
  it('呼叫不拋錯', () => {
    expect(typeof AudioContext).toBe('undefined')
    expect(() => {
      const unbind = bindAudio()
      SOUND_IDS.forEach((id) => play(id, { volume: 0.5 }))
      setVolume(2)
      setMuted(true)
      unbind()
    }).not.toThrow()
    expect(getState()).toEqual({ muted: true, volume: 1 })
  })
})
