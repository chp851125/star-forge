import { useState } from 'react'
import type { Tier, WeaponEvent } from '../../types'
import { MAX_STAR } from '../../config/balance'
import { play } from '../../audio/engine'
import { SOUND_IDS } from '../../audio/sounds'

interface Props {
  stars: number
  disabled: boolean
  onSetStars: (n: number) => void
  onFx: (k: WeaponEvent['kind']) => void
  /** undefined = 跟隨詞條,null = 青 */
  auraPreview: Tier | null | undefined
  onAuraPreview: (t: Tier | null | undefined) => void
}

const BTNS: [WeaponEvent['kind'], string][] = [
  ['success', '升星成功'],
  ['evolve', '跨階段'],
  ['drop', '掉星'],
  ['reset', '歸零'],
  ['red', '洗出紅詞條'],
]

const AURAS: [Tier | null | undefined, string, string][] = [
  [undefined, '自動', 'text-ink'],
  ['blue', '藍', 'text-tier-blue'],
  ['purple', '紫', 'text-tier-purple'],
  ['gold', '金', 'text-tier-gold'],
  ['red', '紅', 'text-tier-red'],
  [null, '青', 'text-cyan'],
]

export default function DevPanel({ stars, disabled, onSetStars, onFx, auraPreview, onAuraPreview }: Props) {
  const [open, setOpen] = useState(false)
  return (
    <section className="space-y-2 border-2 border-dashed border-tier-gold/70 bg-tier-gold/5 px-3 py-1">
      <h3>
        <button
          className="flex min-h-[44px] w-full items-center justify-between font-bold text-tier-gold"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span>⚠ 開發測試面板</span>
          <span>{open ? '▲' : '▼'}</span>
        </button>
      </h3>
      {open && (
      <>
      <label className="flex items-center gap-3 text-sm">
        星級 +{stars}
        <input
          type="range" min={0} max={MAX_STAR} value={stars} disabled={disabled}
          onChange={(e) => onSetStars(Number(e.target.value))}
          className="h-11 flex-1 accent-cyan"
          aria-label="設定星級"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        {BTNS.map(([k, label]) => (
          <button key={k} className="btn" disabled={disabled} onClick={() => onFx(k)}>{label}</button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm" role="group" aria-label="階級色預覽">
        階級色
        {AURAS.map(([v, label, color]) => (
          <button
            key={label}
            className={`min-h-[44px] min-w-[44px] border px-2 font-semibold ${color} ${auraPreview === v ? 'border-current bg-ink/10' : 'border-muted/40'}`}
            aria-pressed={auraPreview === v}
            onClick={() => onAuraPreview(v)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm" role="group" aria-label="音效試聽">
        音效試聽
        {SOUND_IDS.map((id) => (
          <button key={id} className="btn px-2" data-sound="none" onClick={() => play(id)}>{id}</button>
        ))}
      </div>
      </>
      )}
    </section>
  )
}
