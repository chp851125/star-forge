import { describe, expect, it } from 'vitest'
import { AFFIXES } from '../config/affixes'
import { LEVEL_WEIGHTS } from '../config/reroll'
import type { Weapon } from '../types'
import {
  canAffixChange, canValueReroll, compareSlots, getAttributeValue, getRerollCost, getTier,
  rollAffixChange, rollValueReroll,
} from './reroll'

type Slots = Weapon['slots']
const a = (lv: number, locked = false) => ({ id: 'attack' as const, lv, locked })
const empty: Slots = [null, null, null]
const constant = (v: number) => () => v
const sum = (n: number[]) => n.reduce((x, y) => x + y, 0)

describe('LEVEL_WEIGHTS', () => {
  it('共 15 級,加總 1,各階級 60 / 30 / 9 / 1%', () => {
    expect(LEVEL_WEIGHTS).toHaveLength(15)
    expect(sum(LEVEL_WEIGHTS)).toBeCloseTo(1)
    expect(sum(LEVEL_WEIGHTS.slice(0, 5))).toBeCloseTo(0.6)
    expect(sum(LEVEL_WEIGHTS.slice(5, 10))).toBeCloseTo(0.3)
    expect(sum(LEVEL_WEIGHTS.slice(10, 14))).toBeCloseTo(0.09)
    expect(LEVEL_WEIGHTS[14]).toBeCloseTo(0.01)
  })
})

describe('getTier / getAttributeValue', () => {
  it('階級邊界', () => {
    expect([1, 5, 6, 10, 11, 14, 15].map(getTier)).toEqual(['blue', 'blue', 'purple', 'purple', 'gold', 'gold', 'red'])
  })

  it('Lv1 = min、Lv15 = max,中間四捨五入到 2 位', () => {
    for (const d of AFFIXES) {
      expect(getAttributeValue(d.id, 1)).toBe(d.min)
      expect(getAttributeValue(d.id, 15)).toBe(d.max)
    }
    expect(getAttributeValue('attack', 2)).toBe(5.71)
  })
})

describe('rollAffixChange', () => {
  it('第 1 欄必有,第 2、3 欄取決於機率', () => {
    const high = rollAffixChange({ slots: empty, rng: constant(0.999999) })
    expect(high[0]).not.toBeNull()
    expect(high.slice(1)).toEqual([null, null])
    expect(rollAffixChange({ slots: empty, rng: constant(0) }).every(Boolean)).toBe(true)
    const mid = rollAffixChange({ slots: empty, rng: constant(0.4) })
    expect(mid.map(Boolean)).toEqual([true, true, false])
  })

  it('三欄屬性不重複', () => {
    const ids = rollAffixChange({ slots: empty, rng: constant(0) }).map((s) => s!.id)
    expect(new Set(ids).size).toBe(3)
  })

  it('排除已鎖定欄位的屬性(即使在後面的欄位),鎖定欄位原樣不變', () => {
    const slots: Slots = [a(3), null, a(9, true)]
    const next = rollAffixChange({ slots, rng: constant(0) })
    expect(next[2]).toBe(slots[2])
    expect(next[0]!.id).not.toBe('attack')
    expect(next[1]!.id).not.toBe('attack')
    expect(next[1]!.id).not.toBe(next[0]!.id)
  })
})

describe('rollValueReroll', () => {
  it('屬性不變、空欄仍為空、鎖定欄位不變', () => {
    const slots: Slots = [a(3), null, { id: 'critRate', lv: 4, locked: true }]
    const next = rollValueReroll({ slots, rng: constant(0.999999) })
    expect(next[0]).toEqual(a(15))
    expect(next[1]).toBeNull()
    expect(next[2]).toBe(slots[2])
  })
})

describe('消耗與可否洗練', () => {
  it('getRerollCost', () => {
    expect([0, 1, 2].map(getRerollCost)).toEqual([1, 2, 3])
  })

  it('canAffixChange / canValueReroll', () => {
    const allLocked: Slots = [a(1, true), a(1, true), a(1, true)]
    expect(canAffixChange(empty)).toBe(true)
    expect(canAffixChange(allLocked)).toBe(false)
    expect(canValueReroll(empty)).toBe(false)
    expect(canValueReroll(allLocked)).toBe(false)
    expect(canValueReroll([a(1, true), null, null])).toBe(false)
    expect(canValueReroll([a(1, true), a(1), null])).toBe(true)
  })
})

describe('compareSlots', () => {
  it('六種結果', () => {
    expect(compareSlots([a(5), a(5), a(5)], [a(6), a(4), a(5)])).toEqual(['up', 'down', 'same'])
    expect(compareSlots([a(5), null, a(5)], [{ id: 'critRate', lv: 5, locked: false }, a(1), null])).toEqual([
      'changed', 'added', 'removed',
    ])
  })
})
