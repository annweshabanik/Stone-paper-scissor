import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText, Output } from 'ai'
import { z } from 'zod'
import { AI_PERSONAS } from './aiPersonas'
import type { AIPersonaKey } from './aiPersonas'

export type Move = 'stone' | 'paper' | 'scissor'

export interface GameRound {
  id: string
  roundNumber: number
  userMove: Move
  aiMove: Move
  result: 'win' | 'loss' | 'draw'
  aiReasoning?: string
  confidence?: number
  timestamp: number
  isMultiplier?: boolean
}

export interface AIPreparedMove {
  move: Move
  reasoning: string
  confidence: number
}

export interface BestScoreRecord {
  highestPlayerScore: number
  bestWinStreak: number
  fastest10MatchWins: number
  totalMatchesFinished: number
}

const MoveSchema = z.object({
  move: z.enum(['stone', 'paper', 'scissor']).describe('Counter move to play: stone, paper, or scissor'),
  predictedUserMove: z.enum(['stone', 'paper', 'scissor']).describe('The player move you predict next'),
  reasoning: z.string().describe('Extremely brief 1-line tactical prediction in persona voice (max 15 words)'),
  confidence: z.number().min(0).max(100).describe('Confidence percentage 0-100'),
})

// Initialize Google AI with the Gemini key
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ''
const google = createGoogleGenerativeAI({ apiKey })

const FALLBACK_MOVES: Move[] = ['stone', 'paper', 'scissor']
function getRandomFallback(personaKey: AIPersonaKey = 'grandmaster'): AIPreparedMove {
  const move = FALLBACK_MOVES[Math.floor(Math.random() * FALLBACK_MOVES.length)]
  const persona = AI_PERSONAS[personaKey]
  const randomTaunt =
    persona.taunts.draw[Math.floor(Math.random() * persona.taunts.draw.length)]
  return {
    move,
    reasoning: randomTaunt,
    confidence: 33,
  }
}

/**
 * Pre-computes the next AI move before the user clicks.
 * Sends the moves of the current 10-move round to the LLM.
 * Adapts to selected Persona personality and temperature.
 */
export async function precomputeAIMove(
  history: GameRound[],
  personaKey: AIPersonaKey = 'grandmaster'
): Promise<AIPreparedMove> {
  const persona = AI_PERSONAS[personaKey]
  const last10 = history.slice(-10)

  const historyRepresentation =
    last10.length === 0
      ? 'Move 1 / 10 (First move of round)'
      : last10
          .map((r, idx) => `M${idx + 1}: P=${r.userMove}, AI=${r.aiMove} (${r.result})`)
          .join(' | ')

  const prompt = `${persona.promptStyle}
Game: Stone Paper Scissors. Match: 10 moves.
Rules: stone>scissor, scissor>paper, paper>stone.
Current history (${last10.length}/10):
${historyRepresentation}

Predict the player's next move and choose your counter move. Keep your reasoning strictly 1 sentence (under 14 words).`

  try {
    const result = await generateText({
      model: google('gemini-3.5-flash-lite'),
      output: Output.object({
        schema: MoveSchema,
      }),
      prompt,
      temperature: persona.temperature,
    })

    if (result.output && result.output.move) {
      return {
        move: result.output.move,
        reasoning:
          result.output.reasoning ||
          `Countering predicted ${result.output.predictedUserMove}.`,
        confidence: Math.round(result.output.confidence || 65),
      }
    }
    return getRandomFallback(personaKey)
  } catch (error) {
    console.error('Failed to precompute AI move via Gemini:', error)
    return getRandomFallback(personaKey)
  }
}

export function determineWinner(user: Move, ai: Move): 'win' | 'loss' | 'draw' {
  if (user === ai) return 'draw'
  if (
    (user === 'stone' && ai === 'scissor') ||
    (user === 'paper' && ai === 'stone') ||
    (user === 'scissor' && ai === 'paper')
  ) {
    return 'win'
  }
  return 'loss'
}
