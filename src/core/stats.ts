import type { AffixSlot, RunStats } from '../types'
import type { EnhanceResult } from './enhance'
import { getTier } from './reroll'

export const emptyStats = (startStar = 0): RunStats => ({
  starAttempts: 0, successes: 0, keeps: 0, drops: 0, resets: 0, pityCount: 0,
  successStreak: 0, failStreak: 0, maxSuccessStreak: 0, maxFailStreak: 0, highestStar: startStar,
  rerolls: 0, lockedRerolls: 0, goldPlusRolled: 0, redRolled: 0, starStoneUsed: 0, rerollStoneUsed: 0,
})

export function addEnhance(s: RunStats, r: EnhanceResult): RunStats {
  const success = r.outcome === 'success'
  const successStreak = success ? s.successStreak + 1 : 0
  const failStreak = success ? 0 : s.failStreak + 1
  return {
    ...s,
    starAttempts: s.starAttempts + 1,
    successes: s.successes + (success ? 1 : 0),
    keeps: s.keeps + (r.outcome === 'keep' ? 1 : 0),
    drops: s.drops + (r.outcome === 'drop' ? 1 : 0),
    resets: s.resets + (r.outcome === 'reset' ? 1 : 0),
    pityCount: s.pityCount + (r.pityTriggered ? 1 : 0),
    successStreak,
    failStreak,
    maxSuccessStreak: Math.max(s.maxSuccessStreak, successStreak),
    maxFailStreak: Math.max(s.maxFailStreak, failStreak),
    highestStar: Math.max(s.highestStar, r.newStar),
    starStoneUsed: s.starStoneUsed + r.cost,
  }
}

/** rolled:本次洗出的詞條(null 不計) */
export function addReroll(s: RunStats, r: { cost: number; lockedCount: number; rolled: AffixSlot[] }): RunStats {
  const tiers = r.rolled.flatMap((a) => (a ? [getTier(a.lv)] : []))
  return {
    ...s,
    rerolls: s.rerolls + 1,
    lockedRerolls: s.lockedRerolls + (r.lockedCount > 0 ? 1 : 0),
    goldPlusRolled: s.goldPlusRolled + tiers.filter((t) => t === 'gold' || t === 'red').length,
    redRolled: s.redRolled + tiers.filter((t) => t === 'red').length,
    rerollStoneUsed: s.rerollStoneUsed + r.cost,
  }
}

export const addLock = (s: RunStats, cost: number): RunStats => ({ ...s, rerollStoneUsed: s.rerollStoneUsed + cost })
