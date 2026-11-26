import type { AffixSlot, Resources, RunStats, Weapon } from '../types'
import { AFFIXES } from '../config/affixes'

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
