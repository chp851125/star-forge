import { Aura, Crystals, Shine, Sparkles, stageKit, type StageProps } from '../effects'
import { BLADES } from '../shapes'

const RAY_ANGLES = [0, 40, 80, -40, -80, 180]
const CRACK = 'M-8-60L5-92L-6-124L7-156L-2-190L0-230'

/** +15 傳說終焉 */
export default function Stage6(props: StageProps) {
  const { url, glow } = stageKit(props)
  const blade = BLADES[5].d
  return (
    <>
      <Aura {...props} cy={-130} r={158} fill="white" />
      <Aura {...props} cy={-80} r={110} fill="violet" delay={-1.5} />
      {!props.solid && (
        <>
          <g opacity=".16" fill="var(--aura)">
            <g className={props.quality === 'low' ? undefined : 'w-rays'}>
              {RAY_ANGLES.map((a) => <path key={a} d="M0-100L-7-340H7Z" transform={`rotate(${a} 0 -100)`} />)}
            </g>
          </g>
          <circle cy="-60" r="56" fill="none" stroke="var(--aura)" strokeOpacity=".8" strokeWidth="2" filter={glow(4)} />
          <circle cy="-60" r="66" fill="none" stroke="var(--w-violet)" strokeOpacity=".6" strokeWidth="1.5" />
          <path d={blade} fill="var(--w-halo)" stroke="var(--aura)" strokeWidth="3" filter={glow(0, true)} />
        </>
      )}
      <g stroke="var(--w-outline)" strokeWidth="2" strokeLinejoin="round">
        <path d={blade} fill={url('light')} />
        <path d="M-64 14L-48-28L-30-12L-14-21H14L30-12L48-28L64 14L38 6L22 30H-22L-38 6Z" fill={url('gold')} />
        <rect x="-6" y="14" width="12" height="50" rx="3" fill="var(--w-grip6)" />
        <circle cy="71" r="9" fill={url('gold')} />
      </g>
      <path d="M0-236V-26" stroke="var(--w-white)" strokeWidth="5" opacity=".85" filter={glow(1, true)} />
      {/* 裂縫光 */}
      <path d={CRACK} fill="none" stroke="var(--w-white)" strokeWidth="3" filter={glow(5)} />
      <path d={CRACK} fill="none" stroke="var(--aura)" strokeWidth="1.2" />
      <circle cy="-4" r="9" className="fill-tier-red" filter={glow(2, true)} />
      <Shine {...props} stage={5} />
      {/* 水晶整組算一個發光元素 */}
      <g filter={glow(3)}>
        <Crystals {...props} fill="shade" stroke="var(--w-frostwhite)" at={[[-56, -210, 1.1], [58, -170, 0.95], [-56, -110, 0.95], [56, -80, 0.85]]} />
      </g>
      <Sparkles {...props} at={[[-30, -260, 1], [36, -240, 0.9], [-44, -140, 0.75], [46, -30, 0.75]]} />
    </>
  )
}
