import { useMemo } from 'react'
import { useScoutStore } from '../../store/useScoutStore'
import { useEventStore } from '../../store/useEventStore'
import { computeTeamStats, numericFieldsOf } from '../../lib/teamStats'
import { computeOpr, computeOprResidualVariance } from '../../lib/opr'
import { computeOfficialConsistency } from '../../lib/officialConsistency'
import { TeamStatsChart } from './TeamStatsChart'
import { ConsistencyChart, type ConsistencyEntry, type ConsistencyOption } from './ConsistencyChart'
import { Picklist } from './Picklist'
import { MatchPredictor, type PredictorTeam } from './MatchPredictor'

/** Nombres legibles para las claves más comunes del desglose oficial — el resto se muestra tal cual llega de la API. */
const BREAKDOWN_LABELS: Record<string, string> = {
  autoPoints: 'Auto (oficial)',
  dcPoints: 'TeleOp (oficial)',
  teleopPoints: 'TeleOp (oficial)',
  endgamePoints: 'Endgame (oficial)',
  foulPoints: 'Faltas del rival (oficial)',
  penaltyPointsCommitted: 'Penalizaciones cometidas (oficial)',
  totalPointsNp: 'Puntaje sin penalización (oficial)',
}

export function Dashboard() {
  const { config, matches } = useScoutStore()
  const eventMatches = useEventStore((s) => s.matches)
  const stats = useMemo(() => computeTeamStats(matches, config.fields), [matches, config.fields])

  const scoutedTeams: PredictorTeam[] = useMemo(
    () => stats.map((s) => ({ teamNumber: s.teamNumber, mean: s.totalAvg, variance: s.stdDev ** 2 })),
    [stats],
  )
  const oprTeams: PredictorTeam[] = useMemo(() => {
    const opr = computeOpr(eventMatches)
    const variance = computeOprResidualVariance(eventMatches, opr)
    return Array.from(opr.entries())
      .map(([teamNumber, mean]) => ({ teamNumber: String(teamNumber), mean, variance }))
      .sort((a, b) => b.mean - a.mean)
  }, [eventMatches])

  const scoutedConsistency: ConsistencyEntry[] = useMemo(
    () => stats.map((s) => ({ teamNumber: s.teamNumber, total: s.stdDev, byField: s.stdDevByField })),
    [stats],
  )
  const scoutedConsistencyOptions: ConsistencyOption[] = useMemo(
    () => numericFieldsOf(config.fields).map((f) => ({ id: f.id, label: f.label })),
    [config.fields],
  )

  const officialConsistency: ConsistencyEntry[] = useMemo(
    () =>
      computeOfficialConsistency(eventMatches).map((e) => ({
        teamNumber: String(e.teamNumber),
        total: e.totalStdDev,
        byField: e.byBreakdownKey,
      })),
    [eventMatches],
  )
  const officialConsistencyOptions: ConsistencyOption[] = useMemo(() => {
    const keys = new Set<string>()
    for (const e of officialConsistency) Object.keys(e.byField).forEach((k) => keys.add(k))
    return Array.from(keys).map((k) => ({ id: k, label: BREAKDOWN_LABELS[k] ?? k }))
  }, [officialConsistency])

  // Sin scouting manual todavía se puede ver el OPR del evento ya sincronizado
  // (partidos oficiales jugados) — solo si no hay ninguna de las dos fuentes no hay nada que mostrar.
  if (stats.length === 0 && oprTeams.length === 0) {
    return (
      <p className="p-8 text-center text-slate-500">
        {eventMatches.length > 0
          ? `El cronograma está sincronizado (${eventMatches.length} partidos) pero ninguno tiene resultado oficial publicado todavía — vuelve a sincronizar cuando el evento reporte partidos jugados.`
          : 'Aún no hay partidos escaneados ni un evento sincronizado con resultados para analizar.'}
      </p>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-4 pb-16 text-left">
      {stats.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-sky-400">Promedio por equipo (escaneado)</h2>
          <TeamStatsChart teams={scoutedTeams} />
        </section>
      )}

      {oprTeams.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-sky-400">
            OPR del evento (partidos oficiales sincronizados)
          </h2>
          <TeamStatsChart teams={oprTeams} />
        </section>
      )}

      {(stats.length > 0 || officialConsistency.length > 0) && (
        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-sky-400">
            Consistencia (desviación estándar — menor es más consistente)
          </h2>
          <ConsistencyChart
            entries={stats.length > 0 ? scoutedConsistency : officialConsistency}
            options={stats.length > 0 ? scoutedConsistencyOptions : officialConsistencyOptions}
          />
        </section>
      )}

      {/* Sin scouting manual todavía, clasifica con OPR para no perder el
          PickList justo cuando el evento recién se sincronizó. */}
      {(stats.length > 0 || oprTeams.length > 0) && (
        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-sky-400">
            PickList (arrastra en desktop o usa el selector en el celular)
          </h2>
          <Picklist teams={stats.length > 0 ? scoutedTeams : oprTeams} />
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-sky-400">Predicción de partido</h2>
        <MatchPredictor scoutedTeams={scoutedTeams} oprTeams={oprTeams} allianceSize={config.mode === 'FRC' ? 3 : 2} />
      </section>
    </div>
  )
}
