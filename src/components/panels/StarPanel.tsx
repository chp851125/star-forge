import { MAX_STARS, STAR_COST, STAR_ODDS, ZONE_LABEL, zoneOf } from '../../config/balance'
import { WEAPON_STYLE, stageOf } from '../../config/weapons'
import type { StarOdds, ZoneKind } from '../../types'
import { ZONE_BORDER, ZONE_TEXT } from '../tierStyle'
import StarTable from './StarTable'

interface Props {
  stars: number
  disabled: boolean
  onStar: () => void
}

const OUTCOMES: [keyof StarOdds, string, string, string][] = [
  ['success', '成功', 'text-zone-safe', 'bg-zone-safe'],
  ['keep', '維持', 'text-ink', 'bg-muted'],
  ['drop', '掉星', 'text-zone-drop', 'bg-zone-drop'],
  ['reset', '歸零', 'text-zone-reset', 'bg-zone-reset'],
]

const ZONES: [ZoneKind, string][] = [['safe', '安全'], ['drop', '掉星'], ['reset', '歸零']]

/** 由 zoneOf 推出各區的星級範圍 */
function zoneRange(z: ZoneKind): string {
  const list = STAR_ODDS.map((_, i) => i).filter((i) => zoneOf(i) === z)
  return `+${list[0]}~${list[list.length - 1]}`
}

export default function StarPanel({ stars, disabled, onStar }: Props) {
  const maxed = stars >= MAX_STARS
  const zone = zoneOf(stars)
  const odds = maxed ? null : STAR_ODDS[stars]

  return (
    <div className="space-y-2">
      <div className="text-center">
        <div className={`text-3xl font-extrabold sm:text-4xl ${odds ? ZONE_TEXT[zone] : 'text-ink'}`}>
          {odds ? `升星成功率 ${odds.success}%` : '已達最高星級'}
        </div>
        <div className="text-sm text-muted">
          目前 +{stars} / +{MAX_STARS} · {WEAPON_STYLE.stages[stageOf(stars)].name}
        </div>
      </div>

      {odds && (
        <>
          <div className="flex h-3 overflow-hidden border border-cyan/30 bg-bg" aria-hidden>
            {OUTCOMES.map(([key, , , bar]) => (
              <span key={key} className={bar} style={{ width: `${odds[key]}%` }} />
            ))}
          </div>
          <dl className="grid grid-cols-4 gap-2" aria-label="本次結果機率">
            {OUTCOMES.map(([key, label, color]) => (
              <div key={key} className={`border border-cyan/20 bg-bg/50 py-0.5 text-center ${odds[key] ? color : 'text-muted'}`}>
                <dt className="text-xs">{label}</dt>
                <dd className="text-lg font-bold leading-6">{odds[key]}%</dd>
              </div>
            ))}
          </dl>
          <div className={`border px-3 py-1 text-sm font-semibold ${ZONE_BORDER[zone]} ${ZONE_TEXT[zone]}`}>
            {ZONE_LABEL[zone]}
            {odds.reset > 0 && <span className="font-normal"> · 歸零不影響詞條</span>}
          </div>
        </>
      )}

      <div className="flex gap-2 text-xs" aria-label="區間圖例">
        {ZONES.map(([z, name]) => (
          <span key={z} className={`flex-1 border px-2 py-0.5 text-center ${ZONE_BORDER[z]} ${ZONE_TEXT[z]}`}>
            {name} {zoneRange(z)}
          </span>
        ))}
      </div>

      <div className="text-sm text-muted">消耗:升星石 ×{STAR_COST}</div>
      <button className="btn-primary min-h-[52px] w-full text-lg" disabled={disabled || maxed} onClick={onStar}>
        {maxed ? '已達最高星級' : '衝星'}
      </button>
      <StarTable stars={stars} />
    </div>
  )
}
