import type { EventMatch } from '../types/tba'

export interface MatchAutofill {
  /** Compañeros de alianza (sin el equipo escrito), en el orden del cronograma oficial. */
  allies: number[]
  /** Puntaje final oficial de la alianza; null si el partido aún no se jugó. */
  score: number | null
  /** Puntaje final oficial de la alianza contraria; null si el partido aún no se jugó. */
  opponentScore: number | null
}

/**
 * Busca el partido oficial (ya sincronizado desde TBA/FTCScout) que coincide
 * con el # de partido y # de equipo escritos a mano por el scout.
 */
export function findMatchAutofill(
  eventMatches: EventMatch[],
  matchNumber: string,
  teamNumber: string,
): MatchAutofill | null {
  const mNum = Number(matchNumber.trim())
  const tNum = Number(teamNumber.trim())
  if (!Number.isFinite(mNum) || !Number.isFinite(tNum)) return null

  const match = eventMatches.find(
    (m) => m.matchNumber === mNum && (m.red.includes(tNum) || m.blue.includes(tNum)),
  )
  if (!match) return null

  const isRed = match.red.includes(tNum)
  const alliance = isRed ? match.red : match.blue
  return {
    allies: alliance.filter((t) => t !== tNum),
    score: isRed ? match.redScore : match.blueScore,
    opponentScore: isRed ? match.blueScore : match.redScore,
  }
}
