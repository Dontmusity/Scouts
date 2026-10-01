import { useMemo, useState } from 'react'
import type { PredictorTeam } from './MatchPredictor'
import { usePicklistStore, type Tier } from '../../store/usePicklistStore'
import { useEventStore } from '../../store/useEventStore'
import { computeMergedTiers } from '../../lib/picklistMerge'

// "Sin clasificar" primero: ahí caen todos los equipos por defecto — al
// final de la lista quedaba fuera de pantalla y parecía que no había equipos.
const COLUMNS: { tier: Tier; label: string; color: string }[] = [
  { tier: 'uncategorized', label: 'Sin clasificar', color: 'text-n75' },
  { tier: 'tier1', label: 'Tier 1', color: 'text-acc-t' },
  { tier: 'tier2', label: 'Tier 2', color: '' },
  { tier: 'tier3', label: 'Tier 3', color: '' },
  { tier: 'doNotPick', label: 'No elegir', color: 'text-bad' },
]

export function Picklist({ teams: roster, eventId }: { teams: PredictorTeam[]; eventId: string }) {
  const { scoutName, setScoutName, assignments, setTierFor } = usePicklistStore()
  const eventTeams = useEventStore((s) => s.teams)
  const [mode, setMode] = useState<'mine' | 'primary'>('mine')
  const [dragTeam, setDragTeam] = useState<string | null>(null)

  const namesByNumber = useMemo(() => {
    const m = new Map<string, string>()
    for (const t of eventTeams) m.set(String(t.teamNumber), t.name)
    return m
  }, [eventTeams])

  // Clasificaciones guardadas por evento: sin esto, los tiers de un evento
  // anterior (mismo número de equipo, otra competencia) se colaban en la
  // "Lista primaria" del evento nuevo.
  const keyFor = (teamNumber: string) => `${eventId}:${teamNumber}`

  const myTiers = assignments[scoutName] ?? {}
  const mergedTiers = computeMergedTiers(assignments)
  const tierOf = (team: string): Tier => (mode === 'mine' ? myTiers[team] : mergedTiers[team]) ?? 'uncategorized'

  const editable = mode === 'mine' && scoutName.trim().length > 0

  function handleDrop(tier: Tier) {
    if (!editable || dragTeam === null) return
    setTierFor(dragTeam, tier)
    setDragTeam(null)
  }

  // Cuántos scouts clasificaron al equipo (vista combinada)
  const votes = (key: string) => Object.values(assignments).filter((a) => a[key] && a[key] !== 'uncategorized').length
  const seg = (on: boolean) => `min-h-[38px] rounded-lg px-3 text-[13px] font-bold ${on ? 'bg-n27 text-fg' : 'text-n75'}`

  return (
    <section className="col-span-full flex flex-col gap-3.5 rounded-[18px] bg-n215 p-[18px]">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-col">
          <span className="text-lg font-bold">PickList</span>
          <span className="text-[13px] text-n75">
            {mode === 'primary'
              ? 'Suma de las listas de todos los scouts'
              : editable
                ? 'Arrastra las tarjetas (compu) o elige la columna de cada equipo'
                : 'Escribe tu nombre para poder clasificar equipos'}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={scoutName}
            onChange={(e) => setScoutName(e.target.value)}
            placeholder="Tu nombre"
            className="h-11 w-[150px] rounded-[10px] border border-n33 bg-n19 px-3 text-fg focus:outline-2 focus:outline-acc"
          />
          <div className="flex rounded-[10px] bg-n19 p-[3px]">
            <button type="button" className={seg(mode === 'mine')} onClick={() => setMode('mine')}>
              Mi lista
            </button>
            <button type="button" className={seg(mode === 'primary')} onClick={() => setMode('primary')}>
              Combinada
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-2.5">
        {COLUMNS.map(({ tier, label, color }) => {
          const teams = roster.filter((t) => tierOf(keyFor(t.teamNumber)) === tier)
          return (
            <div
              key={tier}
              onDragOver={(e) => editable && e.preventDefault()}
              onDrop={() => handleDrop(tier)}
              className="flex min-h-[120px] flex-col gap-2 rounded-[14px] bg-n19 p-2.5"
            >
              <div className="flex items-center justify-between px-1 pb-1 pt-0.5">
                <span className={`text-sm font-extrabold ${color}`}>{label}</span>
                <span className="font-mono text-xs text-n75">{teams.length}</span>
              </div>
              {teams.map((t) => {
                const key = keyFor(t.teamNumber)
                const v = mode === 'primary' ? votes(key) : 0
                return (
                  <div
                    key={t.teamNumber}
                    draggable={editable}
                    onDragStart={() => setDragTeam(key)}
                    className={`flex flex-col gap-1.5 rounded-[10px] bg-n27 px-3 py-2.5 ${editable ? 'cursor-grab active:cursor-grabbing' : ''}`}
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono font-bold">{t.teamNumber}</span>
                      <span className="flex-1 truncate text-[13px]">{namesByNumber.get(t.teamNumber)}</span>
                      {v > 0 && <span className="text-[11px] text-n75">{v} votos</span>}
                    </div>
                    {/* El drag HTML5 nativo no funciona por gestos táctiles en
                        iOS Safari / Chrome Android — este <select> nativo es
                        la forma real de reclasificar en un teléfono. */}
                    {editable && (
                      <select
                        value={tier}
                        onChange={(e) => setTierFor(key, e.target.value as Tier)}
                        className="h-10 rounded-lg bg-n215 px-2 text-[13px] font-semibold text-fg desk:hidden"
                      >
                        {COLUMNS.map((c) => (
                          <option key={c.tier} value={c.tier}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </section>
  )
}
