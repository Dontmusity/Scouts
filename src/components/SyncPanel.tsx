import { lazy, Suspense, useState } from 'react'
import { useSyncStore } from '../store/useSyncStore'
import { QrCode } from './QrCode'

const QrScanner = lazy(() => import('./QrScanner').then((m) => ({ default: m.QrScanner })))

const STATUS_LABEL: Record<string, string> = {
  new: 'Sin conexión',
  connecting: 'Conectando…',
  connected: 'Conectado',
  disconnected: 'Desconectado',
  failed: 'Conexión fallida',
  closed: 'Conexión cerrada',
}

export function SyncPanel({ onClose }: { onClose: () => void }) {
  const { role, status, localCode, count, startCentral, acceptAnswer, answerOffer, disconnect } = useSyncStore()
  const [scanning, setScanning] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pasted, setPasted] = useState('')

  async function handleCode(text: string) {
    try {
      if (role === 'central') await acceptAnswer(text)
      else await answerOffer(text)
      setError(null)
      setPasted('')
      setScanning(false)
    } catch {
      setError('Código de conexión inválido. Intenta de nuevo.')
      setScanning(false)
    }
  }

  async function copyCode() {
    if (!localCode) return
    await navigator.clipboard.writeText(localCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const connected = status === 'connected'
  const dotColor = connected ? 'bg-emerald-400' : status === 'connecting' ? 'bg-amber-400' : 'bg-slate-500'

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950 p-4">
      <div className="mx-auto max-w-sm space-y-4">
        <button className="rounded-lg bg-slate-700 px-4 py-2 font-bold text-white" onClick={onClose}>
          ← Volver (la sincronización sigue activa)
        </button>

        <div className="flex items-center gap-2 rounded-lg bg-slate-800 p-3">
          <span className={`h-3 w-3 rounded-full ${dotColor}`} />
          <span className="font-bold text-white">{STATUS_LABEL[status] ?? status}</span>
          {role && (
            <span className="ml-auto text-sm text-slate-400">
              {role === 'central' ? `${count} recibidos` : `${count} enviados`}
            </span>
          )}
        </div>

        {error && <p className="rounded-lg bg-red-900/50 p-3 text-sm text-red-300">{error}</p>}

        {!role && (
          <div className="space-y-3">
            <p className="text-sm text-slate-400">
              Ambos dispositivos deben estar en la misma red Wi-Fi o hotspot. Elige el rol de este dispositivo:
            </p>
            <button
              className="w-full rounded-lg bg-sky-600 px-4 py-4 text-lg font-bold text-white"
              onClick={() => startCentral().catch(() => setError('No se pudo crear la conexión.'))}
            >
              📥 Central (recibe)
            </button>
            <button
              className="w-full rounded-lg bg-emerald-600 px-4 py-4 text-lg font-bold text-white"
              onClick={() => setScanning(true)}
            >
              📤 Scout (envía) — escanear QR de la central
            </button>
          </div>
        )}

        {role && !connected && localCode && (
          <div className="space-y-3 text-center">
            <p className="text-sm text-slate-400">
              {role === 'central'
                ? '1. El scout toca "Scout (envía)" y escanea este QR.'
                : 'Muestra este QR a la central para que lo escanee.'}
            </p>
            <QrCode text={localCode} />
            <button className="w-full rounded-lg bg-slate-700 px-4 py-2 font-bold text-white" onClick={copyCode}>
              {copied ? '✓ Copiado' : 'Copiar código (alternativa al QR)'}
            </button>
            {role === 'central' && (
              <button
                className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-bold text-white"
                onClick={() => setScanning(true)}
              >
                📷 2. Escanear respuesta del scout
              </button>
            )}
          </div>
        )}

        {!connected && (role === 'central' || !role) && (
          <div className="space-y-2">
            <textarea
              className="w-full rounded-lg bg-slate-800 p-2 text-xs text-slate-300"
              rows={3}
              placeholder={
                role === 'central'
                  ? 'O pega aquí el código de respuesta del scout…'
                  : 'Scout: o pega aquí el código de la central…'
              }
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
            />
            {pasted.trim() && (
              <button
                className="w-full rounded-lg bg-sky-600 px-4 py-2 font-bold text-white"
                onClick={() => handleCode(pasted)}
              >
                Usar código pegado
              </button>
            )}
          </div>
        )}

        {connected && (
          <p className="rounded-lg bg-emerald-900/40 p-3 text-sm text-emerald-300">
            {role === 'central'
              ? 'Recibiendo partidos automáticamente. Puedes volver a la app; la conexión sigue abierta.'
              : 'Enviando partidos automáticamente. Cada partido nuevo que guardes se enviará solo.'}
          </p>
        )}

        {role && (
          <button className="w-full rounded-lg bg-red-900 px-4 py-2 font-bold text-red-200" onClick={disconnect}>
            Desconectar
          </button>
        )}

        {scanning && (
          <Suspense fallback={null}>
            <QrScanner onClose={() => setScanning(false)} onDecode={handleCode} />
          </Suspense>
        )}
      </div>
    </div>
  )
}
