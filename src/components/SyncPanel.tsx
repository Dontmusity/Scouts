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

export function SyncPanel() {
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
  const dotColor = connected ? 'bg-grn' : status === 'connecting' ? 'bg-warn' : 'bg-n60'

  return (
    <section className="flex flex-col gap-3.5 rounded-[18px] bg-n215 p-[18px]">
      <div className="contents">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className={`h-3 w-3 rounded-full ${dotColor}`} />
          <span className="flex-1 text-[17px] font-bold text-fg">{STATUS_LABEL[status] ?? status}</span>
          {role && (
            <span className="font-mono text-[13px] text-n75">
              {role === 'central' ? `${count} recibidos` : `${count} enviados`}
            </span>
          )}
        </div>

        {error && <p className="rounded-xl bg-bad-t p-3 text-sm">{error}</p>}

        {!role && (
          <div className="space-y-3">
            <p className="text-sm text-n72">
              Ambos dispositivos deben estar en la misma red Wi-Fi o hotspot. Elige el rol de este dispositivo:
            </p>
            <button
              className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-acc px-4 font-extrabold text-on-acc"
              onClick={() => startCentral().catch(() => setError('No se pudo crear la conexión.'))}
            >
              Central (recibe)
            </button>
            <button
              className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-n27 px-4 font-bold"
              onClick={() => setScanning(true)}
            >
              Scout (envía) — escanear QR de la central
            </button>
          </div>
        )}

        {role && !connected && localCode && (
          <div className="space-y-3 text-center">
            <p className="text-sm text-n72">
              {role === 'central'
                ? '1. El scout toca "Scout (envía)" y escanea este QR.'
                : 'Muestra este QR a la central para que lo escanee.'}
            </p>
            <QrCode text={localCode} />
            <button className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-n27 px-3.5 font-bold" onClick={copyCode}>
              {copied ? '✓ Copiado' : 'Copiar código (alternativa al QR)'}
            </button>
            {role === 'central' && (
              <button
                className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-acc px-4 font-extrabold text-on-acc"
                onClick={() => setScanning(true)}
              >
                2 · Escanear respuesta del scout
              </button>
            )}
          </div>
        )}

        {!connected && (role === 'central' || !role) && (
          <div className="space-y-2">
            <textarea
              className="w-full rounded-xl border border-n33 bg-n19 px-3 py-2.5 font-mono text-[13px]"
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
                className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-acc font-extrabold text-on-acc"
                onClick={() => handleCode(pasted)}
              >
                Conectar
              </button>
            )}
          </div>
        )}

        {connected && (
          <p className="text-sm text-n75">
            {role === 'central'
              ? 'Recibiendo partidos automáticamente. Puedes volver a la app; la conexión sigue abierta.'
              : 'Enviando partidos automáticamente. Cada partido nuevo que guardes se enviará solo.'}
          </p>
        )}

        {role && (
          <button className="min-h-12 self-start rounded-xl border border-n33 px-4 font-bold" onClick={disconnect}>
            Desconectar
          </button>
        )}

        {scanning && (
          <Suspense fallback={null}>
            <QrScanner onClose={() => setScanning(false)} onDecode={handleCode} />
          </Suspense>
        )}
      </div>
    </section>
  )
}
