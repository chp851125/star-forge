import { BLADES } from './shapes'

const w = (n: string) => `var(--w-${n})`
const AURA = 'var(--aura)'

type Stop = [offset: number, color: string, opacity?: number]
const stops = (list: Stop[]) =>
  list.map(([o, c, a = 1], i) => <stop key={i} offset={o} style={{ stopColor: c, stopOpacity: a }} />)

/** 水平漸層、中線硬切:左亮右暗稜面 */
const bevel = (name: string): Stop[] => [[0, w(`${name}1`)], [0.5, w(`${name}2`)], [0.5, w(`${name}3`)], [1, w(`${name}4`)]]
const vertical = (a: string, b: string): Stop[] => [[0, w(a)], [1, w(b)]]

const HORIZONTAL: [string, Stop[]][] = [
  ['iron', bevel('iron')], ['steel', bevel('steel')], ['frost', bevel('frost')], ['shade', bevel('shade')], ['light', bevel('light')],
]
const VERTICAL: [string, Stop[]][] = [
  ['gold', vertical('gold1', 'gold2')], ['guard', vertical('guard1', 'guard2')],
  ['plum', vertical('plum1', 'plum2')], ['grip', vertical('grip1', 'grip2')],
  ['shine', [[0, w('frostwhite'), 0], [0.5, w('frostwhite'), 0.95], [1, w('frostwhite'), 0]]],
]
const RADIAL: [string, Stop[]][] = [
  ['aura', [[0, AURA, 0.55], [1, AURA, 0]]],
  ['violet', [[0, w('violet'), 0.55], [1, w('violet'), 0]]],
  ['white', [[0, w('frostwhite'), 0.75], [0.4, AURA, 0.3], [1, AURA, 0]]],
]

/** 漸層、濾鏡、裁切;id 以 p 為前綴避免多實例衝突 */
export default function Defs({ p }: { p: string }) {
  return (
    <defs>
      {HORIZONTAL.map(([id, s]) => <linearGradient key={id} id={p + id}>{stops(s)}</linearGradient>)}
      {VERTICAL.map(([id, s]) => <linearGradient key={id} id={p + id} x1="0" y1="0" x2="0" y2="1">{stops(s)}</linearGradient>)}
      <linearGradient id={`${p}flame`} x1="0" y1="1" x2="0" y2="0">{stops([[0, AURA, 0.9], [1, w('violet'), 0]])}</linearGradient>
      {RADIAL.map(([id, s]) => <radialGradient key={id} id={p + id}>{stops(s)}</radialGradient>)}
      {/* userSpaceOnUse:垂直線的 bbox 寬度為 0,用預設值濾鏡後會消失 */}
      {([['glow1', 2.5], ['glow2', 6]] as const).map(([id, dev]) => (
        <filter key={id} id={p + id} filterUnits="userSpaceOnUse" x="-100" y="-325" width="200" height="450">
          <feGaussianBlur stdDeviation={dev} result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      ))}
      {BLADES.map((b, i) => <clipPath key={i} id={`${p}blade${i}`}><path d={b.d} /></clipPath>)}
      <linearGradient id={`${p}fade`} gradientUnits="userSpaceOnUse" x1="0" y1="86" x2="0" y2="132">
        <stop offset="0" stopColor="white" stopOpacity=".5" />
        <stop offset="1" stopColor="white" stopOpacity="0" />
      </linearGradient>
      <mask id={`${p}reflect`} maskUnits="userSpaceOnUse" x="-90" y="86" width="180" height="50">
        <rect x="-90" y="86" width="180" height="50" fill={`url(#${p}fade)`} />
      </mask>
    </defs>
  )
}
