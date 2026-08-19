import { lazy, Suspense, useRef, useState } from 'react'
import { useScoutStore } from '../store/useScoutStore'
import type { MatchEntry } from '../lib/db'
import { compressMatch } from '../lib/qr'
import { QrCode } from './QrCode'

const QrScanner = lazy(() => import('./QrScanner').then((m) => ({ default: m.QrScanner })))

function toCsv(matches: MatchEntry[], fieldIds: string[]): string {
  const header = ['matchNumber', 'teamNumber', 'scoutName', 'createdAt', ...fieldIds]
  const rows = matches.map((m) => [
    m.matchNumber,
    m.teamNumber,
    m.scoutName,
    new Date(m.createdAt).toISOString(),
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

  async function handleImport(file: File) {
    const text = await file.text()
    const parsed = JSON.parse(text) as MatchEntry[]
    for (const m of parsed) await addMatch(m)
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(JSON.stringify(matches, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const fieldIds = config.fields.map((f) => f.id)

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 text-left">
      <div className="flex flex-wrap gap-2">
        <button
          className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-bold text-white"
          onClick={() => download(`${config.gameId}-matches.json`, JSON.stringify(matches, null, 2), 'application/json')}
        >
          Exportar JSON
        </button>
        <button
          className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-bold text-white"
          onClick={() => download(`${config.gameId}-matches.csv`, toCsv(matches, fieldIds), 'text/csv')}
        >
          Exportar CSV
        </button>
        <button className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-bold text-white" onClick={handleCopy}>
          {copied ? '✓ Copiado' : 'Copiar al portapapeles'}
        </button>
        <button
          className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-bold text-white"
          onClick={() => fileRef.current?.click()}
        >
          Importar JSON
        </button>
        <button
          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white"
          onClick={() => setScanning(true)}
        >
          📷 Escanear QR (pit/central)
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])}
        />
      </div>

      <p className="text-sm text-slate-400">{matches.length} partidos guardados localmente.</p>

      <ul className="space-y-2">
        {matches
          .slice()
          .reverse()
          .map((m) => (
            <li key={m.id} className="flex items-center justify-between rounded-lg bg-slate-800 p-3">
              <span className="text-white">
                Partido {m.matchNumber} · Equipo {m.teamNumber}{' '}
                <span className="text-slate-400">({m.scoutName || 'sin scout'})</span>
              </span>
              <span className="flex gap-3">
                <button className="text-sm font-bold text-sky-400" onClick={() => setQrMatch(m)}>
                  QR
                </button>
                <button className="text-sm font-bold text-red-400" onClick={() => removeMatch(m.id)}>
                  Eliminar
                </button>
              </span>
            </li>
          ))}
      </ul>

      {qrMatch && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-slate-950/95 p-4">
          <p className="text-white">
            Partido {qrMatch.matchNumber} · Equipo {qrMatch.teamNumber}
          </p>
          <QrCode text={compressMatch(qrMatch)} />
          <button className="rounded-lg bg-slate-700 px-4 py-2 font-bold text-white" onClick={() => setQrMatch(null)}>
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
