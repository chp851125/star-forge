export type Tier = 'blue' | 'purple' | 'gold' | 'red'

export type AffixId =
  | 'attack' | 'critRate' | 'critDmg' | 'elemDmg' | 'attackSpeed'
  | 'penetration' | 'bossDmg' | 'chargeDmg' | 'chargeSpeed' | 'lifesteal'
  | 'cooldown' | 'maxHp' | 'defense' | 'moveSpeed' | 'dashDistance'

export interface AffixDef {
  id: AffixId
  name: string
  /** 出現權重 */
  weight: number
  /** Lv1 數值(%) */
  min: number
  /** Lv15 數值(%) */
  max: number
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
  /** 鎖定條數 ≥ 1 時的洗練次數 */
  lockedRerolls: number
  /** 洗出金階以上(含紅)的詞條數,不論是否採用 */
  goldPlusRolled: number
  redRolled: number
  starStoneUsed: number
  rerollStoneUsed: number
}

export type FinishReason = 'manual' | 'exhausted' | 'actions'

/** 首次到達某星級時的累計值 */
export interface Milestone {
  star: number
  enhanceStoneSpent: number
  rerollStoneSpent: number
  attempts: number
}

/** 結算快照 */
export interface Settlement {
  reason: FinishReason
  mode: GameMode
  weapon: Weapon
  score: number
  affixScore: number
  starScore: number
  grade: Grade
  stats: RunStats
  milestones: Milestone[]
}

export type EnhanceOutcome = 'success' | 'keep' | 'drop' | 'reset'
/** 衝星特效種類(跨階段成功為 evolve) */
export type StarEffect = EnhanceOutcome | 'evolve'
export type AutoStopReason = 'target' | 'noResource' | 'cancelled'
export type RerollMode = 'affix' | 'lv'
/** idle:視窗關閉;pending:等待改變 / 維持;decided:可繼續或關閉 */
export type RerollPhase = 'idle' | 'pending' | 'decided'
export type SlotChange = 'up' | 'down' | 'same' | 'changed' | 'added' | 'removed'

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
