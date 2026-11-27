import { ENHANCE_TABLE, MAX_STAR, PITY, PROTECTION, ZONE_LABEL } from '../../config/balance'
import { WEAPON_STYLE, stageOf } from '../../config/weapons'
import { canProtect, getEffectiveRates, getEnhanceCost, getEnhanceStep, getZone, isPityReady } from '../../core/enhance'
import type { EnhanceOutcome, ZoneKind } from '../../types'
import { ZONE_BORDER, ZONE_TEXT } from '../tierStyle'
import StarTable from './StarTable'
import AutoStarPanel, { type AutoStarProps } from '../auto/AutoStarPanel'

interface Props {
  stars: number
  /** 動畫播放、自動進行中等暫時不可操作 */
  disabled: boolean
  /** 次數制次數用完 */
  noTurns: boolean
  /** 升星石庫存;null = 無限 */
  stones: number | null
  consecutiveDrops: number
  protect: boolean
  onProtect: (v: boolean) => void
  onStar: () => void
  /** 自動功能關閉時不傳 */
  auto?: AutoStarProps
}

const OUTCOMES: [EnhanceOutcome, string, string, string][] = [
  ['success', '成功', 'text-zone-safe', 'bg-zone-safe'],
  ['keep', '維持', 'text-ink', 'bg-muted'],
  ['drop', '掉星', 'text-zone-drop', 'bg-zone-drop'],
  ['reset', '歸零', 'text-zone-reset', 'bg-zone-reset'],
]

const ZONES: [ZoneKind, string][] = [['safe', '安全'], ['drop', '掉星'], ['reset', '歸零']]

/** 由設定表推出各區的星級範圍 */
function zoneRange(z: ZoneKind): string {
  const list = ENHANCE_TABLE.map((_, i) => i).filter((i) => getZone(i) === z)
  return list.length ? `+${list[0]}~${list[list.length - 1]}` : '無'
}

export default function StarPanel(props: Props) {
  const { stars, protect, stones, auto } = props
  const step = getEnhanceStep(stars)
  const rates = getEffectiveRates(stars, protect)
  const guarded = protect && canProtect(stars)
  const zone = getZone(stars)
  const cost = getEnhanceCost(stars, protect)
  const short = cost !== null && stones !== null && stones < cost
  const pity = isPityReady(props.consecutiveDrops)

  // 自動升星設定中:目標路上會遇到歸零星級時,也要能先設定護鑄
  const autoNeedsProtect = !!auto && !auto.session && Array.from({ length: auto.target }, (_, i) => i).some(canProtect)
  const showProtect = canProtect(stars) || autoNeedsProtect || (!!auto?.session?.active && auto.session.protect)
  const protectedCost = getEnhanceCost(stars, true)
  // 已勾選時保持可取消,避免卡在買不起的狀態
  const cantAfford = canProtect(stars) && !protect && stones !== null && stones < protectedCost!

  const label = !step ? '已達上限' : props.noTurns ? '操作次數已用完' : short ? '升星石不足' : '衝星'

  return (
    <div className="space-y-2">
      <div className="text-center">
        <div className={`text-3xl font-extrabold sm:text-4xl ${step ? ZONE_TEXT[zone] : 'text-ink'}`}>
          {step ? `升星成功率 ${step.rates.success}%` : '已達上限'}
        </div>
        <div className="text-sm text-muted">
          目前 +{stars} / +{MAX_STAR} · {WEAPON_STYLE.stages[stageOf(stars)].name}
        </div>
      </div>

      {step && rates && (
        <>
          <div className="flex h-3 overflow-hidden border border-cyan/30 bg-bg" aria-hidden>
            {OUTCOMES.map(([key, , , bar]) => (
              <span key={key} className={bar} style={{ width: `${rates[key]}%` }} />
            ))}
          </div>
          <dl className="grid grid-cols-4 gap-2" aria-label="本次結果機率">
            {OUTCOMES.map(([key, name, color]) => (
              <div key={key} className={`border border-cyan/20 bg-bg/50 py-0.5 text-center ${rates[key] ? color : 'text-muted'}`}>
                <dt className="text-xs">{name}</dt>
                <dd className="text-lg font-bold leading-6">{rates[key]}%</dd>
              </div>
            ))}
          </dl>
          <div className={`border px-3 py-1 text-sm font-semibold ${ZONE_BORDER[zone]} ${ZONE_TEXT[zone]}`}>
            {guarded ? `${PROTECTION.name}生效:不會歸零,仍可能掉星` : ZONE_LABEL[zone]}
            {rates.reset > 0 && <span className="font-normal"> · 歸零不影響詞條</span>}
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

      {PITY.enabled && step && (
        <div
          className={`border px-3 py-1 text-center text-sm ${pity ? 'border-tier-gold bg-tier-gold/15 text-base font-extrabold text-tier-gold shadow-glow' : 'border-cyan/20 text-muted'}`}
          aria-live="polite"
        >
          {pity ? '下次必定成功' : `連續掉星 ${props.consecutiveDrops}/${PITY.consecutiveDropsNeeded}`}
        </div>
      )}

      {showProtect && (
        <label className={`flex min-h-[44px] items-center gap-3 border border-cyan/30 px-3 text-sm ${cantAfford ? 'opacity-50' : 'cursor-pointer'}`}>
          <input
            type="checkbox" className="h-5 w-5 shrink-0 accent-cyan"
            checked={protect}
            disabled={cantAfford || !!auto?.session?.active}
            onChange={(e) => props.onProtect(e.target.checked)}
          />
          <span>
            <span className="font-semibold text-cyan">{PROTECTION.name}</span>
            <span className="text-muted"> · 歸零改為維持(不防掉星),僅歸零區生效,消耗 ×{PROTECTION.costMultiplier}</span>
          </span>
        </label>
      )}

      {cost !== null && <div className="text-sm text-muted">消耗:升星石 ×{cost}</div>}
      <button className="btn-primary min-h-[52px] w-full text-lg" disabled={props.disabled || props.noTurns || short || !step} data-sound="none" onClick={props.onStar}>
        {label}
      </button>
      {auto && <AutoStarPanel stars={stars} {...auto} />}
      <StarTable stars={stars} />
    </div>
  )
}
