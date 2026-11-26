import { stageKit, type StageProps } from '../effects'
import { BLADES } from '../shapes'

/** +0~2 鏽鐵劍 */
export default function Stage1(props: StageProps) {
  const { url } = stageKit(props)
  return (
    <>
      <g stroke="var(--w-outline)" strokeWidth="2" strokeLinejoin="round">
        <path d={BLADES[0].d} fill={url('iron')} />
        <rect x="-24" y="-8" width="48" height="10" rx="3" fill={url('guard')} />
        <rect x="-5" y="2" width="10" height="46" rx="3" fill={url('grip')} />
        <circle cy="55" r="8" fill={url('guard')} />
      </g>
      <path d="M0-165V-20" stroke="var(--w-ironline)" strokeOpacity=".45" strokeWidth="1.5" />
    </>
  )
}
