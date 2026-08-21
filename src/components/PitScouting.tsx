import { useMemo, useState } from 'react'
import { useEventStore } from '../store/useEventStore'
import { useScoutStore } from '../store/useScoutStore'
import { usePitStore } from '../store/usePitStore'
import { useNexusStore } from '../store/useNexusStore'
import { FieldRenderer } from './FieldRenderer'
import type { PitReport } from '../lib/db'
import type { GameField } from '../types/gameConfig'

interface Team {
  teamNumber: string
  name: string
}

export function PitScouting() {
  const config = useScoutStore((s) => s.config)
  const eventTeams = useEventStore((s) => s.teams)
  const matches = useScoutStore((s) => s.matches)
  const reports = usePitStore((s) => s.reports)
  const saveReport = usePitStore((s) => s.saveReport)
  const pitLocations = useNexusStore((s) => s.pits)
  const [activeTeam, setActiveTeam] = useState<Team | null>(null)

  const teams = useMemo<Team[]>(() => {
    if (eventTeams.length) {
      return eventTeams
        .map((t) => ({ teamNumber: String(t.teamNumber), name: t.name }))
        .sort((a, b) => Number(a.teamNumber) - Number(b.teamNumber))
    }
    // Sin evento sincronizado, listamos los equipos ya vistos en partidos escaneados.
    const numbers = [...new Set(matches.map((m) => m.teamNumber))].sort((a, b) => Number(a) - Number(b))
    return numbers.map((n) => ({ teamNumber: n, name: '' }))
  }, [eventTeams, matches])

  const reportByTeam = useMemo(() => {
    const map = new Map<string, PitReport>()
    for (const r of reports) map.set(r.teamNumber, r)
    return map
  }, [reports])

  const pitFields = config.fields.filter((f) => f.phase === 'pit')

  return (
    <div className="mx-auto max-w-2xl p-4 pb-8">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-sky-400">Pit Scouting</h2>

      {teams.length === 0 && (
        <p className="text-center text-slate-500">
          Sin equipos todavía. Sincroniza un evento en la pestaña Eventos o escanea partidos.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {teams.map((team) => {
          const scouted = reportByTeam.has(team.teamNumber)
          return (
            <button
              key={team.teamNumber}
              className="flex flex-col items-start gap-1 rounded-xl bg-slate-800 p-3 text-left active:scale-95"
              onClick={() => setActiveTeam(team)}
            >
              <span className="text-lg font-bold text-white">{team.teamNumber}</span>
              {team.name && <span className="truncate text-xs text-slate-400">{team.name}</span>}
              {pitLocations[team.teamNumber] && (
                <span className="truncate text-xs font-bold text-sky-400">📍 {pitLocations[team.teamNumber]}</span>
              )}
              <span
                className={`mt-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  scouted ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400'
                }`}
              >
                {scouted ? '✓ Escuteado' : 'Sin escutear'}
              </span>
            </button>
          )
        })}
      </div>

      {activeTeam && (
        <PitForm
          team={activeTeam}
          pitLocation={pitLocations[activeTeam.teamNumber]}
          fields={pitFields}
          existing={reportByTeam.get(activeTeam.teamNumber)}
          gameId={config.gameId}
          onSave={saveReport}
          onClose={() => setActiveTeam(null)}
        />
      )}
    </div>
  )
}

function PitForm({
  team,
  pitLocation,
  fields,
  existing,
  gameId,
  onSave,
  onClose,
}: {
  team: Team
  pitLocation?: string
  fields: GameField[]
  existing: PitReport | undefined
  gameId: string
  onSave: (report: PitReport) => Promise<void>
  onClose: () => void
}) {
  const [values, setValues] = useState<Record<string, number | boolean | string>>(existing?.values ?? {})
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    // guarda contra doble-tap, mismo patrón que MatchForm
    if (saving) return
    setSaving(true)
    const report: PitReport = {
      id: `${gameId}_${team.teamNumber}`,
      gameId,
      teamNumber: team.teamNumber,
      values,
      updatedAt: Date.now(),
    }
    await onSave(report)
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-slate-950 p-4">
      <div className="mx-auto w-full max-w-2xl space-y-6 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">Equipo {team.teamNumber}</h3>
            {team.name && <p className="text-sm text-slate-400">{team.name}</p>}
            {pitLocation && <p className="text-sm font-bold text-sky-400">📍 Pit {pitLocation}</p>}
          </div>
          <button className="rounded-lg bg-slate-700 px-3 py-2 font-bold text-white" onClick={onClose}>
            Cerrar
          </button>
        </div>

        {fields.map((field) => (
          <div key={field.id}>
            <label className="mb-1 block text-sm text-slate-300">{field.label}</label>
            <FieldRenderer
              field={field}
              value={values[field.id]}
              onChange={(v) => setValues((prev) => ({ ...prev, [field.id]: v }))}
            />
          </div>
        ))}

        <button
          className="w-full rounded-xl bg-emerald-600 py-4 text-xl font-bold text-white shadow-lg disabled:opacity-40"
          disabled={saving}
          onClick={handleSave}
        >
          Guardar
        </button>
      </div>
    </div>
  )
}
