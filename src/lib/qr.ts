import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import { validateMatchEntry, type MatchEntry } from './db'

export function compressMatch(match: MatchEntry): string {
  return compressToEncodedURIComponent(JSON.stringify(match))
}

export function decompressMatch(text: string): MatchEntry {
  const json = decompressFromEncodedURIComponent(text)
  if (!json) throw new Error('Código QR inválido o corrupto')
  return validateMatchEntry(JSON.parse(json))
}
