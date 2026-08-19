import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import type { MatchEntry } from './db'

export function compressMatch(match: MatchEntry): string {
  return compressToEncodedURIComponent(JSON.stringify(match))
}

export function decompressMatch(text: string): MatchEntry {
  const json = decompressFromEncodedURIComponent(text)
  if (!json) throw new Error('Código QR inválido o corrupto')
  return JSON.parse(json) as MatchEntry
}
