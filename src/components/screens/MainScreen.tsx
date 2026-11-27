import { useEffect, useRef, useState } from 'react'
import type { AffixSlot, GameMode, Resources, RunStats, StarResult, Tier, Weapon, WeaponEvent } from '../../types'
import { MAX_STARS, REROLL_BASE_COST, STAR_COST } from '../../config/balance'
import { WEAPON_STYLE, stageOf } from '../../config/weapons'
import { tierOfLv } from '../../config/affixes'
import { emptyStats, fakeRoll, mockWeapon, rand } from '../../mock/mockState'
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

interface Props {
  mode: GameMode
  onFinish: (w: Weapon, s: RunStats) => void
  onRestart: () => void
}

type Slots = Weapon['slots']

export default function MainScreen({ mode, onFinish, onRestart }: Props) {
  const unlimited = mode.kind === 'infinite' || mode.preset === 'turns'
  const [weapon, setWeapon] = useState<Weapon>({ ...mockWeapon, slots: [...mockWeapon.slots] as Slots })
  const [res, setRes] = useState<Resources>(mode.kind === 'limited' ? mode.quota : { starStone: 0, rerollStone: 0 })
  const [turns, setTurns] = useState(mode.kind === 'limited' ? mode.turns : undefined)
  const [stats, setStats] = useState<RunStats>(emptyStats())
  const [tab, setTab] = useState<'star' | 'reroll'>('star')
  const [fx, setFx] = useState<WeaponEvent | null>(null)
  /** 開發面板的階級色預覽;undefined = 跟隨詞條 */
  const [auraPreview, setAuraPreview] = useState<Tier | null | undefined>(undefined)
  const { quality } = useQuality()
  const main = useRef<HTMLElement>(null)
  const [busy, setBusy] = useState(false)
  const [pending, setPending] = useState<{ title: string; after: Slots } | null>(null)
  const n = useRef(0)
  const timer = useRef<number>(0)
  useEffect(() => () => clearTimeout(timer.current), [])

  const log = (msg: string, patch: Partial<RunStats> = {}) =>
    setStats((s) => ({ ...s, ...patch, log: [msg, ...s.log] }))

  const spend = (star: number, reroll: number) => {
    if (!unlimited) setRes((r) => ({ starStone: r.starStone - star, rerollStone: r.rerollStone - reroll }))
    if (turns !== undefined) setTurns((t) => (t ?? 1) - 1)
  }

  /** 播放特效並更新星級(歸零延後到碎裂動畫結束) */
  const play = (kind: WeaponEvent['kind'], to: number, slot?: number) => {
    setFx({ kind, n: ++n.current, slot })
    if (kind === 'reset' && quality !== 'off') {
      setBusy(true)
      main.current?.animate(
        [0, -10, 9, -8, 6, -4, 0].map((x, i) => ({ transform: `translate(${x}px, ${i % 2 ? 4 : x ? -4 : 0}px)` })),
        { duration: 600 },
      )
      timer.current = window.setTimeout(() => {
        setWeapon((w) => ({ ...w, stars: to }))
        setBusy(false)
      }, SHATTER_MS)
    } else if (kind !== 'red') setWeapon((w) => ({ ...w, stars: to }))
  }

  const starResult = (from: number, r: StarResult): number => (r === 'reset' ? 0 : r === 'drop' ? from - 1 : from + 1)

  const doStar = () => {
    const from = weapon.stars
    const roll = Math.random()
    let r: StarResult = roll < 0.5 ? 'success' : roll < 0.8 ? 'drop' : 'reset'
    if (from === 0 && r !== 'success') r = 'success'
    if (r === 'success' && stageOf(from + 1) !== stageOf(from)) r = 'evolve'
    const to = starResult(from, r === 'evolve' ? 'success' : r)
    spend(STAR_COST, 0)
    play(r, to)
    const key = r === 'success' || r === 'evolve' ? 'successes' : r === 'drop' ? 'drops' : 'resets'
    log(`衝星 +${from}→+${to} ${{ success: '成功', evolve: '成功(進化)', drop: '掉星', reset: '歸零' }[r]}`, {
      starAttempts: stats.starAttempts + 1,
      [key]: stats[key] + 1,
      starStoneUsed: stats.starStoneUsed + STAR_COST,
    })
  }

  const locked = weapon.slots.filter((s) => s?.locked).length
  const rerollCost = REROLL_BASE_COST + locked

  const toggleLock = (i: number) => {
    const s = weapon.slots[i]
    if (!s) return
    const lock = !s.locked
    if (lock && !unlimited && res.rerollStone < 1) return
    const slots = [...weapon.slots] as Slots
    slots[i] = { ...s, locked: lock }
    setWeapon({ ...weapon, slots })
    if (lock) {
      spend(0, 1)
      log(`鎖定詞條 ${i + 1}`, { rerollStoneUsed: stats.rerollStoneUsed + 1 })
    } else log(`解除鎖定詞條 ${i + 1}`)
  }

  const doReroll = (m: 'affix' | 'lv') => {
    const after = weapon.slots.map((s) => (s && !s.locked ? fakeRoll(s, m, rand(12) === 0) : s)) as Slots
    spend(0, rerollCost)
    setPending({ title: m === 'affix' ? '詞條變更' : '數值重洗', after })
    setStats((s) => ({ ...s, rerolls: s.rerolls + 1, rerollStoneUsed: s.rerollStoneUsed + rerollCost }))
  }

  const resolve = (apply: boolean) => {
    if (!pending) return
    const t = pending.title
    if (apply) {
      const redIdx = pending.after.findIndex((s, i) => s && tierOfLv(s.lv) === 'red' && s.lv !== weapon.slots[i]?.lv)
      setWeapon((w) => ({ ...w, slots: pending.after }))
      if (redIdx >= 0) setAuraPreview(undefined)
      if (redIdx >= 0) setFx({ kind: 'red', n: ++n.current, slot: redIdx })
    }
    log(`洗練 ${t}(${apply ? '效果變更' : '效果維持'})`)
    setPending(null)
  }

  // 開發面板
  const devSet = (v: number) => setWeapon((w) => ({ ...w, stars: v }))
  const devFx = (k: WeaponEvent['kind']) => {
    const s = weapon.stars
    if (k === 'success') play('success', Math.min(MAX_STARS, s + 1))
    else if (k === 'evolve') {
      const nxt = WEAPON_STYLE.stages.find((t) => t.minStar > s)?.minStar ?? MAX_STARS
      play('evolve', nxt)
    } else if (k === 'drop') play('drop', Math.max(0, s - 1))
    else if (k === 'reset') play('reset', 0)
    else {
      const slots = [...weapon.slots] as Slots
      const i = rand(3)
      slots[i] = { ...(slots[i] ?? fakeRoll(null, 'affix')!), lv: 15 } as AffixSlot
      setWeapon({ ...weapon, slots })
      setAuraPreview(undefined)
      play('red', s, i)
    }
  }

  const noStone = !unlimited && res.starStone < STAR_COST
  const noReroll = !unlimited && res.rerollStone < rerollCost
  const exhausted = (turns !== undefined && turns <= 0) || (mode.kind === 'limited' && mode.preset !== 'turns' && noStone && res.rerollStone < 1)

  useEffect(() => {
    if (exhausted && !busy && !pending) {
      const t = setTimeout(() => onFinish(weapon, stats), 1200)
      return () => clearTimeout(t)
    }
  }, [exhausted, busy, pending]) // eslint-disable-line react-hooks/exhaustive-deps

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
      <TopBar mode={mode} resources={res} turnsLeft={turns} onFinish={() => onFinish(weapon, stats)} onRestart={onRestart} />
      {exhausted && <div className="border border-tier-red bg-tier-red/10 p-2 text-center text-tier-red" role="alert">資源已耗盡,即將結算…</div>}

      <div className="grid gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-2 lg:grid-rows-1">
        <section className="flex min-w-0 flex-col gap-2 lg:min-h-0">
          <SwordStage fill stars={weapon.stars} slots={weapon.slots} fx={fx} auraTier={auraPreview} />
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
              <StarPanel stars={weapon.stars} disabled={busy || noStone || exhausted} onStar={doStar} />
            ) : (
              <RerollPanel slots={weapon.slots} disabled={busy || noReroll || exhausted} onToggleLock={toggleLock} onReroll={doReroll} />
            )}
          </div>
          <StatsPanel stats={stats} />
          <DevPanel
            stars={weapon.stars} disabled={busy} onSetStars={devSet} onFx={devFx}
            auraPreview={auraPreview} onAuraPreview={setAuraPreview}
          />
        </section>
      </div>

      {pending && (
        <CompareModal
          title={pending.title}
          before={weapon.slots}
          after={pending.after}
          onKeep={() => resolve(false)}
          onApply={() => resolve(true)}
        />
      )}
      <span className="sr-only">{weapon.slots.map(affixText).join(',')}</span>
    </main>
    </div>
  )
}
