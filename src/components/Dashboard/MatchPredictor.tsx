import { useState } from 'react'
import type { TeamStat } from '../../lib/teamStats'

function AllianceSelect({
  label,
  slots,
  teams,
  onChange,
}: {
  label: string
  slots: string[]
  teams: TeamStat[]
  onChange: (i: number, team: string) => void
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">{label}</h3>
      {slots.map((value, i) => (
        <select
          key={i}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white"
          value={value}
          onChange={(e) => onChange(i, e.target.value)}
        >
          <option value="">— Equipo —</option>
          {teams.map((t) => (
            <option key={t.teamNumber} value={t.teamNumber}>
              {t.teamNumber} (prom. {t.totalAvg.toFixed(1)})
            </option>
          ))}
        </select>
      ))}
    </div>
  )
}

export function MatchPredictor({ stats, allianceSize }: { stats: TeamStat[]; allianceSize: 2 | 3 }) {
  const [red, setRed] = useState<string[]>(Array(allianceSize).fill(''))
  const [blue, setBlue] = useState<string[]>(Array(allianceSize).fill(''))

  const byTeam = new Map(stats.map((s) => [s.teamNumber, s.totalAvg]))
  const sum = (teams: string[]) => teams.reduce((acc, t) => acc + (byTeam.get(t) ?? 0), 0)
  const redScore = sum(red)
  const blueScore = sum(blue)
  const hasPicks = red.some(Boolean) && blue.some(Boolean)

  function setSlot(setter: typeof setRed, i: number, team: string) {
    setter((prev) => prev.map((t, idx) => (idx === i ? team : t)))
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <AllianceSelect label="Alianza roja" slots={red} teams={stats} onChange={(i, t) => setSlot(setRed, i, t)} />
        <AllianceSelect label="Alianza azul" slots={blue} teams={stats} onChange={(i, t) => setSlot(setBlue, i, t)} />
      </div>

      {hasPicks && (
        <div className="rounded-lg bg-slate-800 p-4 text-center">
          <p className="text-2xl font-bold">
            <span className={redScore >= blueScore ? 'text-red-400' : 'text-slate-500'}>{redScore.toFixed(1)}</span>
            {' — '}
            <span className={blueScore >= redScore ? 'text-blue-400' : 'text-slate-500'}>{blueScore.toFixed(1)}</span>
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Predicción basada en el promedio agregado de puntos escaneados por equipo.
          </p>
        </div>
      )}
    </div>
  )
}
