import { useDisplayPrefsStore } from '../store/useDisplayPrefsStore'

/** Marca de la app: fija siempre (riel de abajo), sin importar qué equipo la use. */
export const BRAND = { number: 3933, name: 'Tamán Keet' }

/** Equipo que usa la app — lo personaliza cada equipo en Ajustes (por defecto Tamán Keet 3933). */
export function useTeam() {
  const name = useDisplayPrefsStore((s) => s.teamName)
  const number = useDisplayPrefsStore((s) => s.teamNumber)
  return { name, number }
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
