function erf(x: number): number {
  // Abramowitz & Stegun 7.1.26 approximation (max error ~1.5e-7) — no erf in Math.
  const sign = x < 0 ? -1 : 1
  const ax = Math.abs(x)
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911
  const t = 1 / (1 + p * ax)
  const y = 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-ax * ax)
  return sign * y
}

function normalCdf(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2))
}

/**
 * Probabilidad (0-1) de que la alianza "red" gane, modelando el puntaje de
 * cada alianza como normal con media = suma de promedios y varianza = suma
 * de stdDev^2 de sus equipos (asume robots independientes entre sí).
 * ponytail: aproximación estadística simple (como el modelo de FTC
 * Birdwatch), no un ajuste OPR por mínimos cuadrados — swap in un OPR real
 * si el evento tiene partidos suficientes para que valga la pena calcularlo.
 */
export function winProbability(redMean: number, redVar: number, blueMean: number, blueVar: number): number {
  const totalVar = Math.max(redVar + blueVar, 1e-6) // evita división por cero con <2 partidos escaneados
  const z = (redMean - blueMean) / Math.sqrt(totalVar)
  return normalCdf(z)
}

if (import.meta.env.DEV) {
  console.assert(Math.abs(normalCdf(0) - 0.5) < 1e-6, 'normalCdf(0) debe ser 0.5')
  console.assert(normalCdf(5) > 0.999, 'normalCdf grande debe acercarse a 1')
  console.assert(winProbability(10, 4, 5, 4) > 0.5, 'la alianza con mayor media debe tener >50% de probabilidad')
  console.assert(
    Math.abs(winProbability(10, 4, 10, 4) - 0.5) < 1e-6,
    'medias iguales deben dar 50/50',
  )
}
