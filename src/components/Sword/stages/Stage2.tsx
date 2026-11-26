import { stageKit, type StageProps } from '../effects'
import { BLADES } from '../shapes'

/** +3~5 精鋼劍 */
export default function Stage2(props: StageProps) {
  const { url } = stageKit(props)
  return (
    <>
      <g stroke="var(--w-outline)" strokeWidth="2" strokeLinejoin="round">
        <path d={BLADES[1].d} fill={url('steel')} />
        <rect x="-30" y="-8" width="60" height="12" rx="3" fill={url('guard')} />
        <rect x="-5" y="4" width="10" height="46" rx="3" fill={url('grip')} />
        <circle cy="57" r="8" fill={url('guard')} />
      </g>
      <path d="M-10-10L-12-152L0-180L12-152L10-10" fill="none" stroke="var(--w-ice)" strokeOpacity=".8" strokeWidth="1.5" />
      <path d="M0-170V-20" stroke="var(--w-white)" strokeOpacity=".6" strokeWidth="1.5" />
    </>
  )
}
