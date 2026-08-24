import { useState } from 'react'
import { winProbability } from '../../lib/winProbability'

export interface PredictorTeam {
  teamNumber: string
  mean: number
  variance: number
}

function AllianceSelect({
  label,
  slots,
  teams,
  onChange,
}: {
  label: string
  slots: string[]
  teams: PredictorTeam[]
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
              {t.teamNumber} (prom. {t.mean.toFixed(1)})
            </option>
          ))}
        </select>
      ))}
    </div>
  )
}

export function MatchPredictor({
  scoutedTeams,
  oprTeams,
  allianceSize,
}: {
  scoutedTeams: PredictorTeam[]
  oprTeams: PredictorTeam[]
  allianceSize: 2 | 3
}) {
  const [source, setSource] = useState<'scouted' | 'opr'>('scouted')
  const [red, setRed] = useState<string[]>(Array(allianceSize).fill(''))
  const [blue, setBlue] = useState<string[]>(Array(allianceSize).fill(''))

  const teams = source === 'opr' ? oprTeams : scoutedTeams
  const byTeam = new Map(teams.map((t) => [t.teamNumber, t]))
  const sum = (slots: string[], pick: (t: PredictorTeam) => number) =>
    slots.reduce((acc, id) => acc + (byTeam.has(id) ? pick(byTeam.get(id)!) : 0), 0)
  const redScore = sum(red, (t) => t.mean)
  const blueScore = sum(blue, (t) => t.mean)
  const redWinPct = winProbability(redScore, sum(red, (t) => t.variance), blueScore, sum(blue, (t) => t.variance)) * 100
  const hasPicks = red.some(Boolean) && blue.some(Boolean)

  function setSlot(setter: typeof setRed, i: number, team: string) {
    setter((prev) => prev.map((t, idx) => (idx === i ? team : t)))
  }

  return (
    <div className="space-y-4">
      <div className="flex rounded-lg bg-slate-800 p-1 text-sm">
        <button
          type="button"
          onClick={() => setSource('scouted')}
          className={`rounded-md px-3 py-1.5 font-semibold ${source === 'scouted' ? 'bg-sky-600 text-white' : 'text-slate-400'}`}
        >
          Promedio escaneado
        </button>
        <button
          type="button"
          onClick={() => setSource('opr')}
          disabled={oprTeams.length === 0}
          className={`rounded-md px-3 py-1.5 font-semibold disabled:opacity-40 ${source === 'opr' ? 'bg-sky-600 text-white' : 'text-slate-400'}`}
        >
          OPR del evento
        </button>
      </div>
      {source === 'opr' && oprTeams.length === 0 && (
        <p className="text-xs text-slate-500">
          ℹ️ Sin partidos oficiales jugados sincronizados — sincroniza el evento en la pestaña Eventos para calcular OPR.
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <AllianceSelect label="Alianza roja" slots={red} teams={teams} onChange={(i, t) => setSlot(setRed, i, t)} />
        <AllianceSelect label="Alianza azul" slots={blue} teams={teams} onChange={(i, t) => setSlot(setBlue, i, t)} />
      </div>

      {hasPicks && (
        <div className="rounded-lg bg-slate-800 p-4 text-center">
          <p className="text-2xl font-bold">
            <span className={redScore >= blueScore ? 'text-red-400' : 'text-slate-500'}>{redScore.toFixed(1)}</span>
            {' — '}
            <span className={blueScore >= redScore ? 'text-blue-400' : 'text-slate-500'}>{blueScore.toFixed(1)}</span>
          </p>
          <div className="mx-auto mt-3 h-2 max-w-xs overflow-hidden rounded-full bg-blue-500">
            <div className="h-full bg-red-500" style={{ width: `${redWinPct.toFixed(1)}%` }} />
          </div>
          <p className="mt-2 text-sm font-bold">
            <span className="text-red-400">{redWinPct.toFixed(0)}%</span>
            {' — '}
            <span className="text-blue-400">{(100 - redWinPct).toFixed(0)}%</span>
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {source === 'opr'
              ? 'Predicción basada en OPR (mínimos cuadrados sobre los partidos oficiales jugados).'
              : 'Predicción basada en el promedio agregado de puntos escaneados por equipo.'}
          </p>
        </div>
      )}
    </div>
  )
}
