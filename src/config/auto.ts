import type { StarEffect } from '../types'

/** 自動升星時特效的播放倍速(手動衝星維持 1 倍) */
export const AUTO_STAR_SPEED = 2

/** 自動升星每次嘗試後到下一次的間隔(ms,依本次結果);須大於加速後的動畫長度,動畫不可跳過 */
export const AUTO_STAR_DELAY: Record<StarEffect, number> = {
  success: 600,
  evolve: 700,
  keep: 450,
  drop: 600,
  reset: 1000,
}
