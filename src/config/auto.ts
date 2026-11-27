/** 自動升星時特效的播放倍速(手動衝星維持 1 倍) */
export const AUTO_STAR_SPEED = 2

/** 自動功能每次嘗試後的間隔(ms,佔位值);須大於對應動畫長度(自動升星為加速後長度),動畫不可跳過 */
export const AUTO_STAR_DELAY = {
  normal: 450,
  evolve: 700,
  drop: 550,
  reset: 1000,
}
