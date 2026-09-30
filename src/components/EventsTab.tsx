import { useScoutStore } from '../store/useScoutStore'
import { useEventStore } from '../store/useEventStore'
import { NexusPanel } from './NexusPanel'

const input = 'rounded-lg border border-n33 bg-n215 p-3 text-fg w-full'
const btn = 'rounded-xl bg-acc py-3 font-bold text-on-acc disabled:opacity-40'

export function EventsTab() {
  const mode = useScoutStore((s) => s.config.mode)
  const {
    tbaApiKey, tbaEventKey, setTbaApiKey, setTbaEventKey, syncFrc,
    ftcSeason, ftcEventCode, setFtcSeason, setFtcEventCode, syncFtc,
    teams, rankings, matches, syncing, error, scheduleError, lastSyncedAt,
  } = useEventStore()

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 text-left">
      {mode === 'FRC' ? (
        <div className="space-y-2">
          <label className="block text-sm text-n75">TBA API Key (Read)</label>
          <input className={input} value={tbaApiKey} onChange={(e) => setTbaApiKey(e.target.value)} placeholder="X-TBA-Auth-Key" />
          <p className="text-xs text-n60">
            Se obtiene gratis en{' '}
            <a
              className="text-acc-t underline"
              href="https://www.thebluealliance.com/account"
              target="_blank"
              rel="noreferrer"
            >
              thebluealliance.com/account
            </a>{' '}
            → &quot;Read API Keys&quot;. Se guarda solo en este dispositivo.
          </p>
          <label className="block text-sm text-n75">Event key</label>
          <input className={input} value={tbaEventKey} onChange={(e) => setTbaEventKey(e.target.value)} placeholder="p.ej. 2026mimi" />
          <button className={btn} disabled={syncing || !tbaApiKey || !tbaEventKey} onClick={syncFrc}>
            {syncing ? 'Sincronizando…' : 'Sincronizar con TBA'}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="block text-sm text-n75">Temporada</label>
          <input
            className={input}
            type="number"
            value={ftcSeason}
            onChange={(e) => setFtcSeason(Number(e.target.value))}
          />
          <label className="block text-sm text-n75">Código de evento</label>
          <input className={input} value={ftcEventCode} onChange={(e) => setFtcEventCode(e.target.value)} placeholder="p.ej. USTXCMPCA" />
          <button className={btn} disabled={syncing || !ftcEventCode} onClick={syncFtc}>
            {syncing ? 'Sincronizando…' : 'Sincronizar con FTCScout'}
          </button>
        </div>
      )}

      {error && <p className="text-sm font-bold text-bad">{error}</p>}

      {scheduleError && (
        <p className="rounded-lg bg-warn-t p-3 text-sm font-bold text-warn">⚠️ {scheduleError}</p>
      )}

      {lastSyncedAt && !scheduleError && matches.length === 0 && (
        <p className="rounded-lg bg-warn-t p-3 text-sm font-bold text-warn">
          ⚠️ El evento sincronizó, pero todavía no hay cronograma de partidos publicado. El autocompletado de aliados y
          puntaje empezará a funcionar cuando lo publiquen (vuelve a sincronizar).
        </p>
      )}

      {lastSyncedAt && (
        <p className="text-xs text-n60">
          Última sincronización: {new Date(lastSyncedAt).toLocaleString()}
          {matches.length > 0 && ` · ${matches.length} partidos del cronograma (autocompletan aliados y puntaje)`}
        </p>
      )}

      {teams.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-acc-t">
            Equipos inscritos ({teams.length})
          </h2>
          <ul className="grid grid-cols-2 gap-1 text-sm text-n75">
            {teams.map((t) => (
              <li key={t.teamNumber} className="truncate rounded bg-n215 px-2 py-1">
                {t.teamNumber} · {t.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      <NexusPanel />

      {rankings.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-acc-t">Rankings oficiales</h2>
          <table className="w-full text-sm text-n75">
            <thead>
              <tr className="text-n60">
                <th className="text-left">#</th>
                <th className="text-left">Equipo</th>
                <th className="text-left">G-P</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((r) => (
                <tr key={r.teamNumber} className="border-t border-n27">
                  <td>{r.rank}</td>
                  <td>{r.teamNumber}</td>
                  <td>{r.wins}-{r.losses}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
