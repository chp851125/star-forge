import { useState } from 'react'
import { MAX_STARS, STAR_ODDS, zoneOf } from '../../config/balance'
import { ZONE_TEXT } from '../tierStyle'

/** 15 格星級條:hover / 點按顯示該級成功率 */
export default function StarBar({ stars }: { stars: number }) {
  const [sel, setSel] = useState<number | null>(null)
  const label = (i: number) => `+${i} → +${i + 1} 成功率 ${STAR_ODDS[i].success}%`

  return (
    <div onMouseLeave={() => setSel(null)}>
      <div className="grid grid-cols-5 gap-x-1 md:grid-cols-[repeat(15,minmax(0,1fr))] md:gap-x-0.5">
        {Array.from({ length: MAX_STARS }, (_, i) => (
          <button
            key={i}
            type="button"
            className="flex min-h-[44px] items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
            aria-label={label(i)}
            onMouseEnter={() => setSel(i)}
            onFocus={() => setSel(i)}
            onBlur={() => setSel(null)}
            onClick={() => setSel(i)}
          >
            <span
              className={`block h-3.5 w-full max-w-[20px] border ${i < stars ? 'border-cyan bg-cyan shadow-glow' : 'border-muted/60 bg-bg'} ${sel === i ? 'outline outline-2 outline-ink' : ''}`}
            />
          </button>
        ))}
      </div>
      <div className={`min-h-[20px] text-center text-sm ${sel === null ? 'text-muted' : ZONE_TEXT[zoneOf(sel)]}`} aria-live="polite">
        {sel === null ? '點按星格查看成功率' : label(sel)}
      </div>
    </div>
  )
}
