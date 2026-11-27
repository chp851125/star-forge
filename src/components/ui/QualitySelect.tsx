import type { FxQuality } from '../../types'
import { useQuality } from '../Sword/quality'

const QUALITIES: [FxQuality, string][] = [['high', '高'], ['medium', '中'], ['low', '低'], ['off', '關']]

export default function QualitySelect() {
  const { chosen, reduced, setQuality } = useQuality()
  return (
    <label className="flex flex-wrap items-center gap-3 px-3 text-sm">
      特效品質
      <select
        value={chosen}
        onChange={(e) => setQuality(e.target.value as FxQuality)}
        className="h-11 border border-cyan/50 bg-bg px-2 text-ink"
      >
        {QUALITIES.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
      </select>
      {reduced && <span className="text-muted">系統已開啟「減少動態」,套用「關」</span>}
    </label>
  )
}
