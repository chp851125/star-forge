// Web Audio 引擎。任何錯誤一律靜默,不可影響遊戲。
import {
  DEFAULT_MUTED, DEFAULT_VOLUME, LOW_PRIORITY_SOUNDS, MAX_VOICES, SOUND_MIN_INTERVAL_MS, SOUND_VOLUME,
} from '../config/audio'
import type { SoundId } from '../types'
import { SOUNDS, type Synth } from './sounds'

const NOISE_SECONDS = 2

let ctx: AudioContext | null = null
let master: GainNode | null = null
let noise: AudioBuffer | null = null
let resuming = false
/** 靜音與音量只存在記憶體 */
let muted = DEFAULT_MUTED
let volume = DEFAULT_VOLUME
const lastPlayed = new Map<SoundId, number>()
/** 發聲中各音效的結束時間(AudioContext 時間) */
let voices: number[] = []

const isHidden = () => typeof document !== 'undefined' && document.hidden

function applyGain() {
  if (master) master.gain.value = muted ? 0 : volume
}

function resume() {
  if (!ctx || ctx.state === 'running' || isHidden()) return
  resuming = true
  const done = () => { resuming = false }
  ctx.resume().then(done, done)
}

/** 第一次使用者互動時建立 AudioContext 並 resume */
function unlock() {
  try {
    if (!ctx) {
      const c = new AudioContext()
      const gain = c.createGain()
      const comp = c.createDynamicsCompressor()
      gain.connect(comp)
      comp.connect(c.destination)
      const buf = c.createBuffer(1, c.sampleRate * NOISE_SECONDS, c.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
      ctx = c
      master = gain
      noise = buf
      applyGain()
    }
    resume()
  } catch {
    // 不支援或被瀏覽器擋住
  }
}

function onVisibility() {
  try {
    if (!ctx) return
    if (document.hidden) ctx.suspend().catch(() => {})
    else resume()
  } catch {
    // 靜默
  }
}

/** 掛上解鎖與分頁可見度監聽;回傳解除函式 */
export function bindAudio(): () => void {
  if (typeof window === 'undefined') return () => {}
  const events = ['pointerdown', 'pointerup', 'keydown'] as const
  events.forEach((e) => window.addEventListener(e, unlock, true))
  document.addEventListener('visibilitychange', onVisibility)
  return () => {
    events.forEach((e) => window.removeEventListener(e, unlock, true))
    document.removeEventListener('visibilitychange', onVisibility)
  }
}

export function play(id: SoundId, opts?: { volume?: number }): void {
  try {
    if (muted || !ctx || !master || !noise || isHidden()) return
    // 暫停中排入的聲音會在恢復時一次爆出,直接略過
    if (ctx.state !== 'running' && !resuming) return
    const wall = performance.now()
    if (wall - (lastPlayed.get(id) ?? -Infinity) < SOUND_MIN_INTERVAL_MS[id]) return
    const t = ctx.currentTime
    voices = voices.filter((end) => end > t)
    if (voices.length >= MAX_VOICES && LOW_PRIORITY_SOUNDS.includes(id)) return

    const out = ctx.createGain()
    out.gain.value = SOUND_VOLUME[id] * (opts?.volume ?? 1)
    out.connect(master)
    const synth: Synth = { ctx, out, noise, end: t }
    SOUNDS[id](synth, t)
    lastPlayed.set(id, wall)
    voices.push(synth.end)
  } catch {
    // 靜默
  }
}

export function setMuted(v: boolean): void {
  muted = v
  try { applyGain() } catch { /* 靜默 */ }
}

export function setVolume(v: number): void {
  if (!Number.isFinite(v)) return
  volume = Math.min(1, Math.max(0, v))
  try { applyGain() } catch { /* 靜默 */ }
}

export const getState = () => ({ muted, volume })
