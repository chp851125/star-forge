import { useEffect, useRef, type Dispatch } from 'react'
import { AUTO_STAR_DELAY } from '../../config/auto'
import { shouldStopAuto } from '../../core/autoEnhance'
import { getEnhanceCost } from '../../core/enhance'
import { isUnlimited, type GameAction, type GameState } from '../../state/gameReducer'

/** 自動升星:等上一次結果的間隔結束,判斷是否停止,否則衝下一次 */
export function useAutoEnhance(state: GameState, dispatch: Dispatch<GameAction>) {
  const latest = useRef(state)
  latest.current = state
  /** 下一次嘗試最早可開始的時間;中斷後立刻重開也不會跳過上一次動畫 */
  const readyAt = useRef(0)
  const event = state.lastEvent
  const session = state.autoSession
  const active = !!session?.active

  // 必須排在排程 effect 之前
  useEffect(() => {
    if (event?.auto && event.kind !== 'red') readyAt.current = Date.now() + AUTO_STAR_DELAY[event.kind]
  }, [event?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!active) return
    const t = window.setTimeout(() => {
      const { autoSession, weapon, resources, mode, turnsLeft } = latest.current
      if (!autoSession?.active) return
      const noTurns = turnsLeft !== undefined && turnsLeft <= 0
      const reason = shouldStopAuto({
        star: weapon.stars,
        target: autoSession.target,
        // 次數用完視同沒有資源
        stones: noTurns ? 0 : resources.starStone,
        nextCost: getEnhanceCost(weapon.stars, autoSession.protect) ?? 0,
        unlimited: !noTurns && isUnlimited(mode),
      })
      if (reason) dispatch({ type: 'AUTO_STOP', reason })
      else dispatch({ type: 'ENHANCE', protect: autoSession.protect, roll: Math.random() })
    }, Math.max(0, readyAt.current - Date.now()))
    return () => clearTimeout(t)
  }, [active, session?.tries, dispatch])
}
