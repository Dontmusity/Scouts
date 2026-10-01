import { XIcon } from '@phosphor-icons/react'
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
    <div className="fixed inset-0 z-50 flex flex-col gap-4 overflow-y-auto bg-n12 p-5">
      <div className="flex items-center justify-between">
        <p className="text-xl font-extrabold">Escanear QR</p>
        <button aria-label="Cerrar" className="flex h-12 w-12 items-center justify-center rounded-xl bg-n27" onClick={onClose}>
          <XIcon size={20} weight="bold" />
        </button>
      </div>
      <div id={READER_ID} className="mx-auto w-full max-w-md overflow-hidden rounded-[18px] bg-n19" />
      <p className="text-center text-[15px] text-n75">Apunta al QR del scout. Se agrega solo al leerlo.</p>
      <ul className="mx-auto w-full max-w-md space-y-1 text-sm text-n75">
        {log.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
    </div>
  )
}
