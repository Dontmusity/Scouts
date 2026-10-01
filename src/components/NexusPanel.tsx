import { useState } from 'react'
import { useNexusStore } from '../store/useNexusStore'
import { nexusHost } from '../lib/nexusApi'
import { BroadcastIcon, EyeSlashIcon, MegaphoneIcon } from '@phosphor-icons/react'
import { Field, Spinner, inputCls } from './ui'


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
  const [hidden, setHidden] = useState<string[]>([])

  const pitCount = Object.keys(pits).length

  return (
    <section className="flex flex-col gap-3.5 rounded-[18px] bg-n215 p-[18px]">
      <div className="flex items-center gap-2.5">
        <BroadcastIcon size={24} weight="duotone" className="text-acc-t" />
        <span className="flex-1 text-lg font-bold">Nexus · en vivo</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Clave de API de Nexus">
          <input className={inputCls} value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Nexus-Api-Key" />
        </Field>
        <Field label="Clave del evento">
          <input className={inputCls} value={eventKey} onChange={(e) => setEventKey(e.target.value)} placeholder="2026azscor" />
        </Field>
      </div>
      <p className="text-xs text-n75">
        La clave se obtiene en{' '}
        <a className="text-acc-t underline" href={`https://${nexusHost()}/api`} target="_blank" rel="noreferrer">
          {nexusHost()}/api
        </a>
        . Se guarda solo en este dispositivo.
      </p>
      <button
        className="min-h-[52px] rounded-xl bg-n27 px-[18px] font-bold disabled:opacity-40"
        disabled={syncing || !apiKey || !eventKey}
        onClick={sync}
      >
        Consultar
      </button>

      {syncing ? (
        <p className="flex items-center gap-2.5 text-sm text-n75">
          <Spinner />
          Consultando Nexus…
        </p>
      ) : error ? (
        <p className="rounded-xl bg-bad-t p-3 text-sm">{error}</p>
      ) : !lastSyncedAt ? (
        <p className="text-sm text-n75">Consulta para ver los próximos partidos y los anuncios del evento.</p>
      ) : (
        <p className="text-xs text-n75">
          Consultado: {new Date(lastSyncedAt).toLocaleTimeString()}
          {dataAsOfTime && ` · datos de Nexus al ${timeLabel(dataAsOfTime)}`}
        </p>
      )}

      {lastSyncedAt && !syncing && matches.length === 0 && pitCount === 0 && (
        <p className="rounded-xl bg-warn-t p-3 text-sm">
          Nexus respondió, pero este evento todavía no tiene partidos ni pits publicados. Vuelve a consultar cuando esté en marcha.
        </p>
      )}

      {matches.length > 0 && (
        <div className="flex flex-col gap-2">
          {matches.slice(0, 12).map((m, i) => (
            <div key={i} className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-2 rounded-[10px] bg-n27 px-2.5 py-2">
              <span className="flex flex-col">
                <span className="font-mono font-bold">P{m.matchNumber ?? '?'}</span>
                <span className="text-xs text-n75">{timeLabel(m.estimatedTime)}</span>
              </span>
              <span className="truncate text-sm">{m.label}</span>
              {m.status && <span className="rounded-full bg-n215 px-2.5 py-0.5 text-xs font-bold">{m.status}</span>}
            </div>
          ))}
        </div>
      )}

      {pitCount > 0 && <p className="text-xs text-grn">{pitCount} ubicaciones de pit cargadas — aparecen en la pestaña Pit.</p>}

      {announcements
        .slice(0, 5)
        .filter((a) => !hidden.includes(a))
        .map((a) => (
          <div key={a} className="flex items-start gap-2.5 rounded-xl bg-n27 p-3">
            <MegaphoneIcon size={20} weight="duotone" className="shrink-0 text-acc-t" />
            <span className="flex-1 text-sm">{a}</span>
            <button aria-label="Ocultar" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-n75" onClick={() => setHidden((h) => [...h, a])}>
              <EyeSlashIcon size={18} />
            </button>
          </div>
        ))}

      {/* La forma interna de matches/pits no se pudo verificar en temporada
          baja (ningún evento con datos). Esto permite ver la respuesta real
          durante un evento y corregir el lector si algún campo no coincide. */}
      {raw !== null && raw !== undefined && (
        <div>
          <button className="text-xs font-bold text-n75 underline" onClick={() => setShowRaw((v) => !v)}>
            {showRaw ? 'Ocultar' : 'Ver'} respuesta cruda (diagnóstico)
          </button>
          {showRaw && (
            <pre className="mt-2 max-h-64 overflow-auto rounded-xl bg-n19 p-2 font-mono text-[10px] text-grn">{JSON.stringify(raw, null, 2)}</pre>
          )}
        </div>
      )}
    </section>
  )
}
