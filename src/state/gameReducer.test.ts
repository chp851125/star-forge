import { describe, expect, it } from 'vitest'
import { ENHANCE_TABLE } from '../config/balance'
import { RANDOMS_PER_REROLL } from '../core/reroll'
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

describe('洗練', () => {
  const stones = (rerollStone: number): GameMode => ({ kind: 'limited', preset: 'custom', quota: { starStone: 0, rerollStone } })
  /** 0 = 全部欄位出現、Lv1;接近 1 = 只出現第 1 欄、Lv15 */
  const rolls = (v: number) => Array<number>(RANDOMS_PER_REROLL).fill(v)
  const reroll: GameAction = { type: 'REROLL', kind: 'lv', rolls: rolls(0) }
  const change: GameAction = { type: 'REROLL', kind: 'affix', rolls: rolls(0.999999) }
  const cont: GameAction = { type: 'CONTINUE', rolls: rolls(0) }
  const adopt: GameAction = { type: 'DECIDE_ADOPT' }
  const keep: GameAction = { type: 'DECIDE_KEEP' }
  const close: GameAction = { type: 'CLOSE_REROLL' }
  const lock = (slotIndex: number): GameAction => ({ type: 'TOGGLE_LOCK', slotIndex })

  it('扣石頭並進入 pending,詞條尚未改變', () => {
    const s = run(createGame(stones(10), slots), reroll)
    expect(s.rerollPhase).toBe('pending')
    expect(s.lastRerollKind).toBe('lv')
    expect(s.resources.rerollStone).toBe(8) // 鎖定 1 條
    expect(s.weapon.slots).toEqual(slots)
  })

  it('pending 時不可再洗、繼續、關閉或切換鎖定', () => {
    const s = run(createGame(infinite, slots), reroll)
    for (const act of [reroll, cont, close, lock(1)]) expect(gameReducer(s, act)).toBe(s)
  })

  it('DECIDE_ADOPT 整組套用並進入 decided,不影響星級', () => {
    const pending = run(at(7), change)
    const s = run(pending, adopt)
    expect(s.weapon.slots).toEqual(pending.pendingReroll!.candidate)
    expect(s.weapon.stars).toBe(7)
    expect(s.rerollPhase).toBe('decided')
    expect(s.pendingReroll).toBeNull()
  })

  it('DECIDE_KEEP 不改詞條;decided 時決定無效', () => {
    const s = run(createGame(infinite, slots), reroll, keep)
    expect(s.weapon.slots).toEqual(slots)
    expect(s.rerollPhase).toBe('decided')
    expect(gameReducer(s, adopt)).toBe(s)
  })

  it('CONTINUE 僅在 decided 有效,沿用上次種類並扣石頭', () => {
    const idle = createGame(stones(10), slots)
    expect(gameReducer(idle, cont)).toBe(idle)
    const s = run(idle, reroll, keep, cont)
    expect(s.rerollPhase).toBe('pending')
    expect(s.pendingReroll?.kind).toBe('lv')
    expect(s.resources.rerollStone).toBe(6)
  })

  it('CLOSE_REROLL 僅在 decided 有效', () => {
    const idle = createGame(infinite, slots)
    expect(gameReducer(idle, close)).toBe(idle)
    expect(run(idle, reroll, keep, close).rerollPhase).toBe('idle')
  })

  it('洗練石不足時狀態不變', () => {
    const idle = createGame(stones(1), slots)
    expect(gameReducer(idle, reroll)).toBe(idle)
    const decided = run(createGame(stones(2), slots), reroll, keep)
    expect(gameReducer(decided, cont)).toBe(decided)
  })

  it('無限模式不扣但計入累計消耗', () => {
    const s = run(createGame(infinite, slots), reroll)
    expect(s.resources.rerollStone).toBe(0)
    expect(s.stats.rerollStoneUsed).toBe(2)
  })

  it('鎖定扣 1、解除免費', () => {
    const locked = run(createGame(stones(10), slots), lock(1))
    expect(locked.weapon.slots[1]?.locked).toBe(true)
    expect(locked.resources.rerollStone).toBe(9)
    const unlocked = run(locked, lock(1))
    expect(unlocked.weapon.slots[1]?.locked).toBe(false)
    expect(unlocked.resources.rerollStone).toBe(9)
    expect(unlocked.stats.rerollStoneUsed).toBe(1)
  })

  it('空欄、石頭不足、非 idle 時不可鎖定', () => {
    const idle = createGame(stones(0), slots)
    expect(gameReducer(idle, lock(2))).toBe(idle)
    expect(gameReducer(idle, lock(1))).toBe(idle)
    const decided = run(createGame(infinite, slots), reroll, keep)
    expect(gameReducer(decided, lock(1))).toBe(decided)
  })

  it('統計:次數、鎖定洗練、金 / 紅洗出數、洗練石消耗', () => {
    // 第 1 次不鎖定洗出紅階(維持),之後鎖定第 1 欄再洗出藍階
    const s = run(createGame(infinite), change, keep, close, change, adopt, close, lock(0), cont, change)
    expect(s.stats).toMatchObject({ rerolls: 3, lockedRerolls: 1, redRolled: 2, goldPlusRolled: 2, rerollStoneUsed: 5 })
  })

  it('金階計入金階以上,不計入紅階', () => {
    // Lv 權重 0.95 落在金階
    const s = run(createGame(infinite, slots), { type: 'REROLL', kind: 'lv', rolls: rolls(0.95) })
    expect(s.stats).toMatchObject({ goldPlusRolled: 1, redRolled: 0 })
  })

  it('洗出紅詞條時發出紅光事件,採用時再發一次', () => {
    const pending = run(createGame(infinite), change)
    expect(pending.lastEvent).toMatchObject({ id: 1, kind: 'red', slot: 0 })
    expect(run(pending, adopt).lastEvent).toMatchObject({ id: 2, kind: 'red', slot: 0 })
  })
})
