import { describe, expect, it } from 'vitest'
import { ENHANCE_TABLE } from '../config/balance'
import { REROLL_BASE_COST } from '../config/reroll'
import type { AffixSlot, GameMode, Settlement, Weapon } from '../types'
import { calcScore, getGrade, scoreSlot } from './grading'
import { buildShareText, isExhausted } from './settlement'
import { emptyStats } from './stats'

const affix = (lv: number): AffixSlot => ({ id: 'attack', lv, locked: false })

describe('評級', () => {
  it('依詞條顏色給分,空欄為 0', () => {
    expect([null, affix(1), affix(5), affix(6), affix(10), affix(11), affix(14), affix(15)].map(scoreSlot))
      .toEqual([0, 1, 1, 2, 2, 3, 3, 4])
  })

  it('總分 = 三欄詞條分數 + 星級', () => {
    expect(calcScore({ stars: 12, slots: [affix(15), affix(7), null] })).toBe(18)
  })

  it('門檻邊界', () => {
    expect([10, 11, 16, 17, 21, 22].map(getGrade)).toEqual(['C', 'B', 'B', 'A', 'A', 'S'])
  })
})

describe('isExhausted', () => {
  const quota: GameMode = { kind: 'limited', preset: 'normal', quota: { starStone: 400, rerollStone: 150 } }
  const check = (star: number, starStone: number, rerollStone: number, mode = quota) =>
    isExhausted({ mode, resources: { starStone, rerollStone }, star, actionsUsed: 0 })
  const cost = ENHANCE_TABLE[12].cost

  it('額度制:兩種石頭都不足才算', () => {
    expect(check(12, cost, 0)).toBe(false)
    expect(check(12, cost - 1, REROLL_BASE_COST)).toBe(false)
    expect(check(12, cost - 1, REROLL_BASE_COST - 1)).toBe(true)
  })

  it('星級 15 且洗練石不足算耗盡', () => {
    expect(check(15, 999, 0)).toBe(true)
    expect(check(15, 999, REROLL_BASE_COST)).toBe(false)
  })

  it('次數制只看操作次數', () => {
    const mode: GameMode = { kind: 'limited', preset: 'turns', quota: { starStone: 0, rerollStone: 0 }, turns: 3 }
    const used = (actionsUsed: number) =>
      isExhausted({ mode, resources: mode.quota, star: 0, actionsUsed, actionLimit: 3 })
    expect([used(2), used(3), used(4)]).toEqual([false, true, true])
  })

  it('無限模式永遠 false', () => {
    expect(isExhausted({
      mode: { kind: 'infinite' }, resources: { starStone: 0, rerollStone: 0 }, star: 15, actionsUsed: 999, actionLimit: 1,
    })).toBe(false)
  })
})

describe('buildShareText', () => {
  const weapon: Weapon = {
    stars: 12,
    slots: [{ id: 'critDmg', lv: 13, locked: true }, { id: 'attack', lv: 7, locked: false }, null],
  }
  const result: Settlement = {
    reason: 'manual',
    mode: { kind: 'limited', preset: 'normal', quota: { starStone: 400, rerollStone: 150 } },
    weapon,
    score: 17,
    affixScore: 5,
    starScore: 12,
    grade: 'A',
    stats: { ...emptyStats(), starAttempts: 85, successes: 40, drops: 30, resets: 3, starStoneUsed: 389, rerollStoneUsed: 142 },
    milestones: [],
  }

  it('限定模式含空欄', () => {
    expect(buildShareText(result)).toBe([
      '星煉工坊 評級 A(17 分)',
      '劍:+12 星熾巨劍',
      '詞條:暴擊傷害 +18%(Lv13 金)/ 攻擊力 +9.29%(Lv7 紫)/ 空欄',
      '模式:限定・普通',
      '衝星 85 次(成功 40・掉星 30・歸零 3)',
      '消耗:升星石 389/400、洗練石 142/150',
    ].join('\n'))
  })

  it('無限模式不顯示額度', () => {
    const text = buildShareText({
      ...result, mode: { kind: 'infinite' }, weapon: { stars: 0, slots: [null, null, null] },
    })
    expect(text).toContain('詞條:空欄 / 空欄 / 空欄')
    expect(text).toContain('模式:無限\n')
    expect(text.endsWith('消耗:升星石 389、洗練石 142')).toBe(true)
  })
})
