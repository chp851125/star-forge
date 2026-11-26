import type { CSSProperties } from 'react'
import type { FxQuality } from '../../types'
import { BLADES, CRYSTAL, STAR } from './shapes'

export interface StageProps {
  /** Defs id 前綴 */
  p: string
  quality: FxQuality
  /** 只畫實體(倒影、碎片、淡出用):無光環、粒子、濾鏡、光帶 */
  solid?: boolean
}

export function stageKit({ p, quality, solid }: StageProps) {
  return {
    url: (id: string) => `url(#${p}${id})`,
    /** 高:全開;中:只保留 rank 0~3(最多 4 個發光元素);低:不用濾鏡 */
    glow: (rank: number, strong = false) =>
      !solid && quality !== 'low' && (quality !== 'medium' || rank < 4)
        ? `url(#${p}${strong ? 'glow2' : 'glow1'})`
        : undefined,
  }
}

/** 刃身光帶:以刃形裁切,沿劍身上滑 */
export function Shine({ stage, p, quality, solid }: StageProps & { stage: number }) {
  if (solid || quality === 'off') return null
  const { length, halfWidth } = BLADES[stage]
  const h = Math.round(length * 0.4)
  return (
    <g clipPath={`url(#${p}blade${stage})`}>
      <rect
        className="w-shine"
        x={-halfWidth} y={0} width={halfWidth * 2} height={h}
        fill={`url(#${p}shine)`}
        style={{ '--shine-to': `${-(length + h)}px` } as CSSProperties}
      />
    </g>
  )
}

/** 光環圓:opacity 與縮放呼吸 */
export function Aura({ p, solid, cy, r, fill, delay = 0 }: StageProps & { cy: number; r: number; fill: string; delay?: number }) {
  if (solid) return null
  return <circle className="w-breathe" cy={cy} r={r} fill={`url(#${p}${fill})`} style={{ animationDelay: `${delay}s` }} />
}

const count = (n: number, q: FxQuality) => (q === 'medium' || q === 'low' ? Math.ceil(n / 2) : n)

/** [x, y, 縮放] */
type Spot = [number, number, number]

export function Crystals({ p, quality, solid, at, fill, stroke }: StageProps & { at: Spot[]; fill: string; stroke: string }) {
  if (solid) return null
  const still = quality === 'low'
  return (
    <>
      {at.slice(0, count(at.length, quality)).map(([x, y, scale], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${scale})`}>
          <g className={still ? undefined : 'w-bob'} style={{ animationDelay: `${i * 0.7}s` }}>
            {!still && <path d={CRYSTAL} fill="none" stroke={stroke} strokeWidth="5" opacity=".25" />}
            <path d={CRYSTAL} fill={`url(#${p}${fill})`} stroke={stroke} strokeWidth="1.5" />
          </g>
        </g>
      ))}
    </>
  )
}

export function Sparkles({ quality, solid, at }: StageProps & { at: Spot[] }) {
  if (solid || quality === 'low') return null
  return (
    <g fill="var(--w-frostwhite)">
      {at.slice(0, count(at.length, quality)).map(([x, y, scale], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${scale})`}>
          <path className="w-twinkle" d={STAR} style={{ animationDelay: `${i * 0.6}s` }} />
        </g>
      ))}
    </g>
  )
}
