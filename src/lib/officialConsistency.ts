import type { AllianceBreakdown, EventMatch } from '../types/tba'
import { stdDev } from './teamStats'

export interface OfficialTeamConsistency {
  teamNumber: number
  matchesPlayed: number
  /** Desviación estándar del puntaje total de la alianza en los partidos que jugó este equipo. */
  totalStdDev: number
  /** Desviación estándar por cada clave numérica del desglose oficial disponible (auto/teleop/…). */
  byBreakdownKey: Record<string, number>
}

/**
 * Consistencia por equipo a partir de resultados oficiales ya sincronizados
 * (sin depender de scouting manual): qué tan parejo es el puntaje de la
 * alianza en los partidos donde jugó cada equipo.
 * ponytail: mide la variación de la alianza completa, no aislada al equipo —
 * es la misma limitación que tiene el OPR al repartir crédito por alianza.
 */
export function computeOfficialConsistency(matches: EventMatch[]): OfficialTeamConsistency[] {
  const byTeam = new Map<number, { totals: number[]; breakdowns: Record<string, number[]> }>()

  function record(teamNumbers: number[], score: number, breakdown: AllianceBreakdown | null) {
    for (const t of teamNumbers) {
      const entry = byTeam.get(t) ?? { totals: [], breakdowns: {} }
      entry.totals.push(score)
      if (breakdown) {
        for (const [k, v] of Object.entries(breakdown)) {
          if (typeof v !== 'number') continue
          const list = entry.breakdowns[k] ?? []
          list.push(v)
          entry.breakdowns[k] = list
        }
      }
      byTeam.set(t, entry)
    }
  }

  for (const m of matches) {
    if (m.redScore !== null) record(m.red, m.redScore, m.redBreakdown)
    if (m.blueScore !== null) record(m.blue, m.blueScore, m.blueBreakdown)
  }

  return Array.from(byTeam.entries()).map(([teamNumber, { totals, breakdowns }]) => ({
    teamNumber,
    matchesPlayed: totals.length,
    totalStdDev: stdDev(totals),
    byBreakdownKey: Object.fromEntries(Object.entries(breakdowns).map(([k, vs]) => [k, stdDev(vs)])),
  }))
}
