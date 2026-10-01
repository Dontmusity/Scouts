import { useMemo } from 'react'
import { useScoutStore } from '../../store/useScoutStore'
import { useEventStore } from '../../store/useEventStore'
import { computeTeamStats, numericFieldsOf } from '../../lib/teamStats'
import { computeOpr, computeOprResidualVariance } from '../../lib/opr'
import { computeOfficialConsistency } from '../../lib/officialConsistency'
import { Bars } from './Bars'
import { useTeam } from '../../data/team'
import { ChartBarIcon } from '@phosphor-icons/react'
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
  const eventId = useEventStore((s) => (config.mode === 'FRC' ? s.tbaEventKey : s.ftcEventCode))
  const team = useTeam()
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

  const us = String(team.number)
  const card = 'flex flex-col gap-3 rounded-[18px] bg-n215 p-[18px]'
  const title = (t: string, sub: string) => (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-lg font-bold">{t}</span>
      <span className="text-[13px] text-n75">{sub}</span>
    </div>
  )
  const hasData = stats.length > 0 || oprTeams.length > 0

  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-5 p-4 pb-16 text-left sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-[32px] font-extrabold [font-stretch:75%]">Análisis</h1>
        <span className="text-sm text-n75">
          {matches.length} partidos escaneados · {stats.length} equipos
        </span>
      </div>

      {/* Sin scouting manual todavía se puede ver el OPR del evento ya sincronizado
          (partidos oficiales jugados) — solo si no hay ninguna de las dos fuentes no hay nada que mostrar. */}
      {!hasData ? (
        <div className="flex flex-col items-start gap-3 rounded-[18px] border border-dashed border-n33 px-6 py-8">
          <ChartBarIcon size={40} weight="duotone" className="text-n75" />
          <p className="text-xl font-bold">Faltan datos para analizar</p>
          <p className="max-w-[52ch] text-n75">
            {eventMatches.length > 0
              ? `El cronograma está sincronizado (${eventMatches.length} partidos) pero ninguno tiene resultado oficial publicado todavía — vuelve a sincronizar cuando el evento reporte partidos jugados.`
              : 'Necesitas al menos un partido escaneado para los promedios y la consistencia, y el evento sincronizado para el OPR. Junta los QR de los scouts en Partidos.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,440px),1fr))] items-start gap-4">
          {stats.length > 0 && (
            <section className={card}>
              {title('Promedio por equipo', 'escaneado / partido')}
              <Bars rows={scoutedTeams.map((t) => ({ team: t.teamNumber, value: t.mean }))} us={us} />
            </section>
          )}

          {oprTeams.length > 0 && (
            <section className={card}>
              {title('OPR del evento', 'partidos oficiales')}
              <Bars rows={oprTeams.map((t) => ({ team: t.teamNumber, value: t.mean }))} us={us} />
            </section>
          )}

          {(stats.length > 0 || officialConsistency.length > 0) && (
            <ConsistencyChart
              entries={stats.length > 0 ? scoutedConsistency : officialConsistency}
              options={stats.length > 0 ? scoutedConsistencyOptions : officialConsistencyOptions}
              us={us}
            />
          )}

          <MatchPredictor scoutedTeams={scoutedTeams} oprTeams={oprTeams} allianceSize={config.mode === 'FRC' ? 3 : 2} />

          {/* Sin scouting manual todavía, clasifica con OPR para no perder el
              PickList justo cuando el evento recién se sincronizó. */}
          <Picklist teams={stats.length > 0 ? scoutedTeams : oprTeams} eventId={eventId} />
        </div>
      )}
    </div>
  )
}
