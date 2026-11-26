import type { StarOdds, ZoneKind } from '../types'

const odds = (success: number, keep: number, drop = 0, reset = 0): StarOdds => ({ success, keep, drop, reset })

/** 佔位值(%):index = 目前星級(0~14),嘗試升到下一級的結果分布 */
export const STAR_ODDS: StarOdds[] = [
  odds(100, 0), odds(100, 0), odds(95, 5), odds(90, 10), odds(85, 15), odds(80, 20),
  odds(70, 20, 10), odds(62, 23, 15), odds(55, 25, 20), odds(48, 27, 25), odds(42, 28, 30), odds(36, 29, 35),
  odds(30, 45, 0, 25), odds(25, 45, 0, 30), odds(20, 45, 0, 35),
]

/** 區間:+0~5 安全、+6~11 失敗掉星、+12~14 失敗歸零 */
export function zoneOf(stars: number): ZoneKind {
  if (stars <= 5) return 'safe'
  if (stars <= 11) return 'drop'
  return 'reset'
}

export const ZONE_LABEL: Record<ZoneKind, string> = {
  safe: '安全區:失敗維持星級',
  drop: '掉星區:失敗可能 -1 星',
  reset: '歸零區:失敗可能歸零回 +0',
}

export const MAX_STARS = 15
export const STAR_COST = 1
export const REROLL_BASE_COST = 1
