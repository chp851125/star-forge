export type Tier = 'blue' | 'purple' | 'gold' | 'red'

export type AffixId =
  | 'attack' | 'critRate' | 'critDmg' | 'elemDmg' | 'attackSpeed'
  | 'penetration' | 'bossDmg' | 'chargeDmg' | 'chargeSpeed' | 'lifesteal'
  | 'cooldown' | 'maxHp' | 'defense' | 'moveSpeed' | 'dashDistance'

export interface AffixDef {
  id: AffixId
  name: string
  min: number
  max: number
  unit: string
}

/** null = 空欄;lv 為 1~15 */
export type AffixSlot = { id: AffixId; lv: number; locked: boolean } | null

export interface Weapon {
  stars: number // 0~15
  slots: [AffixSlot, AffixSlot, AffixSlot]
}

export interface Resources {
  starStone: number
  rerollStone: number
}

export type GameMode =
  | { kind: 'infinite' }
  | { kind: 'limited'; preset: 'easy' | 'normal' | 'hard' | 'custom' | 'turns'; quota: Resources; turns?: number }

export interface RunStats {
  starAttempts: number
  successes: number
  keeps: number
  drops: number
  resets: number
  pityCount: number
  /** 目前連成 / 連敗(非成功)次數 */
  successStreak: number
  failStreak: number
  maxSuccessStreak: number
  maxFailStreak: number
  highestStar: number
  rerolls: number
  starStoneUsed: number
  rerollStoneUsed: number
}

export type EnhanceOutcome = 'success' | 'keep' | 'drop' | 'reset'
/** 衝星特效種類(跨階段成功為 evolve) */
export type StarEffect = EnhanceOutcome | 'evolve'
export type AutoStopReason = 'target' | 'noResource' | 'cancelled'
export type RerollMode = 'affix' | 'lv'

export type ZoneKind = 'safe' | 'drop' | 'reset'
export type Grade = 'S' | 'A' | 'B' | 'C'

export interface WeaponStage {
  name: string
  minStar: number
  maxStar: number
}

export interface WeaponStyle {
  id: string
  name: string
  /** 'image' 版之後才做,目前只實作 'svg' */
  renderer: 'svg' | 'image'
  stages: [WeaponStage, WeaponStage, WeaponStage, WeaponStage, WeaponStage, WeaponStage]
}

export interface WeaponEvent {
  kind: StarEffect | 'red'
  /** 流水號,變動時重播特效 */
  n: number
  /** 洗出紅詞條的欄位 */
  slot?: number
  /** 特效播放倍速(自動升星加速),預設 1 */
  speed?: number
}

export type FxQuality = 'high' | 'medium' | 'low' | 'off'

/** 升星結果機率(百分比整數,四項加總 100) */
export type EnhanceRates = Record<EnhanceOutcome, number>

export interface EnhanceStep {
  rates: EnhanceRates
  /** 升星石消耗(不含防歸零加成) */
  cost: number
}
