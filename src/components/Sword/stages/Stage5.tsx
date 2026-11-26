import { Aura, Crystals, Shine, Sparkles, stageKit, type StageProps } from '../effects'
import { BLADES } from '../shapes'

const FLAME = 'M-24-130C-40-150-30-176-42-206C-22-192-12-164-18-130Z'

/** +12~14 星熾巨劍 */
export default function Stage5(props: StageProps) {
  const { url, glow } = stageKit(props)
  return (
    <>
      <Aura {...props} cy={-120} r={122} fill="violet" />
      <Aura {...props} cy={-120} r={84} fill="aura" delay={-1.5} />
      {!props.solid && (
        <g fill={url('flame')} opacity=".85">
          <path d={FLAME} />
          <path d={FLAME} transform="scale(-1,1)" />
        </g>
      )}
      <g stroke="var(--w-outline)" strokeWidth="2" strokeLinejoin="round">
        <path d={BLADES[4].d} fill={url('shade')} />
        <path d="M-58 12L-38-14L-14-19H14L38-14L58 12L34 5L20 26H-20L-34 5Z" fill={url('plum')} />
        <rect x="-6" y="12" width="12" height="48" rx="3" fill={url('grip')} />
        <circle cy="67" r="9" fill={url('plum')} />
      </g>
      <path d="M-20-10L-24-172L0-218L24-172L20-10" fill="none" stroke="var(--aura)" strokeWidth="2.5" filter={glow(0)} />
      <path d="M0-208V-26" stroke="var(--aura)" strokeWidth="10" filter={glow(1, true)} />
      <path d="M0-208V-26" stroke="var(--w-white)" strokeWidth="3.5" />
      <circle cy="-4" r="8" fill="var(--w-frostwhite)" filter={glow(2, true)} />
      <Shine {...props} stage={4} />
      <Crystals {...props} fill="shade" stroke="var(--aura)" at={[[-52, -190, 1], [54, -150, 0.9], [-50, -90, 0.85], [52, -60, 0.75]]} />
      <Sparkles {...props} at={[[-30, -228, 0.9], [34, -210, 0.75]]} />
    </>
  )
}
