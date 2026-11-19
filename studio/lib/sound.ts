// Web Audio API Synthesizer for tactile micro-interactions in ARS-BG PRO

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

// Global user gesture unlock for browser autoplay policies
if (typeof window !== "undefined") {
  const unlock = () => {
    try {
      const ctx = getAudioContext()
      if (ctx && ctx.state === "suspended") {
        ctx.resume().catch(() => {})
      }
    } catch {}
    window.removeEventListener("pointerdown", unlock)
    window.removeEventListener("keydown", unlock)
  }
  window.addEventListener("pointerdown", unlock)
  window.addEventListener("keydown", unlock)
}

const MUTE_KEY = "arsbg:sound_muted"

export function isSoundMuted(): boolean {
  if (typeof window === "undefined") return false
  try {
    const val = localStorage.getItem(MUTE_KEY) ?? localStorage.getItem("gradii:sound_muted")
    return val === "1"
  } catch {
    return false
  }
}

export function setSoundMuted(muted: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0")
    window.dispatchEvent(new Event("arsbg:sound_toggle"))
  } catch {}
}

/** Crisp tactile click sound (680Hz -> 920Hz, 70ms) */
export function playClickSound() {
  if (isSoundMuted()) return
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    if (ctx.state === "suspended") {
      ctx.resume().then(() => playClickDirect(ctx)).catch(() => {})
    } else {
      playClickDirect(ctx)
    }
  } catch {}
}

function playClickDirect(ctx: AudioContext) {
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = "sine"
  osc.frequency.setValueAtTime(680, t)
  osc.frequency.exponentialRampToValueAtTime(920, t + 0.045)
  gain.gain.setValueAtTime(0, t)
  gain.gain.linearRampToValueAtTime(0.20, t + 0.004)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.065)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(t)
  osc.stop(t + 0.07)
}

let lastSliderTickTime = 0

/** Smooth slider tick sound on value adjustments */
export function playSliderTickSound(valRatio = 0.5) {
  if (isSoundMuted()) return
  const now = performance.now()
  if (now - lastSliderTickTime < 35) return
  lastSliderTickTime = now
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    if (ctx.state === "suspended") {
      ctx.resume().then(() => playTickDirect(ctx, valRatio)).catch(() => {})
    } else {
      playTickDirect(ctx, valRatio)
    }
  } catch {}
}

function playTickDirect(ctx: AudioContext, valRatio: number) {
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = "sine"
  const freq = 580 + Math.max(0, Math.min(1, valRatio)) * 340
  osc.frequency.setValueAtTime(freq, t)
  osc.frequency.exponentialRampToValueAtTime(freq * 0.8, t + 0.03)
  gain.gain.setValueAtTime(0, t)
  gain.gain.linearRampToValueAtTime(0.12, t + 0.003)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.032)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(t)
  osc.stop(t + 0.035)
}

/** Harmonious two-tone chime when switching presets / themes (520Hz -> 780Hz) */
export function playPresetSound() {
  if (isSoundMuted()) return
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    if (ctx.state === "suspended") {
      ctx.resume().then(() => playChimeDirect(ctx)).catch(() => {})
    } else {
      playChimeDirect(ctx)
    }
  } catch {}
}

function playChimeDirect(ctx: AudioContext) {
  const t = ctx.currentTime

  const osc1 = ctx.createOscillator()
  const gain1 = ctx.createGain()
  osc1.type = "sine"
  osc1.frequency.setValueAtTime(520, t)
  gain1.gain.setValueAtTime(0, t)
  gain1.gain.linearRampToValueAtTime(0.16, t + 0.005)
  gain1.gain.exponentialRampToValueAtTime(0.0001, t + 0.09)
  osc1.connect(gain1)
  gain1.connect(ctx.destination)

  const osc2 = ctx.createOscillator()
  const gain2 = ctx.createGain()
  osc2.type = "sine"
  osc2.frequency.setValueAtTime(780, t + 0.04)
  gain2.gain.setValueAtTime(0, t + 0.04)
  gain2.gain.linearRampToValueAtTime(0.18, t + 0.045)
  gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.16)
  osc2.connect(gain2)
  gain2.connect(ctx.destination)

  osc1.start(t)
  osc1.stop(t + 0.1)
  osc2.start(t + 0.04)
  osc2.stop(t + 0.18)
}
