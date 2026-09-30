import type { GameConfig } from '../types/gameConfig'

/** Identidad por programa. Cambia esto para usar la app con otro equipo. */
export const TEAMS: Record<GameConfig['mode'], { number: number; name: string }> = {
  FRC: { number: 3933, name: 'Tamán Keet' },
  FTC: { number: 15771, name: 'Primalas' },
}

/** Numerales mayas (base 20) — glifos U+1D2E0…U+1D2F3. 3933 → 9·16·13. */
export function mayaDigits(n: number): number[] {
  const d: number[] = []
  do {
    d.unshift(n % 20)
    n = Math.floor(n / 20)
  } while (n > 0)
  return d
}

export const mayaGlyphs = (n: number) => mayaDigits(n).map((d) => String.fromCodePoint(0x1d2e0 + d))

if (import.meta.env.DEV) {
  console.assert(mayaDigits(3933).join() === '9,16,13' && mayaDigits(15771).join() === '1,19,8,11', 'mayaDigits')
}
