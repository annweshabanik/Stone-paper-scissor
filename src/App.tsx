import { useState, useEffect, useRef, useCallback } from 'react'
import type {
  Move,
  GameRound,
  AIPreparedMove,
  BestScoreRecord,
} from './aiService'
import {
  precomputeAIMove,
  determineWinner,
} from './aiService'
import {
  StoneVector,
  PaperVector,
  ScissorVector,
} from './VectorIcons'
import { WinAnalysisGraph } from './WinAnalysisGraph'
import { ClashArena } from './ClashArena'
import { AsciiPet } from './AsciiPet'
import { AI_PERSONAS } from './aiPersonas'
import type { AIPersonaKey } from './aiPersonas'
import { sfx } from './sfx'
import {
  RotateCcw,
  ShieldCheck,
  BrainCircuit,
  History,
  Zap,
  Activity,
  Trophy,
  Flame,
  Award,
  Sparkles,
  X,
  Frown,
  Volume2,
  VolumeX,
} from 'lucide-react'

// 10 moves per round limit
const MOVES_PER_ROUND = 10

const MOVE_DETAILS: Record<
  Move,
  {
    label: string
    keyHint: string
    beats: string
    color: string
    hoverGlow: string
    vector: (glow?: boolean) => React.ReactNode
  }
> = {
  stone: {
    label: 'Stone',
    keyHint: '[1] or [A]',
    beats: 'Scissor',
    color: 'emerald',
    hoverGlow: 'hover:border-green-400 hover:shadow-[0_0_25px_rgba(34,197,94,0.5)]',
    vector: (glow) => <StoneVector className="w-14 h-14 sm:w-16 sm:h-16" glow={glow} />,
  },
  paper: {
    label: 'Paper',
    keyHint: '[2] or [S]',
    beats: 'Stone',
    color: 'purple',
    hoverGlow: 'hover:border-purple-400 hover:shadow-[0_0_25px_rgba(168,85,247,0.5)]',
    vector: (glow) => <PaperVector className="w-14 h-14 sm:w-16 sm:h-16" glow={glow} />,
  },
  scissor: {
    label: 'Scissor',
    keyHint: '[3] or [D]',
    beats: 'Paper',
    color: 'cyan',
    hoverGlow: 'hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(6,182,212,0.5)]',
    vector: (glow) => <ScissorVector className="w-14 h-14 sm:w-16 sm:h-16" glow={glow} />,
  },
}

export default function App() {
  // Sound Mute Toggle
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true)

  // Selected AI Persona
  const [personaKey, setPersonaKey] = useState<AIPersonaKey>(() => {
    try {
      const saved = localStorage.getItem('sps_ai_persona')
      return (saved as AIPersonaKey) || 'grandmaster'
    } catch {
      return 'grandmaster'
    }
  })

  // Hyper Clashing Multiplier (2x points once every 5 moves)
  const [isMultiplierActive, setIsMultiplierActive] = useState<boolean>(false)
  const [lastMultiplierMoveIndex, setLastMultiplierMoveIndex] = useState<number>(-99)

  // Current 10-move round history
  const [history, setHistory] = useState<GameRound[]>(() => {
    try {
      const saved = localStorage.getItem('sps_current_match')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Persistent Best Score Records in localStorage
  const [bestScores, setBestScores] = useState<BestScoreRecord>(() => {
    try {
      const saved = localStorage.getItem('sps_best_scores')
      return saved
        ? JSON.parse(saved)
        : {
            highestPlayerScore: 0,
            bestWinStreak: 0,
            fastest10MatchWins: 0,
            totalMatchesFinished: 0,
          }
    } catch {
      return {
        highestPlayerScore: 0,
        bestWinStreak: 0,
        fastest10MatchWins: 0,
        totalMatchesFinished: 0,
      }
    }
  })

  // Precomputed AI move awaiting user's move for true simultaneous fairness
  const [nextAIMove, setNextAIMove] = useState<AIPreparedMove | null>(null)
  const [isPrecomputing, setIsPrecomputing] = useState<boolean>(false)

  // Current active round display
  const [lastRound, setLastRound] = useState<GameRound | null>(() => {
    try {
      const saved = localStorage.getItem('sps_current_match')
      if (saved) {
        const parsed = JSON.parse(saved)
        return parsed.length > 0 ? parsed[parsed.length - 1] : null
      }
    } catch {
      // ignore
    }
    return null
  })

  // Animation trigger key for clash animations
  const [roundKey, setRoundKey] = useState<number>(0)
  const [userSelectedMove, setUserSelectedMove] = useState<Move | null>(null)

  // End of Round Result Modal (Green "You won!!", Red "Better luck next time")
  const [roundOutcomeModal, setRoundOutcomeModal] = useState<{
    show: boolean
    status: 'won' | 'lost' | 'draw'
    userScore: number
    aiScore: number
  } | null>(null)

  const isRoundFinished = history.length >= MOVES_PER_ROUND

  // Multiplier eligibility: available every 5 moves (e.g. at start or >= 5 moves after last activation)
  const movesSinceMultiplier = history.length - lastMultiplierMoveIndex
  const canActivateMultiplier = !isMultiplierActive && movesSinceMultiplier >= 5 && !isRoundFinished

  // Keep a ref to the latest history to avoid stale closures in background fetches
  const historyRef = useRef<GameRound[]>(history)
  useEffect(() => {
    historyRef.current = history
    try {
      localStorage.setItem('sps_current_match', JSON.stringify(history.slice(-MOVES_PER_ROUND)))
    } catch (e) {
      console.warn('Storage error', e)
    }
  }, [history])

  // Save Persona
  useEffect(() => {
    try {
      localStorage.setItem('sps_ai_persona', personaKey)
    } catch (e) {
      console.warn(e)
    }
  }, [personaKey])

  // Save best scores whenever updated
  const saveBestScores = (newRecord: BestScoreRecord) => {
    setBestScores(newRecord)
    try {
      localStorage.setItem('sps_best_scores', JSON.stringify(newRecord))
    } catch (e) {
      console.warn('Failed to save best scores', e)
    }
  }

  // Calculate current streak
  const calculateCurrentStreak = (rounds: GameRound[]) => {
    let streak = 0
    for (let i = rounds.length - 1; i >= 0; i--) {
      if (rounds[i].result === 'win') {
        streak++
      } else {
        break
      }
    }
    return streak
  }

  // Function to prepare the next AI move in the background
  const prepareNextMove = useCallback(
    async (currentHistory: GameRound[]) => {
      setIsPrecomputing(true)
      try {
        const move = await precomputeAIMove(currentHistory, personaKey)
        setNextAIMove(move)
      } finally {
        setIsPrecomputing(false)
      }
    },
    [personaKey]
  )

  // Re-precompute when persona changes or on initial mount
  useEffect(() => {
    prepareNextMove(historyRef.current)
  }, [prepareNextMove, personaKey])

  // Play a move
  const handleUserMove = async (userMove: Move) => {
    if (history.length >= MOVES_PER_ROUND) return

    setUserSelectedMove(userMove)

    // Trigger Cyber Synth SFX based on move and clash
    if (soundEnabled) {
      if (userMove === 'stone') sfx.playRockThud()
      else if (userMove === 'scissor') sfx.playScissorSnip()
      else if (userMove === 'paper') sfx.playPaperWoosh()
    }

    // AI move is already pre-computed and locked in
    let aiPrepared = nextAIMove
    if (!aiPrepared) {
      aiPrepared = await precomputeAIMove(historyRef.current, personaKey)
    }

    const aiMove = aiPrepared.move
    const result = determineWinner(userMove, aiMove)

    const roundData: GameRound = {
      id: crypto.randomUUID(),
      roundNumber: history.length + 1,
      userMove,
      aiMove,
      result,
      aiReasoning: aiPrepared.reasoning,
      confidence: aiPrepared.confidence,
      timestamp: Date.now(),
      isMultiplier: isMultiplierActive,
    }

    // Reset multiplier after the move
    if (isMultiplierActive) {
      setIsMultiplierActive(false)
      setLastMultiplierMoveIndex(history.length)
    }

    // Instantly commit round and bump key for smooth visual flash & clash animations
    setRoundKey((k) => k + 1)
    setLastRound(roundData)

    const updatedHistory = [...history, roundData]
    setHistory(updatedHistory)
    setNextAIMove(null) // Consume precomputed move

    // Score calculations with 2x Multiplier logic
    let calculatedWins = 0
    let calculatedLosses = 0
    updatedHistory.forEach((r) => {
      const multiplier = r.isMultiplier ? 2 : 1
      if (r.result === 'win') calculatedWins += multiplier
      else if (r.result === 'loss') calculatedLosses += multiplier
    })

    const currentWinStreak = calculateCurrentStreak(updatedHistory)
    const isNowFinished = updatedHistory.length >= MOVES_PER_ROUND

    const updatedBest: BestScoreRecord = {
      highestPlayerScore: Math.max(bestScores.highestPlayerScore, calculatedWins),
      bestWinStreak: Math.max(bestScores.bestWinStreak, currentWinStreak),
      fastest10MatchWins: isNowFinished
        ? Math.max(bestScores.fastest10MatchWins, calculatedWins)
        : bestScores.fastest10MatchWins,
      totalMatchesFinished: isNowFinished
        ? bestScores.totalMatchesFinished + 1
        : bestScores.totalMatchesFinished,
    }
    saveBestScores(updatedBest)

    // If 10 moves reached, trigger pop-up after a brief moment for clash animation to complete
    if (isNowFinished) {
      setTimeout(() => {
        const finalStatus =
          calculatedWins > calculatedLosses
            ? 'won'
            : calculatedWins < calculatedLosses
            ? 'lost'
            : 'draw'

        if (soundEnabled) {
          if (finalStatus === 'won') sfx.playVictoryChime()
          else if (finalStatus === 'lost') sfx.playDefeatSound()
        }

        setRoundOutcomeModal({
          show: true,
          status: finalStatus,
          userScore: calculatedWins,
          aiScore: calculatedLosses,
        })
      }, 700)
    } else {
      prepareNextMove(updatedHistory)
    }
  }

  // Toggle Multiplier
  const handleToggleMultiplier = () => {
    if (!canActivateMultiplier) return
    setIsMultiplierActive(true)
    if (soundEnabled) sfx.playHyperChime()
  }

  // Reset or Start New 10-move Round
  const handleStartNewRound = () => {
    setHistory([])
    setLastRound(null)
    setNextAIMove(null)
    setUserSelectedMove(null)
    setRoundOutcomeModal(null)
    setIsMultiplierActive(false)
    setLastMultiplierMoveIndex(-99)
    localStorage.removeItem('sps_current_match')
    prepareNextMove([])
  }

  // Clear everything including best score in localStorage
  const handleResetAllData = () => {
    if (confirm('Reset current round and clear stored Best Score data from LocalStorage?')) {
      handleStartNewRound()
      const blankBest = {
        highestPlayerScore: 0,
        bestWinStreak: 0,
        fastest10MatchWins: 0,
        totalMatchesFinished: 0,
      }
      saveBestScores(blankBest)
    }
  }

  // Keyboard Shortcuts: [1]/[A] for Stone, [2]/[S] for Paper, [3]/[D] for Scissor, [Space] to replay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return

      const key = e.key.toLowerCase()

      if (key === '1' || key === 'a') {
        e.preventDefault()
        handleUserMove('stone')
      } else if (key === '2' || key === 's') {
        e.preventDefault()
        handleUserMove('paper')
      } else if (key === '3' || key === 'd') {
        e.preventDefault()
        handleUserMove('scissor')
      } else if (key === ' ' || key === 'spacebar') {
        e.preventDefault()
        if (roundOutcomeModal?.show || isRoundFinished) {
          handleStartNewRound()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [roundOutcomeModal, isRoundFinished, handleUserMove])

  // Calculate current point totals accounting for 2x multipliers
  let totalUserPoints = 0
  let totalAIPoints = 0
  let totalDraws = 0
  history.forEach((h) => {
    const mult = h.isMultiplier ? 2 : 1
    if (h.result === 'win') totalUserPoints += mult
    else if (h.result === 'loss') totalAIPoints += mult
    else totalDraws++
  })

  const totalMovesPlayed = history.length
  const currentStreak = calculateCurrentStreak(history)
  const currentPersona = AI_PERSONAS[personaKey]

  return (
    <div className="h-screen w-screen max-w-full overflow-hidden bg-[#070709] text-[#f4f4f5] flex flex-col justify-between px-3 py-2 sm:px-6 sm:py-2.5 select-none font-sans relative">
      {/* Interactive ASCII Companion Pet anchored to bottom right */}
      <AsciiPet lastResult={lastRound?.result} roundKey={roundKey} />

      {/* Top Header with title: Stone Paper Scissor */}
      <header className="w-full max-w-7xl mx-auto flex items-center justify-between border-b border-zinc-800/80 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-950/60 border border-purple-500/50 flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <BrainCircuit className="w-5 h-5 text-green-400" />
          </div>
          <div>
            {/* Title Stone Paper Scissor in Vibrant Neon */}
            <h1 className="text-lg sm:text-xl font-black tracking-wider uppercase flex items-center gap-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-300 to-purple-400 drop-shadow-[0_0_15px_rgba(34,197,94,0.6)]">
                Stone Paper Scissor
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-purple-950/80 border border-purple-500/40 text-purple-300">
                10 Moves
              </span>
            </h1>
            <p className="text-[10px] text-zinc-400 flex items-center gap-1.5 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block animate-ping" />
              Keys: [1/A] Stone • [2/S] Paper • [3/D] Scissor • [Space] Replay
            </p>
          </div>
        </div>

        {/* Header Right Status, Persona Selector & Sound Toggle */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle Button */}
          <button
            onClick={() => setSoundEnabled((v) => !v)}
            title={soundEnabled ? 'Mute 8-bit Synth SFX' : 'Enable 8-bit Synth SFX'}
            className="p-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 text-zinc-400 hover:text-white transition cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-green-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
          </button>

          {/* AI Persona Switcher Pill */}
          <div className="flex items-center bg-zinc-900/80 border border-zinc-800 rounded-lg p-0.5 text-[11px] font-mono">
            {(['grandmaster', 'android', 'rookie'] as AIPersonaKey[]).map((pKey) => {
              const p = AI_PERSONAS[pKey]
              const active = personaKey === pKey
              return (
                <button
                  key={pKey}
                  onClick={() => setPersonaKey(pKey)}
                  className={`px-2 py-1 rounded-md transition-all cursor-pointer font-bold ${
                    active
                      ? `${p.badgeBorder} ${p.accentColor} shadow-sm`
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {p.name.split(' ')[1] || p.name}
                </button>
              )
            })}
          </div>

          {/* Fairness Seal Indicator */}
          <div
            className={`hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all ${
              nextAIMove
                ? 'bg-green-950/40 border-green-500/50 text-green-400 shadow-[0_0_12px_rgba(34,197,94,0.25)]'
                : 'bg-purple-950/40 border-purple-500/50 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
            }`}
          >
            {isPrecomputing ? (
              <span className="inline-block w-2 h-2 rounded-full bg-purple-400 animate-ping" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
            )}
            <span className="font-mono text-[10px] tracking-wide font-medium">
              {nextAIMove ? 'SEALED (FAIR)' : 'THINKING...'}
            </span>
          </div>

          <button
            onClick={handleStartNewRound}
            title="Start New 10-Move Round"
            className="flex items-center gap-1 px-2 py-1 rounded-lg border border-zinc-800 hover:border-purple-500/60 bg-zinc-900/60 text-zinc-400 hover:text-purple-300 text-xs font-mono transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset</span>
          </button>
        </div>
      </header>

      {/* 3-Column Wide Screen Layout */}
      <main className="w-full max-w-7xl mx-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 py-1.5 min-h-0 items-stretch">
        
        {/* Left Column: Side Scoreboard + Best Score Data + AI Strategic Brief + Graph (Cols: 4) */}
        <aside className="lg:col-span-4 flex flex-col justify-between gap-2 h-full overflow-y-auto pr-0.5">
          
          {/* Live Scoreboard with 10-Move Progress */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-2.5 shadow-lg backdrop-blur-sm flex flex-col gap-1.5">
            <div className="flex items-center justify-between pb-1 border-b border-zinc-800/70">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 font-bold">
                <Activity className="w-3.5 h-3.5 text-green-400" /> Round Progress
              </span>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-zinc-900 text-green-400 border border-zinc-800">
                Move {totalMovesPlayed} / {MOVES_PER_ROUND}
              </span>
            </div>

            {/* 10-Move Progress Bar */}
            <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-purple-500 transition-all duration-300"
                style={{ width: `${(totalMovesPlayed / MOVES_PER_ROUND) * 100}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="p-1.5 rounded-xl border border-green-500/30 bg-green-950/20 neon-glow-green">
                <span className="text-[9px] uppercase font-mono text-green-400 block">You</span>
                <span className="text-lg font-bold text-green-300">{totalUserPoints}</span>
              </div>
              <div className="p-1.5 rounded-xl border border-zinc-800/80 bg-zinc-900/50">
                <span className="text-[9px] uppercase font-mono text-zinc-500 block">Draw</span>
                <span className="text-lg font-bold text-zinc-300">{totalDraws}</span>
              </div>
              <div className="p-1.5 rounded-xl border border-purple-500/30 bg-purple-950/20 neon-glow-purple">
                <span className="text-[9px] uppercase font-mono text-purple-400 block">AI</span>
                <span className="text-lg font-bold text-purple-300">{totalAIPoints}</span>
              </div>
            </div>
          </div>

          {/* BEST SCORE DATA PANEL (Persistent in Local Storage) */}
          <div className="rounded-2xl border border-amber-500/40 bg-zinc-950/80 p-2.5 shadow-lg neon-glow-amber">
            <div className="flex items-center justify-between pb-1 border-b border-zinc-800/70 mb-1.5">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-bold">
                <Trophy className="w-3.5 h-3.5 text-amber-400" /> Best Score Data
              </span>
              <span className="text-[9px] font-mono text-zinc-500">Local Storage</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="p-1.5 rounded-xl bg-amber-950/20 border border-amber-500/30">
                <span className="text-[8px] uppercase font-mono text-amber-400/90 block">High Score</span>
                <span className="text-base font-black text-amber-300">{bestScores.highestPlayerScore}</span>
              </div>
              <div className="p-1.5 rounded-xl bg-amber-950/20 border border-amber-500/30">
                <span className="text-[8px] uppercase font-mono text-amber-400/90 block">Best Streak</span>
                <span className="text-base font-black text-amber-300">{bestScores.bestWinStreak}x</span>
              </div>
              <div className="p-1.5 rounded-xl bg-amber-950/20 border border-amber-500/30">
                <span className="text-[8px] uppercase font-mono text-amber-400/90 block">Finished</span>
                <span className="text-base font-black text-amber-300">{bestScores.totalMatchesFinished}</span>
              </div>
            </div>

            {currentStreak > 1 && (
              <div className="mt-1 flex items-center justify-between px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-[9px] font-mono text-amber-300">
                <span className="flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400 animate-bounce" /> Win Streak:
                </span>
                <strong className="text-amber-400">{currentStreak}x Combo!</strong>
              </div>
            )}
          </div>

          {/* AI PERSONA CARD & STRATEGIC VOICE LINE */}
          <div className={`rounded-2xl border ${currentPersona.badgeBorder} p-2.5 shadow-lg`}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <pre className="font-mono text-[9px] leading-[10px] font-bold text-zinc-300 bg-zinc-900 px-1 py-0.5 rounded border border-zinc-800">
                  {currentPersona.avatarAscii}
                </pre>
                <div>
                  <span className={`text-xs font-mono font-bold block ${currentPersona.accentColor}`}>
                    {currentPersona.name}
                  </span>
                  <span className="text-[9px] text-zinc-500 block">{currentPersona.subtitle}</span>
                </div>
              </div>
              {lastRound?.confidence && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800">
                  {lastRound.confidence}% Conf
                </span>
              )}
            </div>

            {lastRound?.aiReasoning ? (
              <p className="text-xs text-zinc-200 leading-relaxed font-sans border-l-2 border-purple-500 pl-2 py-0.5">
                "{lastRound.aiReasoning}"
              </p>
            ) : (
              <p className="text-xs text-zinc-500 italic">
                "{currentPersona.taunts.draw[0]}"
              </p>
            )}
          </div>

          {/* Graph Below AI Strategic Part: Game Analysis of Win Potentials */}
          <WinAnalysisGraph history={history} />
        </aside>

        {/* Center Column: Arena, Clash Animation Stage & Action Buttons (Cols: 5) */}
        <section className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-purple-500/30 bg-zinc-950/80 p-3 sm:p-4 backdrop-blur-md relative overflow-hidden neon-card-glow h-full">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-tr from-green-500/10 via-purple-500/10 to-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Confrontation Arena Stage with Smooth Clash Animations & Particle Canvas */}
          <div className="relative z-10 flex-1 flex flex-col justify-center items-center">
            
            {/* Round & Outcome Badge */}
            <div className="text-center mb-1.5">
              {lastRound ? (
                <div key={`outcome-${roundKey}`} className="animate-move-flash inline-block">
                  <span
                    className={`inline-block text-xs sm:text-sm font-bold tracking-wide uppercase px-4 py-1 rounded-full border transition-all ${
                      lastRound.result === 'win'
                        ? 'border-green-400 bg-green-950/60 text-green-300 neon-glow-green'
                        : lastRound.result === 'loss'
                        ? 'border-purple-400 bg-purple-950/60 text-purple-300 neon-glow-purple'
                        : 'border-cyan-400 bg-cyan-950/60 text-cyan-300 neon-glow-cyan'
                    }`}
                  >
                    {lastRound.result === 'win' && (lastRound.isMultiplier ? '🔥 2X HYPER VICTORY!' : '⚡ VICTORY — PLAYER WINS')}
                    {lastRound.result === 'loss' && (lastRound.isMultiplier ? '💀 2X HYPER COUNTERED!' : '🔮 AI PREDICTED & COUNTERED')}
                    {lastRound.result === 'draw' && '⚖️ SIMULTANEOUS DRAW'}
                  </span>
                </div>
              ) : (
                <div className="text-xs font-mono text-zinc-400 tracking-wider uppercase py-1 px-4 rounded-full border border-zinc-800 bg-zinc-900/60">
                  Press [1], [2], [3] or click below
                </div>
              )}
            </div>

            {/* Animated Clash Arena (Stone smashes Scissor / Scissor cuts Paper / Paper wraps Stone with Debris) */}
            <ClashArena
              userMove={lastRound ? lastRound.userMove : null}
              aiMove={lastRound ? lastRound.aiMove : null}
              result={lastRound ? lastRound.result : null}
              roundKey={roundKey}
            />

            {/* Multiplier / Bet Bar */}
            <div className="mt-2 flex items-center justify-center gap-2">
              <button
                onClick={handleToggleMultiplier}
                disabled={!canActivateMultiplier}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isMultiplierActive
                    ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.6)] animate-pulse'
                    : canActivateMultiplier
                    ? 'border border-amber-500/50 bg-amber-950/40 text-amber-300 hover:bg-amber-900/50 hover:shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                    : 'border border-zinc-800 bg-zinc-900/40 text-zinc-600 opacity-60 cursor-not-allowed'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>
                  {isMultiplierActive
                    ? '⚡ 2X HYPER MULTIPLIER ACTIVE!'
                    : canActivateMultiplier
                    ? 'ACTIVATE 2X MULTIPLIER (Ready!)'
                    : `2x Bet in ${Math.max(0, 5 - movesSinceMultiplier)} moves`}
                </span>
              </button>
            </div>
          </div>

          {/* User Interactive Buttons with Neon Glow & Keyboard Tooltips */}
          <div className="relative z-10 pt-1.5">
            <div className="text-[10px] font-mono text-zinc-400 text-center mb-1 flex items-center justify-center gap-2">
              <span className="h-[1px] w-12 bg-zinc-800" />
              CHOOSE ACTION (SIMULTANEOUS ZERO-LATENCY)
              <span className="h-[1px] w-12 bg-zinc-800" />
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {(['stone', 'paper', 'scissor'] as Move[]).map((move) => {
                const detail = MOVE_DETAILS[move]
                const isCurrentSelected = userSelectedMove === move && lastRound !== null

                return (
                  <button
                    key={move}
                    disabled={isRoundFinished}
                    onClick={() => handleUserMove(move)}
                    className={`group relative flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl border-2 transition-all duration-200 cursor-pointer active:scale-95 bg-zinc-900/80 disabled:opacity-40 disabled:cursor-not-allowed ${
                      detail.hoverGlow
                    } ${
                      isCurrentSelected
                        ? 'border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.4)]'
                        : 'border-zinc-800/90'
                    }`}
                  >
                    {/* Floating Vector with dynamic hover animation */}
                    <div className="transition-transform duration-200 group-hover:scale-115 mb-1">
                      {detail.vector(false)}
                    </div>

                    <span className="text-xs font-extrabold uppercase tracking-widest text-zinc-100 group-hover:text-white">
                      {detail.label}
                    </span>

                    <span className="text-[9px] font-mono text-zinc-500 group-hover:text-zinc-300">
                      {detail.keyHint}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {/* Right Column: 10-Moves Historical Memory Stream (Cols: 3) */}
        <aside className="lg:col-span-3 flex flex-col rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-3 shadow-lg backdrop-blur-sm h-full overflow-hidden">
          <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800/70 mb-1.5">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-300 flex items-center gap-1.5 font-bold">
              <History className="w-3.5 h-3.5 text-cyan-400" /> Round Move Stream
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-cyan-400 border border-cyan-900/60 font-semibold">
              {history.length} / {MOVES_PER_ROUND}
            </span>
          </div>

          <p className="text-[9px] text-zinc-500 font-mono mb-1.5">
            Sequential stream fed into {currentPersona.name} predictor.
          </p>

          {history.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
              <BrainCircuit className="w-8 h-8 text-zinc-700 mb-2 animate-pulse" />
              <span className="text-xs font-mono text-zinc-500">Round hasn't started</span>
              <span className="text-[10px] text-zinc-600 mt-0.5">Press [1], [2], or [3] to begin</span>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-xs font-mono">
              {history
                .slice(-MOVES_PER_ROUND)
                .reverse()
                .map((item, idx) => {
                  const actualRound = history.length - idx
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-1.5 rounded-xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700 transition"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-500 text-[10px] w-4">#{actualRound}</span>
                        <span className="text-zinc-200 capitalize font-medium">
                          {item.userMove}
                        </span>
                        <span className="text-zinc-600 text-[9px]">vs</span>
                        <span className="text-purple-300 capitalize font-medium">
                          {item.aiMove}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {item.isMultiplier && (
                          <span className="text-[8px] font-bold text-amber-400 px-1 rounded bg-amber-950/80 border border-amber-600/60">
                            2X
                          </span>
                        )}
                        <span
                          className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${
                            item.result === 'win'
                              ? 'bg-green-950 text-green-400 border border-green-800'
                              : item.result === 'loss'
                              ? 'bg-purple-950 text-purple-400 border border-purple-800'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {item.result}
                        </span>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}

          {/* Reset All Data Link */}
          <div className="pt-1.5 border-t border-zinc-900 mt-1.5 flex justify-end">
            <button
              onClick={handleResetAllData}
              className="text-[9px] font-mono text-zinc-600 hover:text-red-400 transition cursor-pointer"
            >
              Reset All Best Records
            </button>
          </div>
        </aside>

      </main>

      {/* ULTRA CLEAN END OF ROUND POP-UP MODAL (GREEN: "You won!!", RED: "Better luck next time") */}
      {roundOutcomeModal?.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div
            className={`w-full max-w-sm rounded-3xl p-6 text-center shadow-2xl border-2 animate-popup relative ${
              roundOutcomeModal.status === 'won'
                ? 'bg-zinc-950 border-green-500/80 shadow-[0_0_50px_rgba(34,197,94,0.35)]'
                : roundOutcomeModal.status === 'lost'
                ? 'bg-zinc-950 border-red-500/80 shadow-[0_0_50px_rgba(239,68,68,0.35)]'
                : 'bg-zinc-950 border-cyan-500/80 shadow-[0_0_50px_rgba(6,182,212,0.35)]'
            }`}
          >
            {/* Close Button */}
            <button
              onClick={() => setRoundOutcomeModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-zinc-900 text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon & Title */}
            {roundOutcomeModal.status === 'won' ? (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-green-950/80 border border-green-500/60 flex items-center justify-center text-green-400 mb-3 neon-glow-green">
                  <Sparkles className="w-9 h-9" />
                </div>
                <h2 className="text-3xl font-black uppercase text-green-400 drop-shadow-[0_0_15px_rgba(34,197,94,0.7)] tracking-wide">
                  You won!!
                </h2>
                <p className="text-xs text-zinc-300 font-mono mt-1">
                  Dominating performance over 10 moves!
                </p>
              </div>
            ) : roundOutcomeModal.status === 'lost' ? (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-red-950/80 border border-red-500/60 flex items-center justify-center text-red-400 mb-3 shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                  <Frown className="w-9 h-9" />
                </div>
                <h2 className="text-2xl font-black uppercase text-red-400 drop-shadow-[0_0_15px_rgba(239,68,68,0.7)] tracking-wide">
                  Better luck next time
                </h2>
                <p className="text-xs text-zinc-300 font-mono mt-1">
                  The {currentPersona.name} out-predicted this round.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-500/60 flex items-center justify-center text-cyan-400 mb-3 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                  <Award className="w-9 h-9" />
                </div>
                <h2 className="text-2xl font-black uppercase text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.7)] tracking-wide">
                  Round Draw!
                </h2>
                <p className="text-xs text-zinc-300 font-mono mt-1">
                  Dead equal score over all 10 moves.
                </p>
              </div>
            )}

            {/* Score Summary Box */}
            <div className="my-5 p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800 grid grid-cols-2 gap-3 text-center">
              <div>
                <span className="text-[10px] uppercase font-mono text-zinc-400 block">Your Points</span>
                <span className="text-2xl font-black text-green-400">{roundOutcomeModal.userScore}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-zinc-400 block">AI Points</span>
                <span className="text-2xl font-black text-purple-400">{roundOutcomeModal.aiScore}</span>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleStartNewRound}
              className={`w-full py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg active:scale-95 ${
                roundOutcomeModal.status === 'won'
                  ? 'bg-green-500 hover:bg-green-400 text-black shadow-[0_0_20px_rgba(34,197,94,0.4)]'
                  : roundOutcomeModal.status === 'lost'
                  ? 'bg-red-500 hover:bg-red-400 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]'
              }`}
            >
              Play Another Round (Press Space)
            </button>
          </div>
        </div>
      )}

      {/* Ultra Slim Footer */}
      <footer className="w-full max-w-7xl mx-auto flex items-center justify-between pt-1 border-t border-zinc-900 text-[10px] font-mono text-zinc-600 flex-shrink-0">
        <span>Stone Paper Scissor • 10 Moves • Gemini 3.5 Flash Lite</span>
        <span className="text-zinc-500">SFX, Personas, 2x Multiplier, Keyboard Shortcuts, Particles Active</span>
      </footer>
    </div>
  )
}
