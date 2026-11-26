import { Aura, Shine, stageKit, type StageProps } from '../effects'
import { BLADES } from '../shapes'

/** +6~8 冰紋劍 */
export default function Stage3(props: StageProps) {
  const { url, glow } = stageKit(props)
  return (
    <>
      <Aura {...props} cy={-100} r={78} fill="aura" />
      <g stroke="var(--w-outline)" strokeWidth="2" strokeLinejoin="round">
        <path d={BLADES[2].d} fill={url('frost')} />
        <path d="M-34-4L-12-13H12L34-4L26 6H-26Z" fill={url('guard')} />
        <rect x="-5" y="6" width="10" height="46" rx="3" fill={url('grip')} />
        <circle cy="59" r="8" fill={url('guard')} />
      </g>
      <path d="M-11-10L-13-156L0-186L13-156L11-10" fill="none" stroke="var(--aura)" strokeWidth="2" filter={glow(0)} />
      <g fill="var(--aura)" filter={glow(1)}>
        <path d="M0-135l5 9-5 9-5-9z" />
        <path d="M0-100l5 9-5 9-5-9z" />
        <path d="M0-65l5 9-5 9-5-9z" />
      </g>
      <circle cy="-3" r="5" fill="var(--aura)" filter={glow(2)} />
      <Shine {...props} stage={2} />
    </>
  )
}
