import { lazy, Suspense, useRef, useState } from 'react'
import { useScoutStore } from '../store/useScoutStore'
import { useSyncStore } from '../store/useSyncStore'
import { useEventStore } from '../store/useEventStore'
import {
  ArrowsLeftRightIcon,
  ClipboardTextIcon,
  CopyIcon,
  DownloadSimpleIcon,
  FileCsvIcon,
  QrCodeIcon,
  ScanIcon,
  TrashIcon,
  UploadSimpleIcon,
  type Icon,
} from '@phosphor-icons/react'
import { validateMatchEntry, type MatchEntry } from '../lib/db'
import { compressMatch } from '../lib/qr'
import { QrCode } from './QrCode'

const QrScanner = lazy(() => import('./QrScanner').then((m) => ({ default: m.QrScanner })))
const SyncPanel = lazy(() => import('./SyncPanel').then((m) => ({ default: m.SyncPanel })))

function toCsv(matches: MatchEntry[], fieldIds: string[]): string {
  const header = ['matchNumber', 'teamNumber', 'scoutName', 'createdAt', ...fieldIds]
  const rows = matches.map((m) => [
    m.matchNumber,
    m.teamNumber,
    m.scoutName,
    Number.isFinite(m.createdAt) ? new Date(m.createdAt).toISOString() : '',
    ...fieldIds.map((id) => String(m.values[id] ?? '')),
  ])
  return [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function MatchList() {
  const { config, matches, removeMatch, addMatch } = useScoutStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [copied, setCopied] = useState(false)
  const [qrMatch, setQrMatch] = useState<MatchEntry | null>(null)
  const [scanning, setScanning] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const syncStatus = useSyncStore((s) => s.status)

  async function handleImport(file: File) {
    try {
      const parsed: unknown = JSON.parse(await file.text())
      if (!Array.isArray(parsed)) throw new Error('El archivo debe ser un arreglo de partidos.')
      let imported = 0
      let skipped = 0
      for (const raw of parsed) {
        const m = validateMatchEntry(raw)
        // un gameId distinto quedaría invisible tras recargar (listMatches filtra por juego)
        if (m.gameId !== config.gameId) {
          skipped++
          continue
        }
        await addMatch(m)
        imported++
      }
      setImportMsg(`✓ ${imported} importados${skipped ? `, ${skipped} omitidos (otro juego)` : ''}`)
    } catch (e) {
      setImportMsg(`✗ Import falló: ${e instanceof Error ? e.message : 'archivo inválido'}`)
    } finally {
      // sin esto, elegir el mismo archivo otra vez no dispara onChange
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(JSON.stringify(matches, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const fieldIds = config.fields.map((f) => f.id)
  const [delId, setDelId] = useState<string | null>(null)
  const eventTeams = useEventStore((s) => s.teams)
  const eventMatches = useEventStore((s) => s.matches)
  const hasPoints = config.fields.some((f) => f.points !== undefined)

  const allianceOf = (m: MatchEntry) => {
    const r = eventMatches.find((x) => String(x.matchNumber) === m.matchNumber)
    if (!r) return null
    return r.red.map(String).includes(m.teamNumber) ? 'red' : r.blue.map(String).includes(m.teamNumber) ? 'blue' : null
  }
  const ptsOf = (m: MatchEntry) =>
    config.fields.reduce((sum, f) => {
      const v = m.values[f.id]
      if (f.points === undefined) return sum
      return sum + (f.type === 'toggle' ? (v === true ? f.points : 0) : typeof v === 'number' ? v * f.points : 0)
    }, 0)

  const exportActions: [string, Icon, () => void][] = [
    ['Exportar JSON', DownloadSimpleIcon, () => download(`${config.gameId}-matches.json`, JSON.stringify(matches, null, 2), 'application/json')],
    ['Exportar CSV', FileCsvIcon, () => download(`${config.gameId}-matches.csv`, toCsv(matches, fieldIds), 'text/csv')],
    [copied ? '✓ Copiado' : 'Copiar', CopyIcon, handleCopy],
    ['Importar JSON', UploadSimpleIcon, () => fileRef.current?.click()],
  ]

  const rows = matches
    .slice()
    .sort((a, b) => Number(b.matchNumber) - Number(a.matchNumber) || Number(a.teamNumber) - Number(b.teamNumber))

  return (
    <div className="mx-auto flex max-w-[980px] flex-col gap-5 p-4 text-left sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-[32px] font-extrabold [font-stretch:75%]">Partidos</h1>
        <span className="text-sm text-n75">{matches.length} registros en este dispositivo</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          className="flex min-h-14 flex-[1_1_160px] items-center justify-center gap-2 rounded-[14px] bg-acc px-4 font-extrabold text-on-acc"
          onClick={() => setScanning(true)}
        >
          <ScanIcon size={22} weight="bold" />
          Escanear QR
        </button>
        <button
          className="flex min-h-14 flex-[1_1_160px] items-center justify-center gap-2 rounded-[14px] bg-n27 px-4 font-bold"
          onClick={() => setSyncing((v) => !v)}
        >
          <ArrowsLeftRightIcon size={22} weight="duotone" />
          Sincronización en vivo
          {syncStatus === 'connected' && <span className="h-2.5 w-2.5 rounded-full bg-grn" />}
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {exportActions.map(([label, I, onClick]) => (
          <button
            key={label}
            className="flex min-h-11 items-center gap-1.5 rounded-[10px] border border-n33 px-3.5 text-sm font-semibold hover:bg-n215"
            onClick={onClick}
          >
            <I size={18} />
            {label}
          </button>
        ))}
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])}
        />
      </div>

      {importMsg && <p className="text-sm font-bold text-n75">{importMsg}</p>}

      {syncing && (
        <Suspense fallback={null}>
          <SyncPanel />
        </Suspense>
      )}

      {rows.length > 0 ? (
        <div className="flex flex-col gap-2">
          {rows.map((m) => {
            const side = allianceOf(m)
            const confirming = delId === m.id
            const meta = [
              m.scoutName || '—',
              side ? `Alianza ${side === 'red' ? 'roja' : 'azul'}` : 'Sin alianza',
              ...(hasPoints ? [`${ptsOf(m)} pts`] : []),
            ].join(' · ')
            return (
              <div key={m.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3.5 rounded-[14px] bg-n215 py-3 pl-3.5 pr-3">
                <div
                  className={`flex h-[54px] w-[54px] flex-col items-center justify-center rounded-xl ${side === 'red' ? 'bg-bad-t' : side === 'blue' ? 'bg-blu-t' : 'bg-n27'}`}
                >
                  <span className="text-[10px] font-bold opacity-80">PART.</span>
                  <span className="font-mono text-xl font-bold leading-none">{m.matchNumber}</span>
                </div>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-mono text-lg font-bold">{m.teamNumber}</span>
                    <span className="truncate font-semibold">
                      {eventTeams.find((t) => String(t.teamNumber) === m.teamNumber)?.name ?? 'Equipo'}
                    </span>
                  </div>
                  <span className="text-[13px] text-n75">{meta}</span>
                </div>
                <div className="flex gap-1.5">
                  <button aria-label="QR" className="flex h-12 w-12 items-center justify-center rounded-xl bg-n27" onClick={() => setQrMatch(m)}>
                    <QrCodeIcon size={22} weight="duotone" />
                  </button>
                  {/* Borrar pide un segundo toque: antes un toque accidental borraba el registro */}
                  <button
                    className={`flex h-12 min-w-12 items-center justify-center gap-1.5 rounded-xl px-2.5 text-sm font-bold ${confirming ? 'bg-bad text-white' : 'bg-n27'}`}
                    onClick={() => {
                      if (confirming) {
                        removeMatch(m.id)
                        setDelId(null)
                      } else setDelId(m.id)
                    }}
                    onBlur={() => confirming && setDelId(null)}
                  >
                    <TrashIcon size={20} weight="duotone" />
                    {confirming && '¿Borrar?'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-start gap-3 rounded-[18px] border border-dashed border-n33 px-6 py-8">
          <ClipboardTextIcon size={40} weight="duotone" className="text-n75" />
          <p className="text-xl font-bold">Todavía no hay partidos</p>
          <p className="max-w-[46ch] text-n75">
            Captura uno en Scouting o escanea el QR de otro scout. Todo se guarda en este dispositivo, aunque no haya internet.
          </p>
        </div>
      )}

      {qrMatch && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-[18px] bg-n165 p-6 text-center">
          <p className="text-[17px] text-n75">
            Partido <b className="font-mono text-fg">{qrMatch.matchNumber}</b> · Equipo{' '}
            <b className="font-mono text-fg">{qrMatch.teamNumber}</b>
          </p>
          <div className="rounded-[14px] bg-white p-3.5">
            <QrCode text={compressMatch(qrMatch)} />
          </div>
          <p className="max-w-[34ch] text-sm text-n75">Que la central lo escanee en Partidos → Escanear QR. No necesita internet.</p>
          <button className="min-h-14 w-full max-w-[340px] rounded-[14px] bg-n27 font-bold" onClick={() => setQrMatch(null)}>
            Cerrar
          </button>
        </div>
      )}

      {scanning && (
        <Suspense fallback={null}>
          <QrScanner onClose={() => setScanning(false)} />
        </Suspense>
      )}
    </div>
  )
}
