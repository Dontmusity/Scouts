import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export function QrCode({ text }: { text: string }) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    QRCode.toDataURL(text, { width: 320, margin: 1 }).then((url) => {
      if (!cancelled) setSrc(url)
    })
    return () => {
      cancelled = true
    }
  }, [text])

  if (!src) return <div className="h-80 w-80 animate-pulse rounded-lg bg-slate-800" />
  return <img src={src} alt="QR" className="mx-auto rounded-lg bg-white p-2" />
}
