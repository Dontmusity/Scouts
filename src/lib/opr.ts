import type { EventMatch } from '../types/tba'

/**
 * Offensive Power Rating por mínimos cuadrados sobre los partidos oficiales
 * ya jugados y sincronizados del evento: resuelve, por equipo, la
 * contribución de puntos que mejor explica los puntajes de alianza
 * observados (Aᵀx = b sobre 1 fila por alianza jugada).
 * ponytail: con pocos partidos jugados el sistema queda subdeterminado y el
 * resultado es ruidoso — normal al inicio de un evento, mejora con más partidos.
 */
export function computeOpr(matches: EventMatch[]): Map<number, number> {
  const played = matches.filter((m) => m.redScore !== null && m.blueScore !== null)
  const teamNumbers = Array.from(new Set(played.flatMap((m) => [...m.red, ...m.blue]))).sort((a, b) => a - b)
  const n = teamNumbers.length
  if (n === 0) return new Map()
  const index = new Map(teamNumbers.map((t, i) => [t, i]))

  // Ecuaciones normales (AᵀA) x = Aᵀb, acumuladas fila por fila sin construir A completo.
  const AtA: number[][] = Array.from({ length: n }, () => Array(n).fill(0))
  const Atb: number[] = Array(n).fill(0)

  function addAlliance(teamsOnAlliance: number[], score: number) {
    const cols = teamsOnAlliance.map((t) => index.get(t)!)
    for (const i of cols) {
      Atb[i] += score
      for (const j of cols) AtA[i][j] += 1
    }
  }

  for (const m of played) {
    addAlliance(m.red, m.redScore as number)
    addAlliance(m.blue, m.blueScore as number)
  }

  const x = solveLinearSystem(AtA, Atb)
  return new Map(teamNumbers.map((t, i) => [t, x[i]]))
}

/**
 * Varianza de (puntaje real − puntaje predicho por OPR) sobre todas las
 * alianzas jugadas — mide qué tan bien ajusta el modelo, para usarla como
 * incertidumbre en la probabilidad de victoria (ver winProbability).
 */
export function computeOprResidualVariance(matches: EventMatch[], opr: Map<number, number>): number {
  const residuals: number[] = []
  for (const m of matches) {
    if (m.redScore === null || m.blueScore === null) continue
    const predict = (teams: number[]) => teams.reduce((s, t) => s + (opr.get(t) ?? 0), 0)
    residuals.push(m.redScore - predict(m.red))
    residuals.push(m.blueScore - predict(m.blue))
  }
  if (residuals.length < 2) return 0
  const mean = residuals.reduce((a, b) => a + b, 0) / residuals.length
  return residuals.reduce((a, b) => a + (b - mean) ** 2, 0) / residuals.length
}

/** Eliminación gaussiana con pivoteo parcial — evita sumar una dependencia de álgebra lineal para esto. */
function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = b.length
  const M = A.map((row, i) => [...row, b[i]])

  for (let col = 0; col < n; col++) {
    let pivot = col
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r
    }
    ;[M[col], M[pivot]] = [M[pivot], M[col]]

    if (Math.abs(M[col][col]) < 1e-9) continue // fila dependiente (equipo sin partidos que lo aíslen) — su OPR queda en 0
    for (let r = 0; r < n; r++) {
      if (r === col) continue
      const factor = M[r][col] / M[col][col]
      for (let c = col; c <= n; c++) M[r][c] -= factor * M[col][c]
    }
  }

  return M.map((row, i) => (Math.abs(row[i]) < 1e-9 ? 0 : row[n] / row[i]))
}

if (import.meta.env.DEV) {
  const testMatches: EventMatch[] = [
    { matchNumber: 1, red: [1, 2], blue: [2, 3], redScore: 30, blueScore: 25, redBreakdown: null, blueBreakdown: null },
    { matchNumber: 2, red: [1, 3], blue: [1, 2], redScore: 28, blueScore: 32, redBreakdown: null, blueBreakdown: null },
    { matchNumber: 3, red: [2, 3], blue: [1, 3], redScore: 27, blueScore: 26, redBreakdown: null, blueBreakdown: null },
  ]
  const opr = computeOpr(testMatches)
  const variance = computeOprResidualVariance(testMatches, opr)
  console.assert(opr.size === 3, 'computeOpr debe devolver un valor por cada equipo visto en el cronograma')
  console.assert(Number.isFinite(variance) && variance >= 0, 'la varianza residual debe ser un número finito no negativo')
  console.assert(computeOpr([]).size === 0, 'sin partidos jugados no hay OPR que calcular')
}
