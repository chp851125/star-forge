import { useEffect, useRef } from 'react'
import type { AffixSlot, Tier, WeaponEvent } from '../../types'
import { MAX_STARS } from '../../config/balance'
import { WEAPON_STYLE, stageOf } from '../../config/weapons'
import { AURA_CLASS, highestTier, slotTier } from '../tierStyle'
import WeaponArt from './WeaponArt'
import GemSlots from './GemSlots'
import StarBar from './StarBar'
import { useQuality } from './quality'
import { useActiveEvent } from './useActiveEvent'

interface Props {
  stars: number
  slots: [AffixSlot, AffixSlot, AffixSlot]
  fx: WeaponEvent | null
  /** 覆寫光環色(預覽用);undefined = 最高階詞條色 */
  auraTier?: Tier | null
  /** 桌面版撐滿父層高度(主畫面用) */
  fill?: boolean
}

const OVERLAY_MS: Record<WeaponEvent['kind'], number> = { success: 900, evolve: 1000, drop: 1000, reset: 1400, red: 1000 }

const SPARKS = Array.from({ length: 10 }, (_, i) => {
  const a = (i / 10) * Math.PI * 2
  return { dx: Math.cos(a) * 110, dy: Math.sin(a) * 110 }
})

export default function SwordStage({ stars, slots, fx, auraTier, fill = false }: Props) {
  const { quality } = useQuality()
  const active = useActiveEvent(fx, OVERLAY_MS)
  const k = active?.kind
  const animated = quality !== 'off'
  const aura = auraTier !== undefined ? auraTier : highestTier(slots.map(slotTier))
  const sparks = quality === 'high' ? SPARKS : SPARKS.filter((_, i) => i % 2 === 0)
  const root = useRef<HTMLDivElement>(null)

  // 加速本次事件的一次性動畫;無限循環的待機動畫不受影響
  useEffect(() => {
    const speed = fx?.speed ?? 1
    if (speed === 1) return
    for (const a of root.current!.getAnimations({ subtree: true })) {
      if (a.effect?.getTiming().iterations !== Infinity) a.updatePlaybackRate(speed)
    }
  }, [fx?.n]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={root} className={`panel aura-scope relative mx-auto flex w-full flex-col overflow-hidden px-3 py-2 ${fill ? 'lg:min-h-0 lg:flex-1' : 'max-w-md'} ${AURA_CLASS(aura)}`}>
      {/* 放射狀背光 */}
      <div
        className="stage-backlight pointer-events-none absolute inset-0"
        style={{ opacity: 0.1 + (0.3 * stars) / MAX_STARS }}
        aria-hidden
      />

      <div className="pointer-events-none absolute inset-x-3 top-2 z-10 flex items-start justify-between">
        <span className="text-sm text-muted">{WEAPON_STYLE.name} · {WEAPON_STYLE.stages[stageOf(stars)].name}</span>
        <span
          key={fx?.n ?? 0}
          className="fx-badge-pop flex h-14 w-14 items-center justify-center rounded-full border-2 border-cyan bg-panel text-2xl font-extrabold text-ink shadow-glow"
        >
          +{stars}
        </span>
      </div>

      <div className={`relative h-[45dvh] shrink-0 ${fill ? 'lg:h-auto lg:min-h-0 lg:flex-1 lg:shrink' : ''}`}>
        <WeaponArt stars={stars} auraTier={aura} event={fx} className="absolute inset-0 h-full w-full" />
        <div className="absolute left-[min(50%+7.5rem,100%-2.75rem)] top-1/2 z-10 -translate-y-1/2">
          <GemSlots slots={slots} fx={animated ? active : null} />
        </div>

        {animated && (k === 'success' || k === 'evolve') && (
          <div key={active!.n} className="pointer-events-none absolute inset-0" aria-hidden>
            <div className={`fx-ring absolute left-1/2 top-[45%] -ml-24 -mt-24 h-48 w-48 rounded-full border-4 ${k === 'evolve' ? 'border-ink' : 'border-cyan'}`} />
            {sparks.map((s, i) => (
              <span
                key={i}
                className="fx-spark absolute left-1/2 top-[45%] h-2 w-2 rounded-full bg-cyan"
                style={{ ['--dx' as string]: `${s.dx}px`, ['--dy' as string]: `${s.dy}px` }}
              />
            ))}
          </div>
        )}
      </div>

      {k === 'drop' && (
        <div className="pointer-events-none absolute right-6 top-20 text-2xl font-extrabold text-tier-red" role="status">-1</div>
      )}
      {animated && k === 'evolve' && <div key={`flash-${active!.n}`} className="fx-evolve stage-flash pointer-events-none absolute inset-0" aria-hidden />}
      {animated && (k === 'drop' || k === 'reset' || k === 'red') && (
        <div key={`red-${active!.n}`} className="fx-red-flash pointer-events-none absolute inset-0 bg-tier-red/40" aria-hidden />
      )}
      {k === 'reset' && (
        <div key={`warn-${active!.n}`} className="fx-warn pointer-events-none absolute inset-x-0 top-1/2 bg-tier-red py-2 text-center text-xl font-extrabold tracking-widest text-bg" role="alert">
          ⚠ 歸零 ⚠
        </div>
      )}

      <div className="relative shrink-0">
        <StarBar stars={stars} />
      </div>
    </div>
  )
}
