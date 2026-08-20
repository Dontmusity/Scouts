import { useMemo } from 'react'
import { useScoutStore } from '../../store/useScoutStore'
import { computeTeamStats } from '../../lib/teamStats'
import { TeamStatsChart } from './TeamStatsChart'
import { Picklist } from './Picklist'
import { MatchPredictor } from './MatchPredictor'

export function Dashboard() {
  const { config, matches } = useScoutStore()
  const stats = useMemo(() => computeTeamStats(matches, config.fields), [matches, config.fields])

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
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-sky-400">PickList (arrastra para reordenar)</h2>
        <Picklist stats={stats} />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-sky-400">Predicción de partido</h2>
        <MatchPredictor stats={stats} allianceSize={config.mode === 'FRC' ? 3 : 2} />
      </section>
    </div>
  )
}
