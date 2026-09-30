import { useState } from 'react'
import { useNexusStore } from '../store/useNexusStore'
import { nexusHost } from '../lib/nexusApi'

const input = 'w-full rounded-lg border border-n33 bg-n215 p-3 text-fg'

function timeLabel(ms: number | null): string {
  if (!ms) return ''
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function NexusPanel() {
  const {
    apiKey, eventKey, setApiKey, setEventKey, sync,
    matches, pits, announcements, dataAsOfTime, raw, lastSyncedAt, syncing, error,
  } = useNexusStore()
  const [showRaw, setShowRaw] = useState(false)

  const pitCount = Object.keys(pits).length

  return (
    <div className="space-y-3 rounded-xl border border-n27 p-3">
      <h2 className="text-sm font-bold uppercase tracking-wide text-acc-t">Nexus (estado en vivo)</h2>

      <label className="block text-sm text-n75">Nexus API Key</label>
      <input className={input} value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Nexus-Api-Key" />
      <p className="text-xs text-n60">
        Se obtiene en{' '}
        <a className="text-acc-t underline" href={`https://${nexusHost()}/api`} target="_blank" rel="noreferrer">
          {nexusHost()}/api
        </a>{' '}
        (iniciar sesión con Google). Se guarda solo en este dispositivo.
      </p>

      <label className="block text-sm text-n75">Event key de Nexus</label>
      <input className={input} value={eventKey} onChange={(e) => setEventKey(e.target.value)} placeholder="p.ej. 2026azscor" />

      <button
        className="w-full rounded-xl bg-acc py-3 font-bold text-on-acc disabled:opacity-40"
        disabled={syncing || !apiKey || !eventKey}
        onClick={sync}
      >
        {syncing ? 'Consultando…' : 'Consultar Nexus'}
      </button>

      {error && <p className="rounded-lg bg-bad-t p-3 text-sm font-bold text-bad">{error}</p>}

      {lastSyncedAt && (
        <p className="text-xs text-n60">
          Consultado: {new Date(lastSyncedAt).toLocaleTimeString()}
          {dataAsOfTime && ` · datos de Nexus al ${timeLabel(dataAsOfTime)}`}
        </p>
      )}

      {lastSyncedAt && matches.length === 0 && pitCount === 0 && (
        <p className="rounded-lg bg-warn-t p-3 text-sm font-bold text-warn">
          ⚠️ Nexus respondió, pero este evento todavía no tiene partidos ni pits publicados. Vuelve a consultar cuando el
          evento esté en marcha.
        </p>
      )}

      {matches.length > 0 && (
        <div>
          <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-n72">
            Cola de partidos ({matches.length})
          </h3>
          <ul className="space-y-1 text-sm">
            {matches.slice(0, 12).map((m, i) => (
              <li key={i} className="flex items-center justify-between rounded bg-n215 px-2 py-1">
                <span className="text-fg">{m.label || `Partido ${m.matchNumber ?? '?'}`}</span>
                <span className="flex items-center gap-2 text-xs text-n72">
                  {m.estimatedTime && <span>{timeLabel(m.estimatedTime)}</span>}
                  {m.status && <span className="rounded-full bg-n27 px-2 py-0.5">{m.status}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {pitCount > 0 && (
        <p className="text-xs text-grn">
          📍 {pitCount} ubicaciones de pit cargadas — aparecen en la pestaña Pit.
        </p>
      )}

      {announcements.length > 0 && (
        <div>
          <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-n72">Anuncios</h3>
          <ul className="space-y-1 text-sm text-n75">
            {announcements.slice(0, 5).map((a, i) => (
              <li key={i} className="rounded bg-n215 px-2 py-1">{a}</li>
            ))}
          </ul>
        </div>
      )}

      {/* La forma interna de matches/pits no se pudo verificar en temporada
          baja (ningún evento con datos). Esto permite ver la respuesta real
          durante un evento y corregir el lector si algún campo no coincide. */}
      {raw !== null && raw !== undefined && (
        <div>
          <button className="text-xs font-bold text-n72 underline" onClick={() => setShowRaw((v) => !v)}>
            {showRaw ? 'Ocultar' : 'Ver'} respuesta cruda (diagnóstico)
          </button>
          {showRaw && (
            <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-n165 p-2 text-[10px] text-grn">
              {JSON.stringify(raw, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}
