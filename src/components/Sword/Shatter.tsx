import type { CSSProperties } from 'react'
import type { StageProps } from './effects'
import { STAGES } from './stages'

/** 6 塊碎片:裁切多邊形、飛散位移與旋轉、旋轉中心 */
const PIECES = [
  { points: '-90,-315 90,-315 90,-170 -90,-195', dx: -18, dy: -46, rot: -28, cx: 0, cy: -215 },
  { points: '-90,-195 90,-170 90,-105 -90,-85', dx: 42, dy: -12, rot: 24, cx: 0, cy: -140 },
  { points: '-90,-85 4,-95 -6,-20 -90,-10', dx: -48, dy: 6, rot: -36, cx: -12, cy: -55 },
  { points: '4,-95 90,-105 90,-35 -6,-20', dx: 46, dy: 18, rot: 32, cx: 12, cy: -60 },
  { points: '-90,-10 -6,-20 8,115 -90,115', dx: -34, dy: 48, rot: 22, cx: -10, cy: 25 },
  { points: '-6,-20 90,-35 90,115 8,115', dx: 30, dy: 56, rot: -26, cx: 12, cy: 20 },
]

export default function Shatter({ stage, ...props }: StageProps & { stage: number }) {
  const Art = STAGES[stage]
  return (
    <>
      {PIECES.map((s, i) => (
        <g
          key={i}
          className="w-piece"
          style={{ '--dx': `${s.dx}px`, '--dy': `${s.dy}px`, '--rot': `${s.rot}deg`, transformOrigin: `${s.cx}px ${s.cy}px` } as CSSProperties}
        >
          <clipPath id={`${props.p}piece${i}`}><polygon points={s.points} /></clipPath>
          <g clipPath={`url(#${props.p}piece${i})`}><Art {...props} solid /></g>
        </g>
      ))}
    </>
  )
}
