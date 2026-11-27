import type { AffixSlot, RerollMode, Weapon } from '../types'
import { AFFIXES } from '../config/affixes'

export const mockWeapon: Weapon = {
  stars: 0,
  slots: [
    { id: 'attack', lv: 12, locked: false },
    { id: 'critRate', lv: 7, locked: false },
    { id: 'lifesteal', lv: 3, locked: false },
  ],
}

export const rand = (n: number) => Math.floor(Math.random() * n)

/** 假隨機:產生新詞條(僅預覽用) */
export function fakeRoll(prev: AffixSlot, mode: 'affix' | 'lv', forceRed = false): AffixSlot {
  const lv = forceRed ? 15 : 1 + rand(15)
  if (mode === 'lv' && prev) return { ...prev, lv }
  return { id: AFFIXES[rand(AFFIXES.length)].id, lv, locked: prev?.locked ?? false }
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
