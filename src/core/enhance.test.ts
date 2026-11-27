import { describe, expect, it } from 'vitest'
import { ENHANCE_TABLE, MAX_STAR, PITY, PROTECTION } from '../config/balance'
import { canProtect, getEnhanceCost, getEnhanceStep, nextConsecutiveDrops, rollEnhance } from './enhance'
import { shouldStopAuto } from './autoEnhance'
import type { EnhanceOutcome } from '../types'

const ORDER: EnhanceOutcome[] = ['success', 'keep', 'drop', 'reset']

/** 找出機率 > 0 的結果,回傳落在該區間中央的 rng 值 */
const rngFor = (star: number, outcome: EnhanceOutcome) => {
  const { rates } = ENHANCE_TABLE[star]
  expect(rates[outcome]).toBeGreaterThan(0)
  const before = ORDER.slice(0, ORDER.indexOf(outcome)).reduce((a, o) => a + rates[o], 0)
  return () => (before + rates[outcome] / 2) / 100
}
const starWith = (o: EnhanceOutcome) => ENHANCE_TABLE.findIndex((s, i) => i > 0 && s.rates[o] > 0)
const roll = (star: number, outcome: EnhanceOutcome, protect = false) =>
  rollEnhance({ star, protect, consecutiveDrops: 0, rng: rngFor(star, outcome) })!

describe('ENHANCE_TABLE', () => {
  it('長度 15,每列機率加總 100', () => {
    expect(ENHANCE_TABLE).toHaveLength(MAX_STAR)
    for (const { rates } of ENHANCE_TABLE) {
      expect(rates.success + rates.keep + rates.drop + rates.reset).toBe(100)
    }
  })
})

describe('rollEnhance', () => {
  it('四種結果與星級變化', () => {
    const k = starWith('keep')
    const d = starWith('drop')
    const r = starWith('reset')
    expect(roll(k, 'success')).toMatchObject({ outcome: 'success', newStar: k + 1 })
    expect(roll(k, 'keep')).toMatchObject({ outcome: 'keep', newStar: k })
    expect(roll(d, 'drop')).toMatchObject({ outcome: 'drop', newStar: d - 1 })
    expect(roll(r, 'reset')).toMatchObject({ outcome: 'reset', newStar: 0 })
  })

  it('0 星不會低於 0', () => {
    for (const x of [0, 0.5, 0.999999]) {
      expect(rollEnhance({ star: 0, protect: false, consecutiveDrops: 0, rng: () => x })!.newStar).toBeGreaterThanOrEqual(0)
    }
  })

  it('15 星不可衝', () => {
    expect(rollEnhance({ star: MAX_STAR, protect: false, consecutiveDrops: 0 })).toBeNull()
    expect(getEnhanceStep(MAX_STAR)).toBeNull()
    expect(getEnhanceCost(MAX_STAR, false)).toBeNull()
    expect(canProtect(MAX_STAR)).toBe(false)
  })
})

describe('保底', () => {
  const star = starWith('drop')

  it('連續掉星達標後必定成功,消耗照算', () => {
    let drops = 0
    for (let i = 0; i < PITY.consecutiveDropsNeeded; i++) drops = nextConsecutiveDrops(drops, roll(star, 'drop').outcome)
    const r = rollEnhance({ star, protect: false, consecutiveDrops: drops, rng: () => 0.999999 })!
    expect(r).toEqual({ outcome: 'success', newStar: star + 1, cost: ENHANCE_TABLE[star].cost, pityTriggered: true })
  })

  it('未達標不觸發', () => {
    const r = rollEnhance({ star, protect: false, consecutiveDrops: PITY.consecutiveDropsNeeded - 1, rng: rngFor(star, 'drop') })!
    expect(r.pityTriggered).toBe(false)
    expect(r.outcome).toBe('drop')
  })

  it('成功 / 維持 / 歸零後計數歸零', () => {
    for (const o of ['success', 'keep', 'reset'] as const) expect(nextConsecutiveDrops(1, o)).toBe(0)
    expect(nextConsecutiveDrops(1, 'drop')).toBe(2)
  })
})

describe('防歸零', () => {
  it('canProtect 只在歸零機率 > 0 時成立', () => {
    ENHANCE_TABLE.forEach(({ rates }, i) => expect(canProtect(i)).toBe(rates.reset > 0))
  })

  it('歸零改掉 1 星,消耗加倍', () => {
    const star = starWith('reset')
    expect(roll(star, 'reset', true)).toMatchObject({
      outcome: 'drop', newStar: star - 1, cost: ENHANCE_TABLE[star].cost * PROTECTION.costMultiplier,
    })
  })

  it('不可防護的星級消耗不加倍', () => {
    expect(getEnhanceCost(0, true)).toBe(ENHANCE_TABLE[0].cost)
  })
})

describe('shouldStopAuto', () => {
  const base = { star: 5, target: 10, stones: 100, nextCost: 3, unlimited: false }

  it('可繼續', () => expect(shouldStopAuto(base)).toBeNull())
  it('達到或超過目標', () => {
    expect(shouldStopAuto({ ...base, star: 10 })).toBe('target')
    expect(shouldStopAuto({ ...base, star: 11 })).toBe('target')
  })
  it('資源不足(含防歸零加成)', () => {
    const star = starWith('reset')
    const stones = ENHANCE_TABLE[star].cost
    const input = { ...base, star, target: MAX_STAR, stones }
    expect(shouldStopAuto({ ...input, nextCost: getEnhanceCost(star, false)! })).toBeNull()
    expect(shouldStopAuto({ ...input, nextCost: getEnhanceCost(star, true)! })).toBe('noResource')
  })
  it('無限模式不因資源停止', () => {
    expect(shouldStopAuto({ ...base, stones: 0, unlimited: true })).toBeNull()
  })
})
