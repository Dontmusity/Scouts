import { useEffect, useMemo, useState } from 'react'
import { winProbability } from '../../lib/winProbability'
import { useEventStore } from '../../store/useEventStore'
import { formatTeamLabel } from '../../lib/teamName'

export interface PredictorTeam {
  teamNumber: string
  mean: number
  variance: number
}

function AllianceSelect({
  label,
  side,
  slots,
  teams,
  namesByNumber,
  score,
  onChange,
}: {
  label: string
  side: 'red' | 'blu'
  slots: string[]
  teams: PredictorTeam[]
  namesByNumber: Map<string, string>
  score: number | null
  onChange: (i: number, team: string) => void
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-[14px] p-2.5" style={{ background: `var(--${side}-t)` }}>
      <span className="text-xs font-extrabold tracking-[.06em]">{label}</span>
      {slots.map((value, i) => (
        <select
          key={i}
          className="h-[46px] w-full min-w-0 rounded-[10px] px-2 font-mono font-bold text-fg"
          style={{ background: `var(--${side}-t2)` }}
          value={value}
          onChange={(e) => onChange(i, e.target.value)}
        >
          <option value="">— Equipo —</option>
          {teams.map((t) => (
            <option key={t.teamNumber} value={t.teamNumber}>
              {formatTeamLabel(t.teamNumber, namesByNumber.get(t.teamNumber), true)}
            </option>
          ))}
        </select>
      ))}
      <span className="mt-1 font-mono text-[34px] font-bold leading-none">{score === null ? '—' : score.toFixed(0)}</span>
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
  const [sourceTouched, setSourceTouched] = useState(false)
  const [red, setRed] = useState<string[]>(Array(allianceSize).fill(''))
  const [blue, setBlue] = useState<string[]>(Array(allianceSize).fill(''))
  const eventTeams = useEventStore((s) => s.teams)
  const namesByNumber = useMemo(() => {
    const m = new Map<string, string>()
    for (const t of eventTeams) m.set(String(t.teamNumber), t.name)
    return m
  }, [eventTeams])

  // Si aún no hay scouting manual pero ya se sincronizó el evento, salta a
  // OPR en cuanto ese dato llegue — el store de eventos hidrata async, así
  // que al montar puede estar vacío todavía y un useState inicial se queda pegado.
  useEffect(() => {
    if (!sourceTouched && scoutedTeams.length === 0 && oprTeams.length > 0) setSource('opr')
  }, [sourceTouched, scoutedTeams.length, oprTeams.length])

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

  const seg = (on: boolean) => `min-h-[38px] rounded-lg px-3 text-[13px] font-bold disabled:opacity-40 ${on ? 'bg-n27 text-fg' : 'text-n75'}`

  return (
    <section className="flex flex-col gap-3.5 rounded-[18px] bg-n215 p-[18px]">
      <div className="flex items-baseline justify-between gap-2.5">
        <span className="text-lg font-bold">Predicción de partido</span>
        <div className="flex rounded-[10px] bg-n19 p-[3px]">
          <button
            type="button"
            className={seg(source === 'scouted')}
            onClick={() => {
              setSource('scouted')
              setSourceTouched(true)
            }}
          >
            Escaneado
          </button>
          <button
            type="button"
            className={seg(source === 'opr')}
            disabled={oprTeams.length === 0}
            onClick={() => {
              setSource('opr')
              setSourceTouched(true)
            }}
          >
            OPR
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <AllianceSelect
          label="ROJA"
          side="red"
          slots={red}
          teams={teams}
          namesByNumber={namesByNumber}
          score={red.some(Boolean) ? redScore : null}
          onChange={(i, t) => setSlot(setRed, i, t)}
        />
        <AllianceSelect
          label="AZUL"
          side="blu"
          slots={blue}
          teams={teams}
          namesByNumber={namesByNumber}
          score={blue.some(Boolean) ? blueScore : null}
          onChange={(i, t) => setSlot(setBlue, i, t)}
        />
      </div>

      {hasPicks ? (
        <div className="flex flex-col gap-1.5">
          <div className="flex h-3.5 gap-0.5 overflow-hidden rounded-full">
            <div className="bg-bad" style={{ width: `${redWinPct.toFixed(1)}%` }} />
            <div className="flex-1 bg-blu" />
          </div>
          <div className="flex justify-between text-sm font-bold">
            <span>Roja {redWinPct.toFixed(0)}%</span>
            <span>{(100 - redWinPct).toFixed(0)}% Azul</span>
          </div>
          <p className="text-xs text-n75">
            {source === 'opr'
              ? 'Basada en OPR (mínimos cuadrados sobre los partidos oficiales jugados).'
              : 'Basada en el promedio de puntos escaneados por equipo.'}
          </p>
        </div>
      ) : (
        <p className="text-[13px] text-n75">
          {source === 'opr' && oprTeams.length === 0
            ? 'Sin partidos oficiales jugados — sincroniza el evento en Eventos para calcular OPR.'
            : 'Elige equipos de las dos alianzas para ver el % de victoria.'}
        </p>
      )}
    </section>
  )
}
