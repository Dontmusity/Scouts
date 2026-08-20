import { useMemo } from 'react'
import { useEventStore } from '../store/useEventStore'
import { useScoutStore } from '../store/useScoutStore'

/**
 * Tira de botones con los equipos del evento sincronizado, filtrada por lo que
 * ya se escribió. Reemplaza al <datalist>, que en Safari/iPad es invisible
 * hasta escribir y poco fiable en inputs numéricos.
 */
export function TeamPicker({ value, onPick }: { value: string; onPick: (teamNumber: string) => void }) {
  const eventTeams = useEventStore((s) => s.teams)
  const matches = useScoutStore((s) => s.matches)

  const teams = useMemo(() => {
    // Sin evento sincronizado, sugerimos los equipos ya scouteados en el dispositivo.
    const numbers = eventTeams.length
      ? eventTeams.map((t) => String(t.teamNumber))
      : [...new Set(matches.map((m) => m.teamNumber))].sort((a, b) => Number(a) - Number(b))
    return numbers.filter((n) => n.startsWith(value.trim()))
  }, [eventTeams, matches, value])

  if (teams.length === 0) return null

  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 py-1">
      {teams.map((n) => (
        <button
          key={n}
          type="button"
          className={`shrink-0 rounded-lg px-3 py-2 text-sm font-bold ${
            n === value.trim() ? 'bg-sky-600 text-white' : 'bg-slate-700 text-slate-200'
          }`}
          onClick={() => onPick(n)}
        >
          {n}
        </button>
      ))}
    </div>
  )
}
