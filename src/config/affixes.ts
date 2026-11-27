import type { AffixDef, AffixId, Tier } from '../types'

const def = (id: AffixId, name: string, weight: number, min: number, max: number): AffixDef => ({
  id, name, weight, min, max,
})

/** 佔位值:def(id, 名稱, 出現權重, Lv1 數值, Lv15 數值);數值單位皆為 % */
export const AFFIXES: AffixDef[] = [
  def('attack', '攻擊力', 10, 5, 15),
  def('critRate', '暴擊率', 8, 2, 7),
  def('critDmg', '暴擊傷害', 8, 6, 20),
  def('elemDmg', '元素傷害', 8, 9, 29),
  def('attackSpeed', '攻擊速度', 7, 3, 10),
  def('penetration', '穿透', 7, 4, 14),
  def('bossDmg', '對首領傷害', 6, 8, 25),
  def('chargeDmg', '蓄力斬傷害', 7, 5, 15),
  def('chargeSpeed', '蓄力速度', 6, 2, 6),
  def('lifesteal', '吸血', 5, 1, 5),
  def('cooldown', '冷卻縮減', 6, 3, 10),
  def('maxHp', '最大生命', 7, 5, 15),
  def('defense', '防禦力', 6, 5, 15),
  def('moveSpeed', '移動速度', 5, 3, 10),
  def('dashDistance', '衝刺距離', 5, 3, 10),
]

export const AFFIX_MAP = Object.fromEntries(AFFIXES.map((a) => [a.id, a])) as Record<AffixId, AffixDef>

export const TIER_NAME: Record<Tier, string> = { blue: '普通', purple: '稀有', gold: '傳說', red: '頂規' }
