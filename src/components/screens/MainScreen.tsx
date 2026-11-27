import { useEffect, useReducer, useRef, useState } from 'react'
import type { AffixSlot, GameMode, RerollMode, Resources, RunStats, Tier, Weapon, WeaponEvent } from '../../types'
import { MAX_STAR, REROLL_BASE_COST } from '../../config/balance'
import { WEAPON_STYLE } from '../../config/weapons'
import { tierOfLv } from '../../config/affixes'
import { AUTO_STAR_SPEED } from '../../config/auto'
import { describeEnhance, getEnhanceCost } from '../../core/enhance'
import { createGame, gameReducer, isUnlimited } from '../../state/gameReducer'
import { fakeReroll, fakeRoll, mockWeapon, rand } from '../../mock/mockState'
import SwordStage from '../Sword/SwordStage'
import { SHATTER_MS } from '../Sword/WeaponArt'
import { useQuality } from '../Sword/quality'
import TopBar from '../panels/TopBar'
import AffixList, { affixText } from '../panels/AffixList'
import StarPanel from '../panels/StarPanel'
import RerollPanel from '../panels/RerollPanel'
import StatsPanel from '../panels/StatsPanel'
import DevPanel from '../panels/DevPanel'
import CompareModal from '../modals/CompareModal'
import { useAutoEnhance } from '../auto/useAutoEnhance'

interface Props {
  mode: GameMode
  onFinish: (w: Weapon, s: RunStats) => void
  onRestart: () => void
}

type Slots = Weapon['slots']
const MODE_LABEL: Record<RerollMode, string> = { affix: '詞條變更', lv: '數值重洗' }

export default function MainScreen({ mode, onFinish, onRestart }: Props) {
  const [state, dispatch] = useReducer(gameReducer, mode, (m) => createGame(m, mockWeapon.slots))
  const { weapon, resources: res, turnsLeft: turns, stats, log, lastEvent, lastResult, autoSession } = state
  const unlimited = isUnlimited(mode)
  const [tab, setTab] = useState<'star' | 'reroll'>('star')
  /** 開發面板的階級色預覽;undefined = 跟隨詞條 */
  const [auraPreview, setAuraPreview] = useState<Tier | null | undefined>(undefined)
  const { quality } = useQuality()
  const main = useRef<HTMLElement>(null)
  /** 洗練視窗內容;applied null = 尚未決定 */
  const [roll, setRoll] = useState<{ id: number; mode: RerollMode; before: Slots; after: Slots; applied: boolean | null } | null>(null)
  const rolls = useRef(0)
  /** 自動功能總開關(只存在記憶體) */
  const [autoOn, setAutoOn] = useState(false)
  const [starTarget, setStarTarget] = useState(0)
  const [protect, setProtect] = useState(false)
  useAutoEnhance(state, dispatch)
  const autoRunning = !!autoSession?.active

  const speed = lastEvent?.auto ? AUTO_STAR_SPEED : 1
  const fx: WeaponEvent | null = lastEvent && { kind: lastEvent.kind, n: lastEvent.id, slot: lastEvent.slot, speed }

  /** 歸零:碎裂動畫結束前仍顯示舊星級 */
  const [settled, setSettled] = useState(0)
  const busy = lastEvent?.kind === 'reset' && lastEvent.id !== settled && quality !== 'off'
  const stars = busy ? lastEvent.from : weapon.stars
  useEffect(() => {
    if (!busy) return
    main.current?.animate(
      [0, -10, 9, -8, 6, -4, 0].map((x, i) => ({ transform: `translate(${x}px, ${i % 2 ? 4 : x ? -4 : 0}px)` })),
      { duration: 600 / speed },
    )
    const t = window.setTimeout(() => setSettled(lastEvent.id), SHATTER_MS / speed)
    return () => clearTimeout(t)
  }, [busy, lastEvent?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const locked = weapon.slots.filter((s) => s?.locked).length
  const rerollCost = REROLL_BASE_COST + locked
  const noStone = !unlimited && res.starStone < (getEnhanceCost(stars, protect) ?? 0)
  const noReroll = !unlimited && res.rerollStone < rerollCost
  const noTurns = turns !== undefined && turns <= 0
  const exhausted = noTurns || (!unlimited && res.starStone < (getEnhanceCost(stars, false) ?? 0) && res.rerollStone < 1)

  const toggleLock = (i: number) => {
    const s = weapon.slots[i]
    if (!s) return
    const lock = !s.locked
    if (lock && (noTurns || (!unlimited && res.rerollStone < 1))) return
    const slots = [...weapon.slots] as Slots
    slots[i] = { ...s, locked: lock }
    dispatch({ type: 'SET_SLOTS', slots })
    dispatch(
      lock
        ? { type: 'REROLL_RECORD', message: `鎖定詞條 ${i + 1}`, stones: 1 }
        : { type: 'REROLL_RECORD', message: `解除鎖定詞條 ${i + 1}` },
    )
  }

  /** 洗出紅詞條時,展示台紅光爆發 */
  const burstRed = (before: Slots, after: Slots) => {
    const i = after.findIndex((s, i) => s && s !== before[i] && tierOfLv(s.lv) === 'red')
    if (i < 0) return
    setAuraPreview(undefined)
    dispatch({ type: 'PREVIEW_FX', kind: 'red', slot: i })
  }

  const canReroll = (m: RerollMode) =>
    !noReroll && !exhausted && weapon.slots.some((s) => (m === 'affix' ? !s?.locked : s && !s.locked))

  const doReroll = (m: RerollMode) => {
    const after = fakeReroll(weapon.slots, m)
    dispatch({ type: 'REROLL_RECORD', message: `洗練 ${MODE_LABEL[m]}`, rerolls: 1, stones: rerollCost })
    setRoll({ id: ++rolls.current, mode: m, before: weapon.slots, after, applied: null })
    burstRed(weapon.slots, after)
  }

  const resolve = (apply: boolean) => {
    if (!roll || roll.applied !== null) return
    if (apply) {
      dispatch({ type: 'SET_SLOTS', slots: roll.after })
      burstRed(roll.before, roll.after)
    }
    dispatch({ type: 'REROLL_RECORD', message: `洗練 ${MODE_LABEL[roll.mode]}(${apply ? '效果變更' : '效果維持'})` })
    setRoll({ ...roll, applied: apply })
  }

  const toggleAuto = (v: boolean) => {
    setAutoOn(v)
    dispatch({ type: 'AUTO_CLOSE' })
  }

  // 開發面板
  const devSet = (v: number) => dispatch({ type: 'SET_STARS', stars: v })
  const devFx = (k: WeaponEvent['kind']) => {
    const s = weapon.stars
    if (k === 'red') {
      const slots = [...weapon.slots] as Slots
      const i = rand(3)
      slots[i] = { ...(slots[i] ?? fakeRoll(null, 'affix')!), lv: 15 } as AffixSlot
      dispatch({ type: 'SET_SLOTS', slots })
      setAuraPreview(undefined)
      dispatch({ type: 'PREVIEW_FX', kind: k, slot: i })
      return
    }
    const to =
      k === 'success' ? Math.min(MAX_STAR, s + 1)
      : k === 'evolve' ? WEAPON_STYLE.stages.find((t) => t.minStar > s)?.minStar ?? MAX_STAR
      : k === 'drop' ? Math.max(0, s - 1)
      : k === 'reset' ? 0
      : s
    dispatch({ type: 'PREVIEW_FX', kind: k, to })
  }

  const used: Resources = { starStone: stats.starStoneUsed, rerollStone: stats.rerollStoneUsed }
  const totalNote = mode.kind === 'infinite' ? `本局累計消耗:升星石 ${used.starStone} / 洗練石 ${used.rerollStone}` : undefined
  const stoneText = unlimited
    ? `本局累計消耗洗練石 ${used.rerollStone}${turns !== undefined ? ` · 剩餘次數 ${turns}` : ''}`
    : `洗練石剩餘 ${res.rerollStone}${noReroll ? `(本次需 ${rerollCost},不足)` : ''}`

  const tabBtn = (id: 'star' | 'reroll', label: string) => (
    <button
      role="tab" aria-selected={tab === id}
      className={`min-h-[44px] flex-1 border-b-2 font-semibold ${tab === id ? 'border-cyan text-cyan' : 'border-transparent text-muted'}`}
      onClick={() => setTab(id)}
    >
      {label}
    </button>
  )

  return (
    <div className="lg:h-dvh lg:overflow-hidden">
    <main ref={main} className="mx-auto flex max-w-6xl flex-col gap-3 p-3 lg:h-full">
      <TopBar
        mode={mode} resources={res} used={used} turnsLeft={turns}
        autoOn={autoOn} onAuto={toggleAuto} autoLocked={autoRunning}
        finishDisabled={busy || autoRunning}
        onFinish={() => onFinish(weapon, stats)} onRestart={onRestart}
      />
      {exhausted && <div className="border border-tier-red bg-tier-red/10 p-2 text-center text-tier-red" role="alert">資源已耗盡</div>}

      <div className="grid gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-2 lg:grid-rows-1">
        <section className="flex min-w-0 flex-col gap-2 lg:min-h-0">
          <SwordStage
            fill stars={stars} slots={weapon.slots} fx={fx} auraTier={auraPreview}
            message={lastResult && !busy ? describeEnhance(lastResult.from, lastResult) : busy ? '歸零!' : ''}
          />
          <AffixList slots={weapon.slots} fx={fx} />
        </section>

        {/* 展開收合區塊時只在右欄內捲動 */}
        <section className="min-w-0 space-y-2 lg:min-h-0 lg:overflow-y-auto">
          <div className="panel p-3">
            <div role="tablist" className="mb-2 flex border-b border-cyan/30">
              {tabBtn('star', '衝星台')}
              {tabBtn('reroll', '洗練台')}
            </div>
            {tab === 'star' ? (
              <StarPanel
                stars={stars}
                disabled={busy || autoRunning}
                noTurns={noTurns}
                stones={unlimited ? null : res.starStone}
                consecutiveDrops={state.consecutiveDrops}
                protect={protect}
                onProtect={setProtect}
                onStar={() => dispatch({ type: 'ENHANCE', protect, roll: Math.random() })}
                auto={autoOn ? {
                  session: autoSession,
                  lastResult,
                  target: Math.min(MAX_STAR, Math.max(stars + 1, starTarget)),
                  onTarget: setStarTarget,
                  disabled: busy || noStone || noTurns,
                  noTurns,
                  onStart: (target) => {
                    setStarTarget(target)
                    dispatch({ type: 'AUTO_START', target, protect })
                  },
                  onStop: () => dispatch({ type: 'AUTO_CANCEL' }),
                  onClose: () => dispatch({ type: 'AUTO_CLOSE' }),
                  totalNote,
                } : undefined}
              />
            ) : (
              <RerollPanel
                slots={weapon.slots}
                disabled={busy || autoRunning || exhausted || !!roll}
                noReroll={noReroll}
                lockBlocked={noTurns ? '操作次數已用完' : !unlimited && res.rerollStone < 1 ? '洗練石不足,無法鎖定' : null}
                stoneText={stoneText}
                onToggleLock={toggleLock}
                onReroll={doReroll}
              />
            )}
          </div>
          <StatsPanel stats={stats} log={log} />
          <DevPanel
            stars={stars} disabled={busy || autoRunning} onSetStars={devSet} onFx={devFx}
            auraPreview={auraPreview} onAuraPreview={setAuraPreview}
          />
        </section>
      </div>

      <span className="sr-only">{weapon.slots.map(affixText).join(',')}</span>
    </main>

      {roll && (
        <CompareModal
          rollId={roll.id}
          mode={roll.mode}
          before={roll.before}
          after={roll.after}
          applied={roll.applied}
          cost={rerollCost}
          stoneText={stoneText}
          canContinue={canReroll(roll.mode)}
          onApply={() => resolve(true)}
          onKeep={() => resolve(false)}
          onContinue={() => doReroll(roll.mode)}
          onClose={() => setRoll(null)}
        />
      )}
    </div>
  )
}
