import type { AffixId, AffixSlot, SlotChange, Tier, Weapon } from '../types'
import { AFFIXES, AFFIX_MAP } from '../config/affixes'
import { LEVEL_WEIGHTS, REROLL_BASE_COST, SLOT_APPEAR_RATES, TIER_LEVELS } from '../config/reroll'

type Slots = Weapon['slots']
interface RollInput {
  slots: Slots
  rng?: () => number
}

/** 一次洗練最多用到的亂數個數:每欄的出現、屬性、Lv */
export const RANDOMS_PER_REROLL = SLOT_APPEAR_RATES.length * 3

export const getTier = (level: number): Tier =>
  (Object.keys(TIER_LEVELS) as Tier[]).find((t) => level <= TIER_LEVELS[t][1]) ?? 'red'

/** Lv 線性分級數值(%),四捨五入到小數 2 位 */
export function getAttributeValue(affixId: AffixId, level: number): number {
  const { min, max } = AFFIX_MAP[affixId]
  const value = min + ((max - min) * (level - 1)) / (LEVEL_WEIGHTS.length - 1)
  return Math.round(value * 100) / 100
}

export const countLocked = (slots: Slots) => slots.filter((s) => s?.locked).length
export const getRerollCost = (lockedCount: number) => REROLL_BASE_COST + lockedCount
export const canAffixChange = (slots: Slots) => slots.some((s) => !s?.locked)
export const canValueReroll = (slots: Slots) => slots.some((s) => s && !s.locked)

function pickIndex(weights: number[], rng: () => number): number {
  let r = rng() * weights.reduce((a, w) => a + w, 0)
  const i = weights.findIndex((w) => (r -= w) < 0)
  return i < 0 ? weights.length - 1 : i
}

const rollLevel = (rng: () => number) => pickIndex(LEVEL_WEIGHTS, rng) + 1

/** 詞條變更:未鎖定欄位重抽是否出現、屬性與 Lv;三欄屬性不重複 */
export function rollAffixChange({ slots, rng = Math.random }: RollInput): Slots {
  const taken = new Set(slots.flatMap((s) => (s?.locked ? [s.id] : [])))
  return slots.map((s, i): AffixSlot => {
    if (s?.locked) return s
    if (rng() >= SLOT_APPEAR_RATES[i]) return null
    const pool = AFFIXES.filter((a) => !taken.has(a.id))
    if (!pool.length) return null
    const { id } = pool[pickIndex(pool.map((a) => a.weight), rng)]
    taken.add(id)
    return { id, lv: rollLevel(rng), locked: false }
  }) as Slots
}

/** 數值重洗:未鎖定且有詞條的欄位只重抽 Lv */
export function rollValueReroll({ slots, rng = Math.random }: RollInput): Slots {
  return slots.map((s) => (s && !s.locked ? { ...s, lv: rollLevel(rng) } : s)) as Slots
}

/** 本次洗出的詞條:原樣保留的欄位(鎖定、未洗到)沿用同一物件,不算在內 */
export const rolledSlots = (before: Slots, after: Slots): AffixSlot[] =>
  after.map((s, i) => (s !== before[i] ? s : null))

function compareSlot(a: AffixSlot, b: AffixSlot): SlotChange {
  if (!a) return b ? 'added' : 'same'
  if (!b) return 'removed'
  if (a.id !== b.id) return 'changed'
  return b.lv > a.lv ? 'up' : b.lv < a.lv ? 'down' : 'same'
}

export const compareSlots = (oldSlots: Slots, newSlots: Slots): SlotChange[] =>
  oldSlots.map((s, i) => compareSlot(s, newSlots[i]))
