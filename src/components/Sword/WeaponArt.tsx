import { useEffect, useId, useRef, useState } from 'react'
import type { Tier, WeaponEvent } from '../../types'
import { WEAPON_STYLE, stageOf } from '../../config/weapons'
import { MAX_STARS } from '../../config/balance'
import { AURA_CLASS } from '../tierStyle'
import Defs from './Defs'
import Shatter from './Shatter'
import { STAGES } from './stages'
import { useQuality } from './quality'
import { useActiveEvent } from './useActiveEvent'
import './sword.css'

interface Props {
  stars: number
  /** null = 無詞條,使用預設青色 */
  auraTier: Tier | null
  event: WeaponEvent | null
  className?: string
}

/** 歸零時外部需在碎裂結束(此時間)後才更新星級 */
export const SHATTER_MS = 900
const DURATION: Record<WeaponEvent['kind'], number> = { success: 1000, evolve: 1000, drop: 1000, reset: SHATTER_MS + 60, red: 1000 }
const FADE_MS = 450

export default function WeaponArt({ stars, auraTier, event, className = '' }: Props) {
  const p = `w${useId().replace(/[^a-zA-Z0-9]/g, '')}-`
  const { quality } = useQuality()
  const active = useActiveEvent(event, DURATION)
  const kind = active?.kind
  const shattering = kind === 'reset' && quality !== 'off'
  const stage = stageOf(stars)
  const body = useRef<SVGGElement>(null)

  // 階段切換淡入淡出(歸零碎裂後只淡入新劍)
  const [view, setView] = useState<{ stage: number; prev: number | null }>({ stage, prev: null })
  if (view.stage !== stage) setView({ stage, prev: shattering ? null : view.stage })
  useEffect(() => {
    if (view.prev === null) return
    const t = window.setTimeout(() => setView((v) => ({ ...v, prev: null })), FADE_MS)
    return () => clearTimeout(t)
  }, [view])

  useEffect(() => {
    const el = body.current
    if (!el || !event || quality === 'off') return
    if (event.kind === 'success' || event.kind === 'evolve') {
      el.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.1)', offset: 0.35 }, { transform: 'scale(0.97)', offset: 0.7 }, { transform: 'scale(1)' }],
        { duration: 500, easing: 'ease-out' },
      )
      const rate = (r: number) =>
        el.querySelectorAll('.w-shine').forEach((s) => s.getAnimations().forEach((a) => a.updatePlaybackRate(r)))
      // 等跨階段的新光帶掛載後再加速
      const start = window.setTimeout(() => rate(3), 30)
      const end = window.setTimeout(() => rate(1), 1030)
      return () => {
        clearTimeout(start)
        clearTimeout(end)
        rate(1)
      }
    }
    if (event.kind === 'drop') {
      el.animate(
        [{ transform: 'translateY(0)' }, { transform: 'translateY(16px)', offset: 0.3 }, { transform: 'translateY(12px)', offset: 0.7 }, { transform: 'translateY(0)' }],
        { duration: DURATION.drop, easing: 'ease-in-out' },
      )
    }
  }, [event?.n]) // eslint-disable-line react-hooks/exhaustive-deps

  const props = { p, quality }
  const Art = STAGES[stage]
  const Prev = view.prev === null ? null : STAGES[view.prev]
  /** 光環強度隨星級 */
  const strength = 0.35 + (0.65 * stars) / MAX_STARS

  return (
    <svg
      viewBox="-86 -272 172 384"
      preserveAspectRatio="xMidYMid meet"
      overflow="visible"
      className={`weapon ${AURA_CLASS(auraTier)} ${className}`}
      role="img"
      aria-label={`${WEAPON_STYLE.name} +${stars},${WEAPON_STYLE.stages[stage].name}`}
    >
      <Defs p={p} />

      {/* 地面光環與倒影 */}
      <g opacity={strength}>
        <ellipse className="w-breathe" cy="86" rx="76" ry="14" fill={`url(#${p}aura)`} />
        <ellipse cy="86" rx="46" ry="7" fill="none" stroke="var(--aura)" strokeWidth="1.5" opacity=".7" />
      </g>
      {!shattering && (
        <g mask={`url(#${p}reflect)`} aria-hidden>
          <g transform="translate(0 172) scale(1 -1)"><Art {...props} solid /></g>
        </g>
      )}

      <g className={kind === 'drop' ? 'w-body w-dropped' : 'w-body'}>
        <g ref={body}>
          {shattering ? (
            <Shatter {...props} stage={stage} />
          ) : (
            <>
              {Prev && quality !== 'off' && (
                <g key={`prev-${view.prev}`} className="w-fade-out"><Prev {...props} solid /></g>
              )}
              <g key={stage} className="w-fade-in" style={{ ['--strength' as string]: strength }}>
                <Art {...props} />
              </g>
            </>
          )}
        </g>
      </g>

      {kind === 'red' && quality !== 'off' && (
        <circle key={active!.n} className="w-red-pulse fill-none stroke-tier-red" cy="-100" r="70" strokeWidth="8" />
      )}
    </svg>
  )
}
