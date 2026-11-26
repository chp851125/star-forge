import { useState } from 'react'
import { STAR_ODDS, zoneOf } from '../../config/balance'
import { ZONE_BG, ZONE_TEXT } from '../tierStyle'

const ZONE_SHORT = { safe: '安全', drop: '掉星', reset: '歸零' }

/** 可展開的全星級成功率一覽 */
export default function StarTable({ stars }: { stars: number }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button className="btn w-full" aria-expanded={open} onClick={() => setOpen(!open)}>
        全星級成功率一覽 {open ? '▲' : '▼'}
      </button>
      {open && (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-center text-sm">
            <thead className="text-muted">
              <tr>
                {['星級', '區域', '成功', '維持', '掉星', '歸零'].map((h) => <th key={h} className="px-1 py-1 font-normal">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {STAR_ODDS.map((o, i) => {
                const z = zoneOf(i)
                return (
                  <tr key={i} className={`${ZONE_BG[z]} ${i === stars ? 'font-bold outline outline-1 outline-ink' : ''}`} aria-current={i === stars || undefined}>
                    <th scope="row" className="whitespace-nowrap px-1 py-1 text-ink">+{i}→+{i + 1}</th>
                    <td className={ZONE_TEXT[z]}>{ZONE_SHORT[z]}</td>
                    <td className={ZONE_TEXT[z]}>{o.success}%</td>
                    <td>{o.keep}%</td>
                    <td>{o.drop}%</td>
                    <td>{o.reset}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
