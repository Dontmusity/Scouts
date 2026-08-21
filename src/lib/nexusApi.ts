/**
 * Cliente de la API de Nexus (frc.nexus) — estado en vivo del evento.
 *
 * Verificado contra la API real (agosto 2026): la autenticación es el header
 * `Nexus-Api-Key`, y estos son los tres endpoints válidos. La forma del "sobre"
 * de cada respuesta está confirmada; lo que NO se pudo verificar es el interior
 * de `matches[]` ni el mapa de pits, porque en temporada baja ningún evento
 * publicado tiene datos todavía. Por eso todo lo de adentro se lee de forma
 * tolerante (varios nombres de campo posibles) y la app expone la respuesta
 * cruda en la pestaña Eventos para poder ajustar esto en el evento real.
 */

const BASE = 'https://frc.nexus/api/v1'

async function nexusGet<T>(path: string, apiKey: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: { 'Nexus-Api-Key': apiKey } })
  const body = await res.text()
  if (!res.ok) {
    // Nexus responde con un string JSON explicando el problema.
    let msg = body
    try {
      const parsed: unknown = JSON.parse(body)
      if (typeof parsed === 'string') msg = parsed
    } catch {
      /* no era JSON; se usa el texto crudo */
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error('Llave de Nexus inválida o faltante. Revísala en frc.nexus/api.')
    }
    throw new Error(msg || `Nexus ${res.status}`)
  }
  return JSON.parse(body) as T
}

export interface NexusEventSummary {
  eventKey: string
  name: string
  start: number
  end: number
}

/** GET /events → { "2026azscor": { name, start, end }, … } (verificado) */
export async function fetchNexusEvents(apiKey: string): Promise<NexusEventSummary[]> {
  const raw = await nexusGet<Record<string, { name: string; start: number; end: number }>>('/events', apiKey)
  return Object.entries(raw)
    .map(([eventKey, v]) => ({ eventKey, name: v.name, start: v.start, end: v.end }))
    .sort((a, b) => a.start - b.start)
}

export interface NexusMatch {
  /** Etiqueta oficial, p.ej. "Qualification 12". */
  label: string
  /** Estado del partido: en cola, en campo, jugado… */
  status: string
  /** Hora estimada (epoch ms) si Nexus la publica. */
  estimatedTime: number | null
  /** Número de partido si se puede deducir de la etiqueta. */
  matchNumber: number | null
}

export interface NexusEventStatus {
  eventKey: string
  dataAsOfTime: number | null
  matches: NexusMatch[]
  announcements: string[]
  /** Respuesta cruda, para diagnosticar la forma real en el evento. */
  raw: unknown
}

/** Primer valor no vacío entre varios nombres de campo posibles. */
function pick(obj: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) {
    const v = obj[k]
    if (v !== undefined && v !== null && v !== '') return v
  }
  return undefined
}

function toMatch(m: unknown): NexusMatch | null {
  if (!m || typeof m !== 'object') return null
  const o = m as Record<string, unknown>
  const label = String(pick(o, ['label', 'name', 'matchLabel', 'title']) ?? '')
  const status = String(pick(o, ['status', 'state', 'matchStatus']) ?? '')
  if (!label && !status) return null

  const timeRaw = pick(o, ['estimatedStartTime', 'estimatedTime', 'scheduledTime', 'startTime', 'time'])
  const estimatedTime = typeof timeRaw === 'number' && Number.isFinite(timeRaw) ? timeRaw : null

  const numRaw = pick(o, ['matchNumber', 'number', 'matchNum'])
  let matchNumber = typeof numRaw === 'number' ? numRaw : null
  if (matchNumber === null) {
    // "Qualification 12" / "Q12" → 12
    const found = label.match(/(\d+)\s*$/)
    if (found) matchNumber = Number(found[1])
  }
  return { label, status, estimatedTime, matchNumber }
}

/** GET /event/{key} → { eventKey, dataAsOfTime, matches[], announcements[], partsRequests[] } (sobre verificado) */
export async function fetchNexusEventStatus(eventKey: string, apiKey: string): Promise<NexusEventStatus> {
  const raw = await nexusGet<Record<string, unknown>>(`/event/${encodeURIComponent(eventKey)}`, apiKey)
  const rawMatches = Array.isArray(raw.matches) ? raw.matches : []
  const rawAnn = Array.isArray(raw.announcements) ? raw.announcements : []
  return {
    eventKey: typeof raw.eventKey === 'string' ? raw.eventKey : eventKey,
    dataAsOfTime: typeof raw.dataAsOfTime === 'number' ? raw.dataAsOfTime : null,
    matches: rawMatches.map(toMatch).filter((m): m is NexusMatch => m !== null),
    announcements: rawAnn
      .map((a) => (typeof a === 'string' ? a : String((a as Record<string, unknown>)?.message ?? (a as Record<string, unknown>)?.title ?? '')))
      .filter(Boolean),
    raw,
  }
}

/**
 * GET /event/{key}/pits → ubicación del pit por equipo.
 * Devuelve `"No pits."` (string) cuando el evento no tiene pits cargados.
 */
export async function fetchNexusPits(eventKey: string, apiKey: string): Promise<Record<string, string>> {
  const raw = await nexusGet<unknown>(`/event/${encodeURIComponent(eventKey)}/pits`, apiKey)
  if (typeof raw === 'string' || !raw || typeof raw !== 'object') return {}

  const out: Record<string, string> = {}
  for (const [team, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === 'string') out[team] = value
    else if (value && typeof value === 'object') {
      const loc = pick(value as Record<string, unknown>, ['pit', 'location', 'address', 'label', 'name'])
      if (loc !== undefined) out[team] = String(loc)
    } else if (typeof value === 'number') out[team] = String(value)
  }
  return out
}
