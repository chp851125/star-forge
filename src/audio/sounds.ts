// 合成音效配方:忠實移植自 docs/reference/sound-recipes.js,音色與參數已定案。
import type { SoundId } from '../types'

export interface Synth {
  ctx: BaseAudioContext
  /** 輸出節點 */
  out: AudioNode
  /** 2 秒白噪音 */
  noise: AudioBuffer
  /** 本次音效最晚的停止時間(由配方寫入,供引擎計算發聲數) */
  end: number
}

function env(g: GainNode, t: number, v: number, d: number) {
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(v, t + .005)
  g.gain.exponentialRampToValueAtTime(0.0001, t + d)
}

function tone(s: Synth, f: number, ty: OscillatorType, t: number, d: number, v: number, f2?: number) {
  const o = s.ctx.createOscillator()
  const g = s.ctx.createGain()
  o.type = ty
  o.frequency.setValueAtTime(f, t)
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d)
  env(g, t, v, d)
  o.connect(g)
  g.connect(s.out)
  o.start(t)
  o.stop(t + d + .05)
  s.end = Math.max(s.end, t + d + .05)
}

function nz(
  s: Synth, t: number, d: number, v: number, ty: BiquadFilterType, f: number, f2?: number, q?: number,
) {
  const src = s.ctx.createBufferSource()
  src.buffer = s.noise
  const fl = s.ctx.createBiquadFilter()
  fl.type = ty
  fl.frequency.setValueAtTime(f, t)
  if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + d)
  fl.Q.value = q || 1
  const g = s.ctx.createGain()
  env(g, t, v, d)
  src.connect(fl)
  fl.connect(g)
  g.connect(s.out)
  src.start(t, Math.random())
  src.stop(t + d + .05)
  s.end = Math.max(s.end, t + d + .05)
}

function bell(s: Synth, f: number, t: number, d: number, v: number) {
  [1, 2.76, 5.4, 8.93].forEach((m, i) => tone(s, f * m, 'sine', t, d / (1 + i * .8), v / (1 + i * 1.2)))
}

type Recipe = (s: Synth, t: number) => void

export const SOUNDS: Record<SoundId, Recipe> = {
  hammer(s, t) {
    nz(s, t, .07, .9, 'highpass', 1800)
    bell(s, 380, t, .45, .5)
    tone(s, 110, 'sine', t, .25, .9, 45)
  },
  success(s, t) {
    [660, 880, 1320].forEach((f, i) => bell(s, f, t + i * .07, .5, .35))
    nz(s, t + .15, .25, .25, 'highpass', 6000)
  },
  evolve(s, t) {
    nz(s, t, .7, .5, 'bandpass', 300, 4000, 2)
    tone(s, 220, 'sawtooth', t, .7, .25, 880)
    const e = t + .7
    tone(s, 60, 'sine', e, .6, 1, 30)
    nz(s, e, .25, .6, 'highpass', 2500);
    [523, 659, 784, 1047].forEach((f) => bell(s, f, e, .9, .3))
  },
  keep(s, t) {
    bell(s, 200, t, .2, .35)
    tone(s, 90, 'sine', t, .15, .5, 60)
  },
  drop(s, t) {
    tone(s, 440, 'sawtooth', t, .4, .3, 90)
    nz(s, t, .35, .35, 'bandpass', 2500, 300, 3)
    tone(s, 80, 'sine', t + .1, .3, .7, 40)
  },
  reset(s, t) {
    nz(s, t, .7, .9, 'lowpass', 6000, 300)
    for (let i = 0; i < 14; i++) bell(s, 2000 + Math.random() * 4000, t + Math.random() * .4, .2, .18)
    tone(s, 70, 'sine', t, .9, 1, 28);
    [0, .28].forEach((d) => tone(s, 880, 'square', t + .5 + d, .18, .15))
  },
  pity(s, t) {
    bell(s, 880, t, .8, .4)
    bell(s, 1320, t + .1, .8, .3)
    nz(s, t, .5, .2, 'highpass', 7000)
  },
  roll(s, t) {
    nz(s, t, .28, .3, 'bandpass', 900, 3200, 4);
    [0, .07, .14].forEach((d) => tone(s, 900 + Math.random() * 900, 'sine', t + d, .08, .2))
  },
  blue(s, t) {
    bell(s, 660, t, .35, .35)
  },
  purple(s, t) {
    bell(s, 784, t, .4, .35)
    bell(s, 988, t + .09, .5, .35)
  },
  gold(s, t) {
    [784, 988, 1175, 1568].forEach((f, i) => bell(s, f, t + i * .08, .6, .33))
    nz(s, t + .3, .3, .2, 'highpass', 6000)
  },
  red(s, t) {
    tone(s, 55, 'sine', t, 1.2, 1, 30);
    [523, 659, 784, 1047, 1568].forEach((f, i) => bell(s, f, t + i * .09, 1.2, .35))
    nz(s, t, 1, .3, 'highpass', 3000, 9000)
  },
  lock(s, t) {
    nz(s, t, .03, .8, 'highpass', 2500)
    tone(s, 1200, 'square', t, .05, .15)
    tone(s, 700, 'square', t + .04, .07, .15)
  },
  unlock(s, t) {
    nz(s, t, .03, .6, 'highpass', 2000)
    tone(s, 600, 'square', t, .05, .12)
    tone(s, 1000, 'square', t + .04, .07, .12)
  },
  click(s, t) {
    tone(s, 1400, 'sine', t, .04, .25)
  },
  confirm(s, t) {
    tone(s, 660, 'sine', t, .08, .3)
    tone(s, 990, 'sine', t + .07, .12, .3)
  },
  error(s, t) {
    tone(s, 140, 'sawtooth', t, .15, .25)
  },
  stamp(s, t) {
    tone(s, 120, 'sine', t, .4, 1, 45)
    nz(s, t, .1, .7, 'lowpass', 3000, 400)
    bell(s, 1047, t + .12, .8, .4);
    [1047, 1319, 1568, 2093].forEach((f, i) => bell(s, f, t + .3 + i * .08, .9, .3))
  },
}

export const SOUND_IDS = Object.keys(SOUNDS) as SoundId[]
