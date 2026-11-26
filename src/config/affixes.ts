import type { AffixDef, Tier } from '../types'

export const AFFIXES: AffixDef[] = [
  { id: 'attack', name: '攻擊力', min: 5, max: 50, unit: '%' },
  { id: 'critRate', name: '暴擊率', min: 2, max: 30, unit: '%' },
  { id: 'critDmg', name: '暴擊傷害', min: 10, max: 100, unit: '%' },
  { id: 'elemDmg', name: '元素傷害', min: 5, max: 60, unit: '%' },
  { id: 'attackSpeed', name: '攻擊速度', min: 3, max: 25, unit: '%' },
  { id: 'penetration', name: '穿透', min: 2, max: 30, unit: '%' },
  { id: 'bossDmg', name: '對首領傷害', min: 5, max: 50, unit: '%' },
  { id: 'chargeDmg', name: '蓄力斬傷害', min: 8, max: 80, unit: '%' },
  { id: 'chargeSpeed', name: '蓄力速度', min: 3, max: 30, unit: '%' },
  { id: 'lifesteal', name: '吸血', min: 1, max: 15, unit: '%' },
  { id: 'cooldown', name: '冷卻縮減', min: 2, max: 25, unit: '%' },
  { id: 'maxHp', name: '最大生命', min: 50, max: 800, unit: '' },
  { id: 'defense', name: '防禦力', min: 5, max: 120, unit: '' },
  { id: 'moveSpeed', name: '移動速度', min: 2, max: 20, unit: '%' },
  { id: 'dashDistance', name: '衝刺距離', min: 5, max: 40, unit: '%' },
]

export const AFFIX_MAP: Record<string, AffixDef> = Object.fromEntries(AFFIXES.map((a) => [a.id, a]))

/** Lv → 階級(Lv1~5 藍 / 6~10 紫 / 11~14 金 / 15 紅) */
export function tierOfLv(lv: number): Tier {
  if (lv >= 15) return 'red'
  if (lv >= 11) return 'gold'
  if (lv >= 6) return 'purple'
  return 'blue'
}

export const TIER_NAME: Record<Tier, string> = { blue: '普通', purple: '稀有', gold: '傳說', red: '頂規' }

/** 線性分級數值 */
export function affixValue(def: AffixDef, lv: number): number {
  return Math.round(def.min + ((def.max - def.min) * (lv - 1)) / 14)
}
