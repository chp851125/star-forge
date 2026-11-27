import type { GameMode, Milestone, RunStats } from '../types'
import { getActionLimit } from './settlement'

export interface SummaryInput {
  mode: GameMode
  stats: RunStats
  actionsUsed: number
  milestones: Milestone[]
}

/** limit 未定義 = 不設限 */
export interface Usage {
  used: number
  limit?: number
}

/** 統計面板、結算畫面、成績文字共用的彙總數字 */
export function buildRunSummary({ mode, stats: s, actionsUsed, milestones }: SummaryInput) {
  const quota = mode.kind === 'limited' && mode.preset !== 'turns' ? mode.quota : undefined
  return {
    enhance: {
      attempts: s.starAttempts,
      successes: s.successes,
      keeps: s.keeps,
      drops: s.drops,
      resets: s.resets,
      pityCount: s.pityCount,
      maxSuccessStreak: s.maxSuccessStreak,
      maxFailStreak: s.maxFailStreak,
      highestStar: s.highestStar,
      /** 成功 ÷ 衝星次數(0~1);尚未衝星為 null */
      successRate: s.starAttempts ? s.successes / s.starAttempts : null,
    },
    reroll: {
      total: s.rerolls,
      affix: s.affixRerolls,
      lv: s.lvRerolls,
      locked: s.lockedRerolls,
      goldPlus: s.goldPlusRolled,
      red: s.redRolled,
      adopts: s.rerollAdopts,
      keeps: s.rerollKeeps,
    },
    resources: {
      starStone: { used: s.starStoneUsed, limit: quota?.starStone } as Usage,
      rerollStone: { used: s.rerollStoneUsed, limit: quota?.rerollStone } as Usage,
      /** 洗練石消耗中的鎖定花費 */
      lockStone: s.lockStoneUsed,
      actions: { used: actionsUsed, limit: getActionLimit(mode) } as Usage,
    },
    milestones,
  }
}

export type RunSummary = ReturnType<typeof buildRunSummary>

export const formatCount = (n: number) => n.toLocaleString('en-US')

export const formatRate = (r: number | null) => (r === null ? '—' : `${(r * 100).toFixed(1)}%`)

export const formatUsage = ({ used, limit }: Usage) =>
  limit === undefined ? formatCount(used) : `${formatCount(used)} / ${formatCount(limit)}`
