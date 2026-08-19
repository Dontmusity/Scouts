import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode'
import { useScoutStore } from '../store/useScoutStore'
import { decompressMatch } from '../lib/qr'

const READER_ID = 'qr-reader'

export function QrScanner({
  onClose,
  onDecode,
}: {
  onClose: () => void
  /** Si se pasa, reemplaza la importación de partidos (p. ej. escanear un SDP de sincronización). */
  onDecode?: (text: string) => Promise<void>
}) {
  const addMatch = useScoutStore((s) => s.addMatch)
  const [log, setLog] = useState<string[]>([])
  const lastScanned = useRef<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  // ref para que un onDecode nuevo en cada render no reinicie la cámara
  const onDecodeRef = useRef(onDecode)
  onDecodeRef.current = onDecode

  useEffect(() => {
    const scanner = new Html5Qrcode(READER_ID)
    scannerRef.current = scanner
    let cancelled = false

    function stopAndClear() {
      // html5-qrcode throws synchronously (not a rejection) if stop() is
      // called while not scanning — guard with getState() either way.
      try {
        if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
          scanner.stop().catch(() => {}).finally(() => scanner.clear())
        } else {
          scanner.clear()
        }
      } catch {
        /* camera never started */
      }
    }

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        async (decodedText) => {
          if (decodedText === lastScanned.current) return
          lastScanned.current = decodedText
          try {
            if (onDecodeRef.current) {
              await onDecodeRef.current(decodedText)
              return
            }
            const match = decompressMatch(decodedText)
            await addMatch(match)
            setLog((prev) => [`✓ Partido ${match.matchNumber} · Equipo ${match.teamNumber}`, ...prev])
          } catch {
            setLog((prev) => [`✗ Código QR no reconocido`, ...prev])
          }
        },
        () => {},
      )
      .then(() => {
        // effect was already cleaned up (e.g. StrictMode's mount/cleanup/remount)
        // before the camera finished starting — stop it now instead of leaking it.
        if (cancelled) stopAndClear()
      })
      .catch((err) => setLog((prev) => [`✗ No se pudo abrir la cámara: ${err}`, ...prev]))

    return () => {
      cancelled = true
      stopAndClear()
    }
  }, [addMatch])

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950 p-4">
      <button className="mb-4 rounded-lg bg-slate-700 px-4 py-2 font-bold text-white" onClick={onClose}>
        ← Cerrar escáner
      </button>
      <div id={READER_ID} className="mx-auto max-w-sm overflow-hidden rounded-lg" />
      <ul className="mx-auto mt-4 max-w-sm space-y-1 text-sm text-slate-300">
        {log.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
    </div>
  )
}
