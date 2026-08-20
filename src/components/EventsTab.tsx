import { useScoutStore } from '../store/useScoutStore'
import { useEventStore } from '../store/useEventStore'

const input = 'rounded-lg border border-slate-700 bg-slate-800 p-3 text-white w-full'
const btn = 'rounded-xl bg-sky-600 py-3 font-bold text-white disabled:opacity-40'

export function EventsTab() {
  const mode = useScoutStore((s) => s.config.mode)
  const {
    tbaApiKey, tbaEventKey, setTbaApiKey, setTbaEventKey, syncFrc,
    ftcSeason, ftcEventCode, setFtcSeason, setFtcEventCode, syncFtc,
    teams, rankings, syncing, error, lastSyncedAt,
  } = useEventStore()

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 text-left">
      {mode === 'FRC' ? (
        <div className="space-y-2">
          <label className="block text-sm text-slate-300">TBA API Key (Read)</label>
          <input className={input} value={tbaApiKey} onChange={(e) => setTbaApiKey(e.target.value)} placeholder="X-TBA-Auth-Key" />
          <p className="text-xs text-slate-500">
            Se obtiene gratis en{' '}
            <a
              className="text-sky-400 underline"
              href="https://www.thebluealliance.com/account"
              target="_blank"
              rel="noreferrer"
            >
              thebluealliance.com/account
            </a>{' '}
            → &quot;Read API Keys&quot;. Se guarda solo en este dispositivo.
          </p>
          <label className="block text-sm text-slate-300">Event key</label>
          <input className={input} value={tbaEventKey} onChange={(e) => setTbaEventKey(e.target.value)} placeholder="p.ej. 2026mimi" />
          <button className={btn} disabled={syncing || !tbaApiKey || !tbaEventKey} onClick={syncFrc}>
            {syncing ? 'Sincronizando…' : 'Sincronizar con TBA'}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="block text-sm text-slate-300">Temporada</label>
          <input
            className={input}
            type="number"
            value={ftcSeason}
            onChange={(e) => setFtcSeason(Number(e.target.value))}
          />
          <label className="block text-sm text-slate-300">Código de evento</label>
          <input className={input} value={ftcEventCode} onChange={(e) => setFtcEventCode(e.target.value)} placeholder="p.ej. USTXCMPCA" />
          <button className={btn} disabled={syncing || !ftcEventCode} onClick={syncFtc}>
            {syncing ? 'Sincronizando…' : 'Sincronizar con FTCScout'}
          </button>
        </div>
      )}

      {error && <p className="text-sm font-bold text-red-400">{error}</p>}
      {lastSyncedAt && (
        <p className="text-xs text-slate-500">Última sincronización: {new Date(lastSyncedAt).toLocaleString()}</p>
      )}

      {teams.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-sky-400">
            Equipos inscritos ({teams.length})
          </h2>
          <ul className="grid grid-cols-2 gap-1 text-sm text-slate-300">
            {teams.map((t) => (
              <li key={t.teamNumber} className="truncate rounded bg-slate-800 px-2 py-1">
                {t.teamNumber} · {t.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {rankings.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-sky-400">Rankings oficiales</h2>
          <table className="w-full text-sm text-slate-300">
            <thead>
              <tr className="text-slate-500">
                <th className="text-left">#</th>
                <th className="text-left">Equipo</th>
                <th className="text-left">G-P</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((r) => (
                <tr key={r.teamNumber} className="border-t border-slate-800">
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
