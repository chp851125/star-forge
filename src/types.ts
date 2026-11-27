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
  drops: number
  resets: number
  rerolls: number
  starStoneUsed: number
  rerollStoneUsed: number
  log: string[]
}

export type StarResult = 'success' | 'evolve' | 'drop' | 'reset'
/** 單次衝星結果(含不產生特效的「維持」) */
export type StarOutcome = StarResult | 'keep'
export type RerollMode = 'affix' | 'lv'

/** 洗練視窗內的一次新舊對照 */
export interface RerollResult {
  /** 流水號,變動時重播列動畫 */
  n: number
  mode: RerollMode
  before: Weapon['slots']
  after: Weapon['slots']
  /** pending 待玩家決定 / discarded 自動放棄 / auto 自動洗練已處理 */
  status: 'pending' | 'discarded' | 'auto'
}

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
  kind: StarResult | 'red'
  /** 流水號,變動時重播特效 */
  n: number
  /** 洗出紅詞條的欄位 */
  slot?: number
  /** 特效播放倍速(自動升星加速),預設 1 */
  speed?: number
}

export type FxQuality = 'high' | 'medium' | 'low' | 'off'

/** 升星結果機率(百分比整數,四項加總 100) */
export interface StarOdds {
  success: number
  keep: number
  drop: number
  reset: number
}
