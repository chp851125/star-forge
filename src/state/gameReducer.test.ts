import { describe, expect, it } from 'vitest'
import { ENHANCE_TABLE } from '../config/balance'
import type { GameMode, Weapon } from '../types'
import { createGame, gameReducer, type GameAction, type GameState } from './gameReducer'

const slots: Weapon['slots'] = [{ id: 'attack', lv: 12, locked: true }, { id: 'critRate', lv: 7, locked: false }, null]
const limited = (starStone: number): GameMode => ({ kind: 'limited', preset: 'custom', quota: { starStone, rerollStone: 10 } })
const infinite: GameMode = { kind: 'infinite' }

/** roll 0 = 一定成功;接近 1 = 該列最後一種結果 */
const win: GameAction = { type: 'ENHANCE', protect: false, roll: 0 }
const lose: GameAction = { type: 'ENHANCE', protect: false, roll: 0.999999 }

const run = (s: GameState, ...actions: GameAction[]) => actions.reduce(gameReducer, s)
const at = (stars: number, mode: GameMode = infinite) =>
  run(createGame(mode, slots), { type: 'SET_STARS', stars })

describe('ENHANCE', () => {
  it('扣除資源並更新統計與紀錄', () => {
    const s = run(at(0, limited(10)), win)
    expect(s.weapon.stars).toBe(1)
    expect(s.resources.starStone).toBe(10 - ENHANCE_TABLE[0].cost)
    expect(s.stats).toMatchObject({ starAttempts: 1, successes: 1, highestStar: 1, starStoneUsed: ENHANCE_TABLE[0].cost })
    expect(s.log).toHaveLength(1)
    expect(s.lastEvent).toMatchObject({ id: 1, kind: 'success', evolved: false })
  })

  it('資源不足時狀態不變', () => {
    const s = at(5, limited(ENHANCE_TABLE[5].cost - 1))
    expect(gameReducer(s, win)).toBe(s)
  })

  it('15 星狀態不變', () => {
    const s = at(15)
    expect(gameReducer(s, win)).toBe(s)
  })

  it('無限模式不扣資源但計入累計消耗', () => {
    const s = run(at(5), win)
    expect(s.resources.starStone).toBe(0)
    expect(s.stats.starStoneUsed).toBe(ENHANCE_TABLE[5].cost)
  })

  it('跨階段標記進化,事件 id 遞增', () => {
    const s = run(at(1), win, win)
    expect(s.lastEvent).toMatchObject({ id: 2, kind: 'evolve', evolved: true })
  })

  it('歸零與掉星不影響詞條欄位', () => {
    const dropped = run(at(6), lose)
    const reset = run(at(14), lose)
    expect(dropped.lastResult?.outcome).toBe('drop')
    expect(reset.lastResult?.outcome).toBe('reset')
    expect(reset.weapon.stars).toBe(0)
    expect(dropped.weapon.slots).toEqual(slots)
    expect(reset.weapon.slots).toEqual(slots)
  })

  it('連續掉星兩次後保底', () => {
    const s = run(at(8), lose, lose, lose)
    expect(s.lastResult?.pityTriggered).toBe(true)
    expect(s.stats.pityCount).toBe(1)
    expect(s.consecutiveDrops).toBe(0)
  })

  it('連成 / 連敗與歷史最高星', () => {
    const s = run(at(0), win, win, win, lose, lose, win)
    expect(s.stats).toMatchObject({ maxSuccessStreak: 3, maxFailStreak: 2, successStreak: 1, failStreak: 0, highestStar: 4 })
  })

  it('SET_STARS 不計入統計', () => {
    const s = at(9)
    expect(s.stats).toMatchObject({ starAttempts: 0, highestStar: 0 })
  })
})

describe('autoSession', () => {
  const start: GameAction = { type: 'AUTO_START', target: 10, protect: false }

  it('累計次數、結果與消耗', () => {
    const s = run(at(5), start, win, lose)
    expect(s.autoSession).toMatchObject({
      active: true, startStar: 5, tries: 2,
      counts: { success: 1, keep: 0, drop: 1, reset: 0 },
      used: ENHANCE_TABLE[5].cost + ENHANCE_TABLE[6].cost,
    })
    expect(s.lastEvent?.auto).toBe(true)
  })

  it('停止原因寫入一次,之後不再累計', () => {
    const cancelled = run(at(5), start, win, { type: 'AUTO_CANCEL' })
    expect(cancelled.autoSession).toMatchObject({ active: false, stopReason: 'cancelled' })
    const after = run(cancelled, { type: 'AUTO_STOP', reason: 'target' }, win)
    expect(after.autoSession).toMatchObject({ tries: 1, stopReason: 'cancelled' })
    expect(run(at(5), start, { type: 'AUTO_STOP', reason: 'noResource' }).autoSession?.stopReason).toBe('noResource')
  })

  it('目標不高於目前星級時不啟動', () => {
    expect(run(at(10), start).autoSession).toBeNull()
  })
})
