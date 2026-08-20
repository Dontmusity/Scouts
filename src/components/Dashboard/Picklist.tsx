import { useRef, useState } from 'react'
import type { TeamStat } from '../../lib/teamStats'
import { usePicklistStore, type Tier } from '../../store/usePicklistStore'
import { computeMergedTiers } from '../../lib/picklistMerge'

const COLUMNS: { tier: Tier; label: string }[] = [
  { tier: 'tier1', label: 'Tier 1' },
  { tier: 'tier2', label: 'Tier 2' },
  { tier: 'tier3', label: 'Tier 3' },
  { tier: 'doNotPick', label: 'No elegir' },
  { tier: 'uncategorized', label: 'Sin clasificar' },
]

export function Picklist({ stats }: { stats: TeamStat[] }) {
  const { scoutName, setScoutName, assignments, setTierFor } = usePicklistStore()
  const [mode, setMode] = useState<'mine' | 'primary'>('mine')
  const [dragTeam, setDragTeam] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const myTiers = assignments[scoutName] ?? {}
  const mergedTiers = computeMergedTiers(assignments)
  const tierOf = (team: string): Tier => (mode === 'mine' ? myTiers[team] : mergedTiers[team]) ?? 'uncategorized'

  const editable = mode === 'mine' && scoutName.trim().length > 0

  function handleDrop(tier: Tier) {
    if (!editable || dragTeam === null) return
    setTierFor(dragTeam, tier)
    setDragTeam(null)
  }

  // Las 5 columnas son más anchas que una pantalla de celular — sin esto, no
  // hay forma de arrastrar una tarjeta desde "Sin clasificar" hasta "Tier 1"
  // en un teléfono, porque quedan fuera de la vista al mismo tiempo.
  function handleContainerDragOver(e: React.DragEvent) {
    if (!editable) return
    const el = scrollRef.current
    if (!el) return
    const { left, right } = el.getBoundingClientRect()
    const EDGE = 60
    const SPEED = 16
    if (e.clientX - left < EDGE) el.scrollLeft -= SPEED
    else if (right - e.clientX < EDGE) el.scrollLeft += SPEED
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={scoutName}
          onChange={(e) => setScoutName(e.target.value)}
          placeholder="Tu nombre"
          className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-600"
        />
        <div className="flex rounded-lg bg-slate-800 p-1 text-sm">
          <button
            type="button"
            onClick={() => setMode('mine')}
            className={`rounded-md px-3 py-1.5 font-semibold ${mode === 'mine' ? 'bg-sky-600 text-white' : 'text-slate-400'}`}
          >
            Mi lista
          </button>
          <button
            type="button"
            onClick={() => setMode('primary')}
            className={`rounded-md px-3 py-1.5 font-semibold ${mode === 'primary' ? 'bg-sky-600 text-white' : 'text-slate-400'}`}
          >
            Lista primaria (combinada)
          </button>
        </div>
      </div>

      {mode === 'mine' && !editable && (
        <p className="text-sm text-amber-400">Escribe tu nombre para poder clasificar equipos.</p>
      )}

      <div ref={scrollRef} onDragOver={handleContainerDragOver} className="flex gap-3 overflow-x-auto pb-2 snap-x">
        {COLUMNS.map(({ tier, label }) => {
          const teams = stats.filter((s) => tierOf(s.teamNumber) === tier)
          return (
            <div
              key={tier}
              onDragOver={(e) => editable && e.preventDefault()}
              onDrop={() => handleDrop(tier)}
              className="w-64 shrink-0 snap-start rounded-lg bg-slate-950 p-2"
            >
              <h3 className="mb-2 px-1 text-sm font-bold uppercase tracking-wide text-slate-400">
                {label} <span className="text-slate-600">({teams.length})</span>
              </h3>
              <div className="space-y-2">
                {teams.map((stat) => (
                  <div
                    key={stat.teamNumber}
                    draggable={editable}
                    onDragStart={() => setDragTeam(stat.teamNumber)}
                    className={`rounded-lg bg-slate-800 p-3 ${
                      editable ? 'cursor-grab active:cursor-grabbing' : 'opacity-70'
                    } ${!editable && mode === 'primary' ? 'ring-1 ring-slate-700' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-white">Equipo {stat.teamNumber}</div>
                        <div className="text-sm text-slate-400">
                          prom. {stat.totalAvg.toFixed(1)} · {stat.matchesPlayed} partidos
                        </div>
                      </div>
                      {/* El drag HTML5 nativo no funciona por gestos táctiles en
                          iOS Safari / Chrome Android — este <select> nativo es
                          la forma real de reclasificar en un teléfono. */}
                      {editable && (
                        <select
                          value={tier}
                          onChange={(e) => setTierFor(stat.teamNumber, e.target.value as Tier)}
                          className="shrink-0 rounded-md bg-slate-700 px-2 py-1 text-xs text-white"
                        >
                          {COLUMNS.map((c) => (
                            <option key={c.tier} value={c.tier}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
