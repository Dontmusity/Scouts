import type { MatchEntry } from './db'
import type { GameField } from '../types/gameConfig'

export interface TeamStat {
  teamNumber: string
  matchesPlayed: number
  avgByField: Record<string, number>
  /**
   * ponytail: naive equal-weight sum of every numeric field as a stand-in
   * score. Real events should assign point values per the game manual —
   * swap in a weighted formula if picklist accuracy matters more than speed.
   */
  totalAvg: number
  stdDev: number
  /** Desviación estándar por rubro — qué tan consistente es el equipo en cada campo. */
  stdDevByField: Record<string, number>
}

const numericTypes: GameField['type'][] = ['counter', 'rating', 'toggle']

/** Los mismos campos que promedia computeTeamStats — para poblar selectores de rubro en la UI. */
export function numericFieldsOf(fields: GameField[]): GameField[] {
  return fields.filter((f) => numericTypes.includes(f.type) || (f.type === 'number' && f.countInStats))
}

export function computeTeamStats(matches: MatchEntry[], fields: GameField[]): TeamStat[] {
  // "number" solo cuenta si se marcó countInStats: la mayoría son
  // identificadores (equipos aliados), no puntaje.
  const numericFields = numericFieldsOf(fields)
  const byTeam = new Map<string, MatchEntry[]>()
  for (const m of matches) {
    const list = byTeam.get(m.teamNumber) ?? []
    list.push(m)
    byTeam.set(m.teamNumber, list)
  }

  return Array.from(byTeam.entries())
    .map(([teamNumber, teamMatches]) => {
      const avgByField: Record<string, number> = {}
      const stdDevByField: Record<string, number> = {}
      for (const field of numericFields) {
        const values = teamMatches.map((m) => toNumber(m.values[field.id]))
        avgByField[field.id] = average(values)
        stdDevByField[field.id] = stdDev(values)
      }
      const totals = teamMatches.map((m) =>
        numericFields.reduce((sum, f) => sum + toNumber(m.values[f.id]), 0),
      )
      return {
        teamNumber,
        matchesPlayed: teamMatches.length,
        avgByField,
        totalAvg: average(totals),
        stdDev: stdDev(totals),
        stdDevByField,
      }
    })
    .sort((a, b) => b.totalAvg - a.totalAvg)
}

function toNumber(v: number | boolean | string | undefined): number {
  if (typeof v === 'number') return v
  if (typeof v === 'boolean') return v ? 1 : 0
  return 0
}

export function average(nums: number[]): number {
  if (nums.length === 0) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

export function stdDev(nums: number[]): number {
  if (nums.length < 2) return 0
  const avg = average(nums)
  const variance = average(nums.map((n) => (n - avg) ** 2))
  return Math.sqrt(variance)
}
