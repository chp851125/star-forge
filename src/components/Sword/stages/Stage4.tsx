import { Aura, Shine, stageKit, type StageProps } from '../effects'
import { BLADES } from '../shapes'

/** +9~11 暗影劍 */
export default function Stage4(props: StageProps) {
  const { url, glow } = stageKit(props)
  return (
    <>
      <Aura {...props} cy={-110} r={96} fill="violet" />
      <Aura {...props} cy={-110} r={68} fill="aura" delay={-1.5} />
      <g stroke="var(--w-outline)" strokeWidth="2" strokeLinejoin="round">
        <path d={BLADES[3].d} fill={url('shade')} />
        <path d="M-46 10L-30-10L-12-15H12L30-10L46 10L28 4L16 17H-16L-28 4Z" fill={url('plum')} />
        <rect x="-5" y="8" width="10" height="46" rx="3" fill={url('grip')} />
        <circle cy="61" r="8" fill={url('plum')} />
      </g>
      <path
        d="M-11-10L-16-82L-11-102L-17-122L-12-142L-16-162L0-194L16-162L12-142L17-122L11-102L16-82L11-10"
        fill="none" stroke="var(--aura)" strokeWidth="2" filter={glow(0)}
      />
      <path d="M0-186V-24" stroke="var(--aura)" strokeWidth="5" filter={glow(1)} />
      <path d="M0-186V-24" stroke="var(--w-white)" strokeWidth="1.5" />
      <circle cy="-4" r="6" fill="var(--aura)" filter={glow(2)} />
      <Shine {...props} stage={3} />
    </>
  )
}
