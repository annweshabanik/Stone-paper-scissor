import React, { useState, useEffect } from 'react'

interface AsciiPetProps {
  lastResult?: 'win' | 'loss' | 'draw' | null
  roundKey?: number
}

// Cat ASCII frames
const CAT_FRAMES = {
  idle: `  /\\_/\\  \n ( o.o ) \n  > ^ < `,
  blink: `  /\\_/\\  \n ( -.- ) \n  > ^ < `,
  wink: `  /\\_/\\  \n ( ^.o ) \n  > ^ < `,
  meow: `  /\\_/\\  \n ( =^o^=)\n  > ^ < `,
  happy: `  /\\_/\\  \n ( ^.^ ) \n  > ^ < `,
  sad: `  /\\_/\\  \n ( T.T ) \n  > ^ < `,
}

/**
 * Synthesizes a cute, realistic cat meow using Web Audio API (zero external assets).
 * Frequency curves: starts around 400Hz, glides to 750Hz, then drops smoothly to 350Hz.
 */
function playMeowSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return

    const ctx = new AudioContextClass()
    if (ctx.state === 'suspended') {
      ctx.resume()
    }

    const now = ctx.currentTime
    const duration = 0.55

    // Primary vocal oscillator
    const osc = ctx.createOscillator()
    osc.type = 'triangle'

    // Formant filter to mimic feline vocal tract resonance
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.Q.setValueAtTime(3.2, now)

    // Gain envelope (soft attack, sustained vocalization, gentle fadeout)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.001, now)
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.08)
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.28)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)

    // Meow Pitch inflection (m-e-o-w glide: 420Hz -> 760Hz -> 380Hz)
    osc.frequency.setValueAtTime(420, now)
    osc.frequency.exponentialRampToValueAtTime(760, now + 0.16)
    filter.frequency.setValueAtTime(900, now)
    filter.frequency.exponentialRampToValueAtTime(1450, now + 0.18)

    osc.frequency.exponentialRampToValueAtTime(380, now + duration)
    filter.frequency.exponentialRampToValueAtTime(700, now + duration)

    // Vibrato / purr overtone oscillator
    const vibrato = ctx.createOscillator()
    vibrato.frequency.setValueAtTime(6.5, now)
    const vibratoGain = ctx.createGain()
    vibratoGain.gain.setValueAtTime(18, now)
    vibrato.connect(osc.frequency)

    // Audio node connections
    osc.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    vibrato.start(now)
    osc.stop(now + duration)
    vibrato.stop(now + duration)

    setTimeout(() => {
      ctx.close().catch(() => {})
    }, (duration + 0.1) * 1000)
  } catch (err) {
    console.warn('AudioContext prevented or failed:', err)
  }
}

export const AsciiPet: React.FC<AsciiPetProps> = ({ lastResult, roundKey }) => {
  const [isHovered, setIsHovered] = useState(false)
  const [blinkFrame, setBlinkFrame] = useState(0) // 0: idle, 1: blink, 2: meow
  const [bubbleText, setBubbleText] = useState<string | null>(null)

  // Natural spontaneous blinking when idle
  useEffect(() => {
    if (isHovered) return

    const interval = setInterval(() => {
      // Periodic gentle blink
      setBlinkFrame(1)
      setTimeout(() => setBlinkFrame(0), 160)
    }, 3800)

    return () => clearInterval(interval)
  }, [isHovered])

  // Reaction to round results
  useEffect(() => {
    if (!lastResult) return
    if (lastResult === 'win') {
      setBubbleText('Purr~ Yay! 🐾')
    } else if (lastResult === 'loss') {
      setBubbleText('Hiss! 😿')
    } else {
      setBubbleText('Nya? ⚖️')
    }

    const t = setTimeout(() => {
      setBubbleText(null)
    }, 2400)
    return () => clearTimeout(t)
  }, [lastResult, roundKey])

  // Mouse hover event handler
  const handleMouseEnter = () => {
    setIsHovered(true)
    setBubbleText('Meow! ~(=^o^=)')

    // Rapid blink then open mouth to meow
    setBlinkFrame(1)
    setTimeout(() => {
      setBlinkFrame(2) // mouth open meow
      playMeowSound()
    }, 140)

    setTimeout(() => {
      setBlinkFrame(0)
    }, 700)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setTimeout(() => {
      setBubbleText(null)
      setBlinkFrame(0)
    }, 800)
  }

  // Determine which frame to render
  let currentArt = CAT_FRAMES.idle
  if (blinkFrame === 1) {
    currentArt = CAT_FRAMES.blink
  } else if (blinkFrame === 2) {
    currentArt = CAT_FRAMES.meow
  } else if (isHovered) {
    currentArt = CAT_FRAMES.wink
  } else if (lastResult === 'win') {
    currentArt = CAT_FRAMES.happy
  } else if (lastResult === 'loss') {
    currentArt = CAT_FRAMES.sad
  }

  return (
    <aside
      aria-label="Interactive ASCII Cat"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="fixed bottom-4 right-4 z-40 flex flex-col items-end select-none group cursor-pointer transition-transform duration-200 hover:-translate-y-1"
    >
      {/* Speech Bubble on Hover or Result */}
      {bubbleText && (
        <div className="mb-1.5 mr-1 px-2.5 py-1 rounded-xl bg-purple-950/90 border border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.4)] text-[10px] font-mono font-bold text-purple-200 animate-popup whitespace-nowrap flex items-center gap-1.5 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping inline-block" />
          {bubbleText}
        </div>
      )}

      {/* ASCII Cat Card Container */}
      <div
        className={`px-3 py-2 rounded-2xl border-2 transition-all duration-300 backdrop-blur-md flex flex-col items-center shadow-lg ${
          isHovered
            ? 'border-purple-400 bg-zinc-950/95 neon-glow-purple shadow-[0_0_25px_rgba(168,85,247,0.45)] scale-105'
            : 'border-zinc-800/80 bg-zinc-950/80 hover:border-zinc-700'
        }`}
      >
        <pre className="font-mono text-[11px] leading-[12px] font-black text-purple-300 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)] tracking-wider">
          {currentArt}
        </pre>

        {/* Small Bottom Tag */}
        <div className="mt-1 flex items-center gap-1 text-[9px] font-mono text-zinc-500 group-hover:text-purple-300 transition-colors">
          <span className="text-[10px]">🐾</span>
          <span>{isHovered ? 'Petting...' : 'Hover me'}</span>
        </div>
      </div>
    </aside>
  )
}
