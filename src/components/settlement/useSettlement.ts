import { useEffect, useState, type Dispatch } from 'react'
import { SETTLE_DELAY_MS, SETTLE_NOTICE_MS } from '../../config/settle'
import { getActionLimit, isExhausted } from '../../core/settlement'
import type { GameAction, GameState } from '../../state/gameReducer'

/**
 * 資源耗盡 / 次數用完的自動結算:等動畫播完、洗練視窗關閉、自動升星停止後,
 * 延遲顯示提示再結算。
 */
export function useSettlement(state: GameState, dispatch: Dispatch<GameAction>, animating: boolean) {
  const { mode, resources, weapon, actionsUsed, rerollPhase, autoSession, settlement } = state
  const actionLimit = getActionLimit(mode)
  const exhausted = isExhausted({ mode, resources, star: weapon.stars, actionsUsed, actionLimit })
  const ready = exhausted && !settlement && !animating && rerollPhase === 'idle' && !autoSession?.active
  const byActions = actionLimit !== undefined
  const [showing, setShowing] = useState(false)

  useEffect(() => {
    if (!ready) return
    let timer = window.setTimeout(() => {
      setShowing(true)
      timer = window.setTimeout(
        () => dispatch({ type: 'FINISH_RUN', reason: byActions ? 'actions' : 'exhausted' }),
        SETTLE_NOTICE_MS,
      )
    }, SETTLE_DELAY_MS)
    return () => {
      clearTimeout(timer)
      setShowing(false)
    }
    // weapon / resources 變動時重新計時
  }, [ready, byActions, weapon, resources, dispatch])

  return {
    exhausted,
    notice: ready && showing ? (byActions ? '次數用完' : '資源耗盡') : null,
  }
}
