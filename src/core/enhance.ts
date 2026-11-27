import type { EnhanceOutcome, EnhanceStep, ZoneKind } from '../types'
import { ENHANCE_TABLE, MAX_STAR, PITY, PROTECTION } from '../config/balance'

export interface EnhanceResult {
  outcome: EnhanceOutcome
  newStar: number
  cost: number
  pityTriggered: boolean
}

/** 目前星級的機率與基本消耗;已達上限或超出範圍回傳 null */
export function getEnhanceStep(star: number): EnhanceStep | null {
  if (star >= MAX_STAR) return null
  return ENHANCE_TABLE[star] ?? null
}

export function getZone(star: number): ZoneKind {
  const rates = getEnhanceStep(star)?.rates
  if (rates && rates.reset > 0) return 'reset'
  if (rates && rates.drop > 0) return 'drop'
  return 'safe'
}

export function canProtect(star: number): boolean {
  return PROTECTION.enabled && (getEnhanceStep(star)?.rates.reset ?? 0) > 0
}

/** 本次消耗(含防歸零加成);不可衝時回傳 null */
export function getEnhanceCost(star: number, protect: boolean): number | null {
  const step = getEnhanceStep(star)
  if (!step) return null
  return protect && canProtect(star) ? step.cost * PROTECTION.costMultiplier : step.cost
}

export const isPityReady = (consecutiveDrops: number) =>
  PITY.enabled && consecutiveDrops >= PITY.consecutiveDropsNeeded

export const nextConsecutiveDrops = (prev: number, outcome: EnhanceOutcome) =>
  outcome === 'drop' ? prev + 1 : 0

const ORDER: EnhanceOutcome[] = ['success', 'keep', 'drop', 'reset']

interface RollInput {
  star: number
  protect: boolean
  consecutiveDrops: number
  /** 回傳 [0, 1) */
  rng?: () => number
}

/** 擲一次衝星;已達上限回傳 null */
export function rollEnhance({ star, protect, consecutiveDrops, rng = Math.random }: RollInput): EnhanceResult | null {
  const step = getEnhanceStep(star)
  const cost = getEnhanceCost(star, protect)
  if (!step || cost === null) return null

  const pityTriggered = isPityReady(consecutiveDrops)
  let outcome: EnhanceOutcome = 'success'
  if (!pityTriggered) {
    let left = rng() * 100
    outcome = ORDER.find((o) => (left -= step.rates[o]) < 0) ?? 'success'
    if (outcome === 'reset' && protect && canProtect(star)) outcome = 'drop'
  }
  const newStar =
    outcome === 'success' ? star + 1
    : outcome === 'drop' ? Math.max(0, star - 1)
    : outcome === 'reset' ? 0
    : star
  return { outcome, newStar, cost, pityTriggered }
}

/** 結果的一行文字 */
export function describeEnhance(from: number, r: Pick<EnhanceResult, 'outcome' | 'newStar' | 'pityTriggered'>): string {
  const move = `+${from} → +${r.newStar}`
  if (r.pityTriggered) return `保底成功 ${move}`
  if (r.outcome === 'success') return `成功 ${move}`
  if (r.outcome === 'keep') return `維持 +${from}`
  if (r.outcome === 'drop') return `掉星 ${move}`
  return `歸零! ${move}`
}
