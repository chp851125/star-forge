import { useEffect, useReducer, useRef, useState } from 'react'
import type { GameMode, RerollMode, Resources, Tier, Weapon, WeaponEvent } from '../../types'
import { MAX_STAR } from '../../config/balance'
import { WEAPON_STYLE } from '../../config/weapons'
import { AFFIXES } from '../../config/affixes'
import { LOCK_COST } from '../../config/reroll'
import { AUTO_STAR_SPEED } from '../../config/auto'
import { describeEnhance, getEnhanceCost } from '../../core/enhance'
import { RANDOMS_PER_REROLL, canAffixChange, canValueReroll, countLocked, getRerollCost } from '../../core/reroll'
import { getActionLimit } from '../../core/settlement'
import { createGame, gameReducer, isUnlimited } from '../../state/gameReducer'
import SwordStage, { OVERLAY_MS } from '../Sword/SwordStage'
import { useActiveEvent } from '../Sword/useActiveEvent'
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
import { useSettlement } from '../settlement/useSettlement'
import ResultScreen from './ResultScreen'

interface Props {
  mode: GameMode
  onRestart: () => void
}

type Slots = Weapon['slots']
const randomRolls = () => Array.from({ length: RANDOMS_PER_REROLL }, () => Math.random())

export default function MainScreen({ mode, onRestart }: Props) {
  const [state, dispatch] = useReducer(gameReducer, mode, (m) => createGame(m))
  const { weapon, resources: res, stats, log, lastEvent, lastResult, autoSession, settlement } = state
  const actionLimit = getActionLimit(mode)
  const turns = actionLimit === undefined ? undefined : actionLimit - state.actionsUsed
  const { rerollPhase, pendingReroll, lastRerollKind, lastDecision } = state
  const unlimited = isUnlimited(mode)
  const [tab, setTab] = useState<'star' | 'reroll'>('star')
  /** 開發面板的階級色預覽;undefined = 跟隨詞條 */
  const [auraPreview, setAuraPreview] = useState<Tier | null | undefined>(undefined)
  const { quality } = useQuality()
  const main = useRef<HTMLElement>(null)
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

  const animating = !!useActiveEvent(fx, OVERLAY_MS) || busy
  const { exhausted, notice } = useSettlement(state, dispatch, animating)
  const finishBlocked =
    autoRunning ? '自動升星進行中'
    : rerollPhase !== 'idle' ? '洗練視窗開啟中'
    : busy ? '動畫播放中'
    : null

  const rerollCost = getRerollCost(countLocked(weapon.slots))
  const noStone = !unlimited && res.starStone < (getEnhanceCost(stars, protect) ?? 0)
  const noReroll = !unlimited && res.rerollStone < rerollCost
  const noTurns = turns !== undefined && turns <= 0
  const rerollBlocked = noTurns ? '操作次數已用完' : noReroll ? '洗練石不足' : null
  const canContinue =
    !rerollBlocked && (lastRerollKind === 'lv' ? canValueReroll(weapon.slots) : canAffixChange(weapon.slots))

  /** 洗練時,開發面板的階級色預覽改回跟隨詞條 */
  const doReroll = (kind: RerollMode) => {
    setAuraPreview(undefined)
    dispatch({ type: 'REROLL', kind, rolls: randomRolls() })
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
      const i = Math.floor(Math.random() * slots.length)
      const unused = AFFIXES.find((d) => !slots.some((x) => x?.id === d.id))!
      slots[i] = { ...(slots[i] ?? { id: unused.id, locked: false }), lv: 15 }
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

  if (settlement) return <ResultScreen result={settlement} onRestart={onRestart} />

  return (
    <div className="lg:h-dvh lg:overflow-hidden">
    <main ref={main} className="mx-auto flex max-w-6xl flex-col gap-3 p-3 lg:h-full">
      <TopBar
        mode={mode} used={used} turnsLeft={turns}
        autoOn={autoOn} onAuto={toggleAuto} autoLocked={autoRunning}
        finishBlocked={finishBlocked}
        onFinish={() => dispatch({ type: 'FINISH_RUN', reason: 'manual' })} onRestart={onRestart}
      />

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
                  // 即將自動結算時不顯示摘要卡,併入結算統計
                  session: exhausted && !autoRunning ? null : autoSession,
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
                disabled={busy || autoRunning || exhausted || rerollPhase !== 'idle'}
                rerollBlocked={rerollBlocked}
                lockBlocked={!unlimited && res.rerollStone < LOCK_COST ? '洗練石不足,無法鎖定' : null}
                stoneText={stoneText}
                onToggleLock={(i) => dispatch({ type: 'TOGGLE_LOCK', slotIndex: i })}
                onReroll={doReroll}
              />
            )}
          </div>
          <StatsPanel stats={stats} log={log} milestones={state.milestones} />
          <DevPanel
            stars={stars} disabled={busy || autoRunning} onSetStars={devSet} onFx={devFx}
            auraPreview={auraPreview} onAuraPreview={setAuraPreview}
          />
        </section>
      </div>

      {notice && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center" role="alert">
          <div className="panel px-10 py-4 text-2xl font-extrabold tracking-widest text-tier-red">{notice}</div>
        </div>
      )}

      <span className="sr-only">{weapon.slots.map(affixText).join(',')}</span>
    </main>

      {rerollPhase !== 'idle' && lastRerollKind && (
        <CompareModal
          rollId={stats.rerolls}
          mode={lastRerollKind}
          before={weapon.slots}
          after={pendingReroll?.candidate ?? weapon.slots}
          applied={lastDecision === null ? null : lastDecision === 'adopt'}
          cost={rerollCost}
          stoneText={stoneText}
          canContinue={canContinue}
          continueBlocked={rerollBlocked}
          onApply={() => {
            setAuraPreview(undefined)
            dispatch({ type: 'DECIDE_ADOPT' })
          }}
          onKeep={() => dispatch({ type: 'DECIDE_KEEP' })}
          onContinue={() => {
            setAuraPreview(undefined)
            dispatch({ type: 'CONTINUE', rolls: randomRolls() })
          }}
          onClose={() => dispatch({ type: 'CLOSE_REROLL' })}
        />
      )}
    </div>
  )
}
