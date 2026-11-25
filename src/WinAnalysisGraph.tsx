import React, { useMemo } from 'react'
import type { GameRound, Move } from './aiService'
import { BarChart3 } from 'lucide-react'

interface WinAnalysisGraphProps {
  history: GameRound[]
}

interface MoveStats {
  move: Move
  label: string
  color: string
  barBg: string
  userPicks: number
  userWins: number
  userWinRate: number
  aiPicks: number
  aiWins: number
  aiWinRate: number
}

export const WinAnalysisGraph: React.FC<WinAnalysisGraphProps> = ({ history }) => {
  const stats = useMemo(() => {
    const moves: Move[] = ['stone', 'paper', 'scissor']
    const result: MoveStats[] = moves.map((m) => {
      // User stats for this move
      const userRounds = history.filter((h) => h.userMove === m)
      const userWins = userRounds.filter((h) => h.result === 'win').length
      const userWinRate = userRounds.length > 0 ? Math.round((userWins / userRounds.length) * 100) : 0

      // AI stats for this move
      const aiRounds = history.filter((h) => h.aiMove === m)
      const aiWins = aiRounds.filter((h) => h.result === 'loss').length
      const aiWinRate = aiRounds.length > 0 ? Math.round((aiWins / aiRounds.length) * 100) : 0

      const colors: Record<Move, { label: string; color: string; barBg: string }> = {
        stone: { label: 'Stone', color: '#22c55e', barBg: 'bg-green-500' },
        paper: { label: 'Paper', color: '#a855f7', barBg: 'bg-purple-500' },
        scissor: { label: 'Scissor', color: '#06b6d4', barBg: 'bg-cyan-500' },
      }

      return {
        move: m,
        label: colors[m].label,
        color: colors[m].color,
        barBg: colors[m].barBg,
        userPicks: userRounds.length,
        userWins,
        userWinRate,
        aiPicks: aiRounds.length,
        aiWins,
        aiWinRate,
      }
    })

    // Identify highest potential win move for User and AI
    let bestUserMove: MoveStats = result[0]
    let bestAIMove: MoveStats = result[0]

    result.forEach((item) => {
      if (item.userWinRate > bestUserMove.userWinRate) bestUserMove = item
      if (item.aiWinRate > bestAIMove.aiWinRate) bestAIMove = item
    })

    return { moveStats: result, bestUserMove, bestAIMove }
  }, [history])

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-3.5 shadow-lg backdrop-blur-sm flex flex-col gap-2.5">
      <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800/60">
        <span className="text-xs font-mono uppercase tracking-wider text-zinc-300 flex items-center gap-1.5 font-bold">
          <BarChart3 className="w-3.5 h-3.5 text-cyan-400" /> Win Potential Analysis
        </span>
        <span className="text-[10px] font-mono text-zinc-500">
          User vs AI Win %
        </span>
      </div>

      {history.length < 2 ? (
        <p className="text-[11px] font-mono text-zinc-600 text-center py-3 italic">
          Play 2+ moves to chart move effectiveness.
        </p>
      ) : (
        <div className="space-y-2.5">
          {stats.moveStats.map((item) => (
            <div key={item.move} className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="capitalize font-semibold text-zinc-200 flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.label}
                </span>
                <span className="text-zinc-400">
                  You: <strong className="text-green-400">{item.userWinRate}%</strong> | AI: <strong className="text-purple-400">{item.aiWinRate}%</strong>
                </span>
              </div>

              {/* Dual comparative progress bar */}
              <div className="grid grid-cols-2 gap-1.5 h-2 w-full">
                {/* Player Win Potential Bar */}
                <div className="h-full bg-zinc-900 rounded-full overflow-hidden flex justify-end">
                  <div
                    className="h-full bg-gradient-to-l from-green-400 to-green-600 transition-all duration-300 rounded-full"
                    style={{ width: `${Math.max(item.userWinRate, 4)}%` }}
                    title={`Player Win Rate with ${item.label}: ${item.userWinRate}%`}
                  />
                </div>
                {/* AI Win Potential Bar */}
                <div className="h-full bg-zinc-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all duration-300 rounded-full"
                    style={{ width: `${Math.max(item.aiWinRate, 4)}%` }}
                    title={`AI Win Rate with ${item.label}: ${item.aiWinRate}%`}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Quick Win Potential Insight Tag */}
          <div className="pt-1.5 border-t border-zinc-900/80 flex items-center justify-between text-[10px] font-mono text-zinc-400">
            <span>
              Best Player Move: <strong className="text-green-400 uppercase">{stats.bestUserMove.label}</strong> ({stats.bestUserMove.userWinRate}%)
            </span>
            <span>
              Best AI Counter: <strong className="text-purple-400 uppercase">{stats.bestAIMove.label}</strong> ({stats.bestAIMove.aiWinRate}%)
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
