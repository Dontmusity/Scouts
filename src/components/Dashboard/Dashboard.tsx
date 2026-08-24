import { useMemo } from 'react'
import { useScoutStore } from '../../store/useScoutStore'
import { useEventStore } from '../../store/useEventStore'
import { computeTeamStats } from '../../lib/teamStats'
import { computeOpr, computeOprResidualVariance } from '../../lib/opr'
import { TeamStatsChart } from './TeamStatsChart'
import { ConsistencyChart } from './ConsistencyChart'
import { Picklist } from './Picklist'
import { MatchPredictor, type PredictorTeam } from './MatchPredictor'

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
    return Array.from(opr.entries()).map(([teamNumber, mean]) => ({ teamNumber: String(teamNumber), mean, variance }))
  }, [eventMatches])

  if (stats.length === 0) {
    return <p className="p-8 text-center text-slate-500">Aún no hay partidos escaneados para analizar.</p>
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-4 pb-16 text-left">
      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-sky-400">Promedio por equipo</h2>
        <TeamStatsChart stats={stats} />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-sky-400">
          Consistencia (desviación estándar — menor es más consistente)
        </h2>
        <ConsistencyChart stats={stats} fields={config.fields} />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-sky-400">
          PickList (arrastra en desktop o usa el selector en el celular)
        </h2>
        <Picklist stats={stats} />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-sky-400">Predicción de partido</h2>
        <MatchPredictor scoutedTeams={scoutedTeams} oprTeams={oprTeams} allianceSize={config.mode === 'FRC' ? 3 : 2} />
      </section>
    </div>
  )
}
