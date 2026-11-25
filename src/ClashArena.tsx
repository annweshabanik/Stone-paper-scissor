import React from 'react'
import type { Move } from './aiService'
import { StoneVector, PaperVector, ScissorVector } from './VectorIcons'
import { ParticleCanvas } from './ParticleCanvas'
import type { ClashParticleType } from './ParticleCanvas'

interface ClashArenaProps {
  userMove: Move | null
  aiMove: Move | null
  result: 'win' | 'loss' | 'draw' | null
  roundKey: number
}

export const ClashArena: React.FC<ClashArenaProps> = ({
  userMove,
  aiMove,
  result,
  roundKey,
}) => {
  // Determine animation classes based on rock breaks scissors, scissors cuts paper, paper wraps rock
  let userAnimClass = 'animate-move-flash'
  let aiAnimClass = 'animate-move-flash'
  let clashDescription = ''
  let particleType: ClashParticleType | null = null

  if (userMove && aiMove && result) {
    if (result === 'draw') {
      userAnimClass = 'animate-draw-bounce'
      aiAnimClass = 'animate-draw-bounce'
      clashDescription = 'Perfect mirror clash! No damage taken.'
      particleType = 'draw_sparks'
    } else if (result === 'win') {
      // User wins
      if (userMove === 'stone' && aiMove === 'scissor') {
        userAnimClass = 'animate-stone-slam'
        aiAnimClass = 'animate-scissor-shatter'
        clashDescription = '💥 Stone smashed and shattered Scissor!'
        particleType = 'rock_shatter'
      } else if (userMove === 'scissor' && aiMove === 'paper') {
        userAnimClass = 'animate-scissor-slice'
        aiAnimClass = 'animate-paper-torn'
        clashDescription = '⚡ Scissor sliced and shredded Paper!'
        particleType = 'laser_sparks'
      } else if (userMove === 'paper' && aiMove === 'stone') {
        userAnimClass = 'animate-paper-wrap'
        aiAnimClass = 'animate-stone-trapped'
        clashDescription = '📜 Paper engulfed and smothered Stone!'
        particleType = 'paper_confetti'
      }
    } else {
      // AI wins (result === 'loss')
      if (aiMove === 'stone' && userMove === 'scissor') {
        aiAnimClass = 'animate-stone-slam'
        userAnimClass = 'animate-scissor-shatter'
        clashDescription = '💥 AI Stone smashed your Scissor!'
        particleType = 'rock_shatter'
      } else if (aiMove === 'scissor' && userMove === 'paper') {
        aiAnimClass = 'animate-scissor-slice'
        userAnimClass = 'animate-paper-torn'
        clashDescription = '⚡ AI Scissor sliced your Paper!'
        particleType = 'laser_sparks'
      } else if (aiMove === 'paper' && userMove === 'stone') {
        aiAnimClass = 'animate-paper-wrap'
        userAnimClass = 'animate-stone-trapped'
        clashDescription = '📜 AI Paper enveloped your Stone!'
        particleType = 'paper_confetti'
      }
    }
  }

  const renderIcon = (move: Move, isWinner: boolean) => {
    switch (move) {
      case 'stone':
        return <StoneVector className="w-16 h-16 sm:w-20 sm:h-20" glow={isWinner} />
      case 'paper':
        return <PaperVector className="w-16 h-16 sm:w-20 sm:h-20" glow={isWinner} />
      case 'scissor':
        return <ScissorVector className="w-16 h-16 sm:w-20 sm:h-20" glow={isWinner} />
    }
  }

  return (
    <div className="w-full flex flex-col items-center justify-center my-1 relative">
      {/* Particle Canvas Overlay for Shatter Debris and Spark Sparks */}
      <ParticleCanvas type={particleType} triggerKey={roundKey} />

      {/* Clash Action Stage */}
      <div className="w-full max-w-md grid grid-cols-2 gap-4 items-center justify-center relative">
        {/* User Move Box */}
        <div className="flex flex-col items-center">
          <span className="text-xs font-mono font-medium text-green-400 mb-1.5">YOU</span>
          <div
            key={`u-${roundKey}`}
            className={`w-32 h-36 sm:w-36 sm:h-38 rounded-2xl border-2 flex flex-col items-center justify-center p-2.5 transition-all duration-300 ${userAnimClass} ${
              result === 'win'
                ? 'border-green-400 bg-green-950/30 neon-glow-green'
                : result === 'loss'
                ? 'border-zinc-800 bg-zinc-900/50'
                : 'border-cyan-500/50 bg-cyan-950/20'
            }`}
          >
            {userMove ? (
              <>
                <div className="mb-1">{renderIcon(userMove, result === 'win')}</div>
                <span className="text-xs font-bold uppercase tracking-wider text-green-300">
                  {userMove}
                </span>
              </>
            ) : (
              <span className="text-xs font-mono text-zinc-600">Waiting</span>
            )}
          </div>
        </div>

        {/* AI Move Box */}
        <div className="flex flex-col items-center">
          <span className="text-xs font-mono font-medium text-purple-400 mb-1.5">AI</span>
          <div
            key={`ai-${roundKey}`}
            className={`w-32 h-36 sm:w-36 sm:h-38 rounded-2xl border-2 flex flex-col items-center justify-center p-2.5 transition-all duration-300 ${aiAnimClass} ${
              result === 'loss'
                ? 'border-purple-400 bg-purple-950/30 neon-glow-purple'
                : result === 'win'
                ? 'border-zinc-800 bg-zinc-900/50'
                : 'border-cyan-500/50 bg-cyan-950/20'
            }`}
          >
            {aiMove ? (
              <>
                <div className="mb-1">{renderIcon(aiMove, result === 'loss')}</div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                  {aiMove}
                </span>
              </>
            ) : (
              <span className="text-xs font-mono text-purple-400/80">Sealed</span>
            )}
          </div>
        </div>
      </div>

      {/* Clash Narrative Sub-line */}
      {clashDescription && (
        <div
          key={`clash-desc-${roundKey}`}
          className="mt-2 text-xs font-mono font-medium text-zinc-300 tracking-wide animate-move-flash"
        >
          {clashDescription}
        </div>
      )}
    </div>
  )
}
