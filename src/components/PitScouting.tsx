import { useMemo, useState } from 'react'
import { useEventStore } from '../store/useEventStore'
import { useScoutStore } from '../store/useScoutStore'
import { usePitStore } from '../store/usePitStore'
import { useNexusStore } from '../store/useNexusStore'
import { FieldRenderer } from './FieldRenderer'
import { TEAMS } from '../data/team'
import { CheckCircleIcon, CircleDashedIcon, MapPinIcon, WrenchIcon, XIcon } from '@phosphor-icons/react'
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
  const [filter, setFilter] = useState<'todos' | 'faltan' | 'hechos'>('todos')
  const us = String(TEAMS[config.mode].number)
  const done = teams.filter((t) => reportByTeam.has(t.teamNumber)).length
  const shown = teams.filter((t) =>
    filter === 'todos' ? true : filter === 'faltan' ? !reportByTeam.has(t.teamNumber) : reportByTeam.has(t.teamNumber),
  )

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-5 p-4 pb-8 text-left sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-[32px] font-extrabold [font-stretch:75%]">Pit</h1>
        <span className="text-sm text-n75">
          {done} de {teams.length} escuteados
        </span>
      </div>

      {teams.length > 0 ? (
        <>
          <div className="h-2 overflow-hidden rounded-full bg-n27">
            <div className="h-full bg-grn" style={{ width: `${(done / teams.length) * 100}%` }} />
          </div>
          <div className="flex gap-1.5">
            {(
              [
                ['todos', 'Todos'],
                ['faltan', 'Faltan'],
                ['hechos', 'Hechos'],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                className={`min-h-11 rounded-full border px-4 text-sm font-bold ${filter === k ? 'border-acc bg-acc text-on-acc' : 'border-n33'}`}
                onClick={() => setFilter(k)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5">
            {shown.map((team) => {
              const scouted = reportByTeam.has(team.teamNumber)
              return (
                <button
                  key={team.teamNumber}
                  className={`flex min-h-[108px] flex-col items-start gap-1.5 rounded-2xl border bg-n215 p-3.5 text-left hover:bg-n24 ${team.teamNumber === us ? 'border-acc' : 'border-n215'}`}
                  onClick={() => setActiveTeam(team)}
                >
                  <span className="font-mono text-[22px] font-bold">{team.teamNumber}</span>
                  <span className="flex-1 text-sm font-semibold">{team.name}</span>
                  {pitLocations[team.teamNumber] && (
                    <span className="flex items-center gap-1 text-xs font-bold text-acc-t">
                      <MapPinIcon size={14} weight="fill" />
                      {pitLocations[team.teamNumber]}
                    </span>
                  )}
                  <span className={`flex items-center gap-1.5 text-[13px] font-bold ${scouted ? 'text-grn' : 'text-n75'}`}>
                    {scouted ? <CheckCircleIcon size={16} weight="fill" /> : <CircleDashedIcon size={16} />}
                    {scouted ? 'Escuteado' : 'Sin escutear'}
                  </span>
                </button>
              )
            })}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-start gap-3 rounded-[18px] border border-dashed border-n33 px-6 py-8">
          <WrenchIcon size={40} weight="duotone" className="text-n75" />
          <p className="text-xl font-bold">No hay equipos del evento</p>
          <p className="max-w-[46ch] text-n75">
            Sincroniza el evento en Eventos para que aparezcan aquí los equipos a escutear, o escanea partidos.
          </p>
        </div>
      )}

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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-6" onClick={onClose}>
      <div
        className="flex max-h-full w-full max-w-[560px] flex-col gap-[18px] overflow-auto rounded-t-[22px] bg-n215 p-5 sm:rounded-[22px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2.5">
          <div>
            <p className="text-[26px] font-extrabold [font-stretch:80%]">Equipo {team.teamNumber}</p>
            {team.name && <p className="text-n75">{team.name}</p>}
            {pitLocation && <p className="text-sm font-bold text-acc-t">Pit {pitLocation}</p>}
          </div>
          <button aria-label="Cerrar" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-n27" onClick={onClose}>
            <XIcon size={20} weight="bold" />
          </button>
        </div>

        {fields.map((field) => (
          <div key={field.id} className="flex flex-col gap-2.5">
            <span className="font-semibold">{field.label}</span>
            <FieldRenderer
              field={field}
              value={values[field.id]}
              onChange={(v) => setValues((prev) => ({ ...prev, [field.id]: v }))}
            />
          </div>
        ))}

        <button
          className="min-h-[60px] shrink-0 rounded-[14px] bg-grn text-[17px] font-extrabold text-on-grn disabled:opacity-40"
          disabled={saving}
          onClick={handleSave}
        >
          Guardar pit
        </button>
      </div>
    </div>
  )
}
