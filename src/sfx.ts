// Web Audio API Retro 8-bit / Synth Sound Effects Engine (Zero external dependencies)

class SoundFX {
  private ctx: AudioContext | null = null

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  /**
   * 1. Heavy bass thud for Rock impact
   * Deep frequency drop with distortion / punch
   */
  playRockThud() {
    const ctx = this.getContext()
    if (!ctx) return
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(140, now)
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.35)

    // Distortion wave shaper for extra gravelly crunch
    const waveShaper = ctx.createWaveShaper()
    waveShaper.curve = this.makeDistortionCurve(40) as any

    gain.gain.setValueAtTime(0.4, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38)

    osc.connect(waveShaper)
    waveShaper.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.4)
  }

  /**
   * 2. Sharp laser snip for Scissor
   * Rapid high frequency laser zap
   */
  playScissorSnip() {
    const ctx = this.getContext()
    if (!ctx) return
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(1800, now)
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.18)

    gain.gain.setValueAtTime(0.28, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.2)
  }

  /**
   * 3. Soft woosh for Paper wrap
   * Filtered white noise / gentle airy envelope
   */
  playPaperWoosh() {
    const ctx = this.getContext()
    if (!ctx) return
    const now = ctx.currentTime
    const duration = 0.35

    const bufferSize = ctx.sampleRate * duration
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }

    const noise = ctx.createBufferSource()
    noise.buffer = buffer

    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(350, now)
    filter.frequency.exponentialRampToValueAtTime(950, now + duration * 0.5)
    filter.frequency.exponentialRampToValueAtTime(300, now + duration)
    filter.Q.setValueAtTime(2.5, now)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.001, now)
    gain.gain.exponentialRampToValueAtTime(0.3, now + 0.08)
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    noise.start(now)
    noise.stop(now + duration)
  }

  /**
   * 4. Victory chime for round wins
   * Arpeggiated upbeat 8-bit triad (C5 -> E5 -> G5 -> C6)
   */
  playVictoryChime() {
    const ctx = this.getContext()
    if (!ctx) return
    const now = ctx.currentTime

    const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'square'
      osc.frequency.setValueAtTime(freq, now + idx * 0.09)

      gain.gain.setValueAtTime(0.001, now + idx * 0.09)
      gain.gain.exponentialRampToValueAtTime(0.18, now + idx * 0.09 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.22)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now + idx * 0.09)
      osc.stop(now + idx * 0.09 + 0.25)
    })
  }

  /**
   * Defeat rumble sound
   */
  playDefeatSound() {
    const ctx = this.getContext()
    if (!ctx) return
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(180, now)
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.4)

    gain.gain.setValueAtTime(0.2, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.45)
  }

  /**
   * Multiplier activation / Hyper chime
   */
  playHyperChime() {
    const ctx = this.getContext()
    if (!ctx) return
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(440, now)
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.22)

    gain.gain.setValueAtTime(0.001, now)
    gain.gain.exponentialRampToValueAtTime(0.25, now + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.28)
  }

  private makeDistortionCurve(amount: number): Float32Array {
    const n_samples = 44100
    const buffer = new ArrayBuffer(n_samples * 4)
    const curve = new Float32Array(buffer)
    const deg = Math.PI / 180
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x))
    }
    return curve
  }
}

export const sfx = new SoundFX()
