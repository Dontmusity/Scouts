import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export function QrCode({ text }: { text: string }) {
  const [src, setSrc] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setError(false)
    QRCode.toDataURL(text, { width: 320, margin: 1 })
      .then((url) => {
        if (!cancelled) setSrc(url)
      })
      .catch(() => {
        // p.ej. notas muy largas exceden la capacidad del QR (~2.9 KB)
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [text])

  if (error) {
    return (
      <p className="max-w-xs rounded-lg bg-red-950 p-4 text-center text-sm font-bold text-red-300">
        Los datos son demasiado grandes para un QR. Usa la sincronización por Wi-Fi o la exportación JSON.
      </p>
    )
  }
  if (!src) return <div className="h-80 w-80 animate-pulse rounded-lg bg-slate-800" />
  return <img src={src} alt="QR" className="mx-auto rounded-lg bg-white p-2" />
}
