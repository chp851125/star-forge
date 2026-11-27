import type { AffixSlot, RerollMode, Resources, RunStats, StarOutcome, Weapon } from '../types'
import { AFFIXES } from '../config/affixes'
import { MAX_STARS } from '../config/balance'
import { stageOf } from '../config/weapons'

export const mockWeapon: Weapon = {
  stars: 0,
  slots: [
    { id: 'attack', lv: 12, locked: false },
    { id: 'critRate', lv: 7, locked: false },
    { id: 'lifesteal', lv: 3, locked: false },
  ],
}

export const mockResources: Resources = { starStone: 80, rerollStone: 50 }

export const mockStats: RunStats = {
  starAttempts: 23,
  successes: 14,
  drops: 6,
  resets: 3,
  rerolls: 11,
  starStoneUsed: 23,
  rerollStoneUsed: 19,
  log: ['衝星 +8→+9 成功', '洗練 詞條變更(效果變更)', '衝星 +9→+8 掉星'],
}

export const emptyStats = (): RunStats => ({
  starAttempts: 0, successes: 0, drops: 0, resets: 0, rerolls: 0, starStoneUsed: 0, rerollStoneUsed: 0, log: [],
})

export const rand = (n: number) => Math.floor(Math.random() * n)

/** 假隨機:產生新詞條(僅預覽用) */
export function fakeRoll(prev: AffixSlot, mode: 'affix' | 'lv', forceRed = false): AffixSlot {
  const lv = forceRed ? 15 : 1 + rand(15)
  if (mode === 'lv' && prev) return { ...prev, lv }
  return { id: AFFIXES[rand(AFFIXES.length)].id, lv, locked: prev?.locked ?? false }
}

/** 假衝星結果與新星級(僅預覽用) */
export function fakeStar(from: number): { outcome: StarOutcome; to: number } {
  const roll = Math.random()
  let outcome: StarOutcome = roll < 0.55 ? 'success' : roll < 0.7 ? 'keep' : roll < 0.88 ? 'drop' : 'reset'
  if (from === 0 && (outcome === 'drop' || outcome === 'reset')) outcome = 'keep'
  if (outcome === 'success') {
    const to = Math.min(MAX_STARS, from + 1)
    return { outcome: stageOf(to) !== stageOf(from) ? 'evolve' : 'success', to }
  }
  return { outcome, to: outcome === 'reset' ? 0 : outcome === 'drop' ? from - 1 : from }
}

/** 假洗練:各欄出現詞條的機率(僅預覽用) */
const FAKE_PRESENCE = [0.9, 0.6, 0.5]

export function fakeReroll(slots: Weapon['slots'], mode: RerollMode): Weapon['slots'] {
  return slots.map((s, i) => {
    if (s?.locked) return s
    const red = rand(12) === 0
    if (mode === 'lv') return s && fakeRoll(s, mode, red)
    return Math.random() < FAKE_PRESENCE[i] ? fakeRoll(s, mode, red) : null
  }) as Weapon['slots']
}
