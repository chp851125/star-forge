import { useCallback, useEffect, useRef } from 'react'
import { rolledSlots } from '../core/reroll'
import type { GameState } from '../state/gameReducer'
import type { SoundCue } from '../types'
import { play } from './engine'
import { autoStartSounds, autoStopSounds, enhanceSounds, enhanceVolume, rerollSounds, settlementSounds } from './eventSounds'

/** 依遊戲狀態播放音效;元件卸載(含重新開始)時清除排程中的聲音 */
export function useGameSounds(state: GameState) {
  const { lastEvent, lastResult, pendingReroll, stats, weapon, autoSession, settlement } = state
  const timers = useRef(new Set<number>())
  /** 已播放過的事件,避免重複(StrictMode 會重跑 effect) */
  const playedEvent = useRef(lastEvent?.id)
  const playedRoll = useRef(stats.rerolls)
  const playedSettlement = useRef(false)
  const autoActive = useRef(!!autoSession?.active)

  const schedule = useCallback((cues: SoundCue[], volume = 1) => {
    cues.forEach(({ id, delayMs }) => {
      if (!delayMs) return play(id, { volume })
      const t = window.setTimeout(() => {
        timers.current.delete(t)
        play(id, { volume })
      }, delayMs)
      timers.current.add(t)
    })
  }, [])

  useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach(clearTimeout)
      pending.clear()
    }
  }, [])

  // 衝星。紅詞條事件由洗練音效負責
  useEffect(() => {
    if (!lastEvent || lastEvent.id === playedEvent.current) return
    playedEvent.current = lastEvent.id
    if (lastEvent.kind === 'red') return
    schedule(enhanceSounds(lastEvent.kind, !!lastResult?.pityTriggered), enhanceVolume(lastEvent.auto))
  }, [lastEvent, lastResult, schedule])

  useEffect(() => {
    if (!pendingReroll || stats.rerolls === playedRoll.current) return
    playedRoll.current = stats.rerolls
    schedule(rerollSounds(rolledSlots(weapon.slots, pendingReroll.candidate)))
  }, [pendingReroll, stats.rerolls, weapon.slots, schedule])

  useEffect(() => {
    const active = !!autoSession?.active
    if (active === autoActive.current) return
    autoActive.current = active
    if (active) schedule(autoStartSounds())
    else if (autoSession?.stopReason) schedule(autoStopSounds(autoSession.stopReason))
  }, [autoSession, schedule])

  useEffect(() => {
    if (!settlement || playedSettlement.current) return
    playedSettlement.current = true
    schedule(settlementSounds(settlement.grade))
  }, [settlement, schedule])
}
