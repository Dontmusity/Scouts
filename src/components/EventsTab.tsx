import { CheckCircleIcon, CloudArrowDownIcon, WarningIcon } from '@phosphor-icons/react'
import { useScoutStore } from '../store/useScoutStore'
import { useEventStore } from '../store/useEventStore'
import { useTeam } from '../data/team'
import { NexusPanel } from './NexusPanel'
import { Field, Spinner, inputCls } from './ui'

export function EventsTab() {
  const mode = useScoutStore((s) => s.config.mode)
  const {
    tbaApiKey, tbaEventKey, setTbaApiKey, setTbaEventKey, syncFrc,
    ftcSeason, ftcEventCode, setFtcSeason, setFtcEventCode, syncFtc,
    teams, rankings, matches, syncing, error, scheduleError, lastSyncedAt,
  } = useEventStore()
  const frc = mode === 'FRC'
  const team = useTeam()
  const code = frc ? tbaEventKey : ftcEventCode
  const us = team.number
  const nameOf = (n: number) => teams.find((t) => t.teamNumber === n)?.name ?? ''

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-5 p-4 text-left sm:p-6">
      <h1 className="text-[32px] font-extrabold [font-stretch:75%]">Eventos</h1>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] items-start gap-4">
        <section className="flex flex-col gap-3.5 rounded-[18px] bg-n215 p-[18px]">
          <div className="flex items-center gap-2.5">
            <CloudArrowDownIcon size={24} weight="duotone" className="text-acc-t" />
            <span className="text-lg font-bold">{frc ? 'The Blue Alliance' : 'FTCScout'}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {frc ? (
              <>
                <Field label="Clave de API">
                  <input className={inputCls} value={tbaApiKey} onChange={(e) => setTbaApiKey(e.target.value)} placeholder="X-TBA-Auth-Key" />
                </Field>
                <Field label="Clave del evento">
                  <input className={`${inputCls} uppercase`} value={tbaEventKey} onChange={(e) => setTbaEventKey(e.target.value.toLowerCase())} placeholder="2026MXMO" />
                </Field>
              </>
            ) : (
              <>
                <Field label="Temporada">
                  <input className={inputCls} type="number" value={ftcSeason} onChange={(e) => setFtcSeason(Number(e.target.value))} />
                </Field>
                <Field label="Código de evento">
                  <input className={`${inputCls} uppercase`} value={ftcEventCode} onChange={(e) => setFtcEventCode(e.target.value)} placeholder="USTXCMPCA" />
                </Field>
              </>
            )}
          </div>
          {frc && (
            <p className="text-xs text-n75">
              La clave se obtiene gratis en{' '}
              <a className="text-acc-t underline" href="https://www.thebluealliance.com/account" target="_blank" rel="noreferrer">
                thebluealliance.com/account
              </a>{' '}
              → "Read API Keys". Se guarda solo en este dispositivo.
            </p>
          )}
          <button
            className="flex min-h-14 items-center justify-center gap-2.5 rounded-[14px] bg-acc font-extrabold text-on-acc disabled:opacity-40"
            disabled={syncing || !code || (frc && !tbaApiKey)}
            onClick={frc ? syncFrc : syncFtc}
          >
            {frc ? 'Sincronizar con TBA' : 'Sincronizar con FTCScout'}
          </button>

          {syncing ? (
            <p className="flex items-center gap-2.5 text-sm text-n75">
              <Spinner />
              Sincronizando…
            </p>
          ) : error ? (
            <p className="flex items-start gap-2.5 rounded-xl bg-bad-t p-3 text-sm">
              <WarningIcon size={18} weight="duotone" className="mt-0.5 shrink-0" />
              {error} Lo ya guardado no se pierde.
            </p>
          ) : lastSyncedAt ? (
            <p className="flex items-center gap-2.5 text-sm text-grn">
              <CheckCircleIcon size={18} weight="fill" className="shrink-0" />
              {matches.length} partidos del cronograma cargados · {code.toUpperCase()}
            </p>
          ) : (
            <p className="text-sm text-n75">Sin datos oficiales cargados. Sincroniza cuando tengas internet.</p>
          )}

          {/* El cronograma puede fallar o no estar publicado aunque equipos y rankings sí bajen */}
          {!syncing && scheduleError && (
            <p className="flex items-start gap-2.5 rounded-xl bg-warn-t p-3 text-sm">
              <WarningIcon size={18} weight="duotone" className="mt-0.5 shrink-0 text-warn" />
              {scheduleError}
            </p>
          )}
          {!syncing && lastSyncedAt && !scheduleError && !error && matches.length === 0 && (
            <p className="flex items-start gap-2.5 rounded-xl bg-warn-t p-3 text-sm">
              <WarningIcon size={18} weight="duotone" className="mt-0.5 shrink-0 text-warn" />
              El evento sincronizó, pero todavía no hay cronograma publicado. El autocompletado empezará a funcionar cuando lo
              publiquen (vuelve a sincronizar).
            </p>
          )}
          {lastSyncedAt && <p className="text-xs text-n75">Última sincronización: {new Date(lastSyncedAt).toLocaleString()}</p>}
        </section>

        <NexusPanel />
      </div>

      <section className="flex flex-col gap-2.5">
        <h2 className="text-lg font-bold">Rankings oficiales</h2>
        {rankings.length > 0 ? (
          <div className="overflow-hidden rounded-2xl bg-n215">
            <div className="grid grid-cols-[44px_80px_minmax(0,1fr)_80px_56px] gap-2 bg-n19 px-3.5 py-3 text-xs font-bold text-n75">
              <span>#</span>
              <span>Equipo</span>
              <span>Nombre</span>
              <span>V-D-E</span>
              <span className="text-right">RP</span>
            </div>
            {rankings.map((r) => (
              <div
                key={r.teamNumber}
                className={`grid grid-cols-[44px_80px_minmax(0,1fr)_80px_56px] items-center gap-2 px-3.5 py-3 text-[15px] ${r.teamNumber === us ? 'bg-acc/10' : ''}`}
              >
                <span className="font-mono font-bold text-n75">{r.rank}</span>
                <span className="font-mono font-bold">{r.teamNumber}</span>
                <span className="truncate">{nameOf(r.teamNumber)}</span>
                <span className="font-mono text-[13px]">
                  {r.wins}-{r.losses}-{r.ties ?? 0}
                </span>
                <span className="text-right font-mono">{r.rp == null ? '—' : r.rp.toFixed(2)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-n33 p-6 text-n75">Los rankings aparecen después de sincronizar el evento.</div>
        )}
      </section>
    </div>
  )
}
