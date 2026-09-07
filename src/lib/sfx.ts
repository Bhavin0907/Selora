import { useUiStore } from '../store/useUiStore'

/**
 * Tiny retro SFX synthesized with the Web Audio API — no audio assets, so
 * zero bundle bloat. All sounds respect the global mute flag (muted by
 * default; toggled from the HUD).
 */

let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

interface ToneOpts {
  freq: number
  duration: number
  type?: OscillatorType
  gain?: number
  delay?: number
  slideTo?: number
}

function tone({ freq, duration, type = 'square', gain = 0.06, delay = 0, slideTo }: ToneOpts) {
  const ac = getCtx()
  if (!ac) return
  const start = ac.currentTime + delay
  const osc = ac.createOscillator()
  const amp = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  if (slideTo) osc.frequency.linearRampToValueAtTime(slideTo, start + duration)
  amp.gain.setValueAtTime(0.0001, start)
  amp.gain.linearRampToValueAtTime(gain, start + 0.01)
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(amp).connect(ac.destination)
  osc.start(start)
  osc.stop(start + duration + 0.02)
}

function isMuted(): boolean {
  return useUiStore.getState().muted
}

export const sfx = {
  /** menu move / tab switch */
  blip() {
    if (isMuted()) return
    tone({ freq: 660, duration: 0.06, type: 'square', gain: 0.05 })
  },
  /** generic UI select / confirm */
  select() {
    if (isMuted()) return
    tone({ freq: 520, duration: 0.05, type: 'square', gain: 0.05 })
    tone({ freq: 780, duration: 0.06, type: 'square', gain: 0.045, delay: 0.05 })
  },
  /** coin / deposit chime */
  coin() {
    if (isMuted()) return
    tone({ freq: 988, duration: 0.07, type: 'square', gain: 0.05 })
    tone({ freq: 1319, duration: 0.12, type: 'square', gain: 0.05, delay: 0.07 })
  },
  /** level up / victory jingle */
  levelUp() {
    if (isMuted()) return
    const notes = [523, 659, 784, 1047]
    notes.forEach((f, i) => tone({ freq: f, duration: 0.14, type: 'square', gain: 0.05, delay: i * 0.1 }))
  },
  /** error / invalid buzz */
  error() {
    if (isMuted()) return
    tone({ freq: 180, duration: 0.18, type: 'sawtooth', gain: 0.05, slideTo: 90 })
  },
}
