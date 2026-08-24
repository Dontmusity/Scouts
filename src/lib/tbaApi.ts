import type { AllianceBreakdown, TbaTeam, TbaRanking, TbaAlliance, EventTeam, EventRanking, EventMatch } from '../types/tba'

interface TbaMatchAlliance {
  team_keys: string[]
  /** -1 o null si el partido no se ha jugado. */
  score: number | null
}

interface TbaMatch {
  comp_level: string
  match_number: number
  alliances: { red: TbaMatchAlliance; blue: TbaMatchAlliance }
  /** Claves específicas del juego de esa temporada — TBA no las estandariza año con año. */
  score_breakdown: { red?: Record<string, unknown>; blue?: Record<string, unknown> } | null
}

/** Se queda solo con valores primitivos (número/booleano/texto) — MatchEntry.values no admite otra cosa. */
function toBreakdown(raw: Record<string, unknown> | undefined): AllianceBreakdown | null {
  if (!raw) return null
  const out: AllianceBreakdown = {}
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'string') out[k] = v
  }
  return out
}

const BASE = 'https://www.thebluealliance.com/api/v3'

async function tbaGet<T>(path: string, apiKey: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: { 'X-TBA-Auth-Key': apiKey } })
  if (!res.ok) throw new Error(`TBA ${res.status}: ${await res.text()}`)
  return res.json()
}

export async function fetchTbaTeams(eventKey: string, apiKey: string): Promise<EventTeam[]> {
  const teams = await tbaGet<TbaTeam[]>(`/event/${eventKey}/teams/simple`, apiKey)
  return teams
    .map((t) => ({ teamNumber: t.team_number, name: t.nickname }))
    .sort((a, b) => a.teamNumber - b.teamNumber)
}

export async function fetchTbaRankings(eventKey: string, apiKey: string): Promise<EventRanking[]> {
  const data = await tbaGet<{ rankings: TbaRanking[] | null } | null>(`/event/${eventKey}/rankings`, apiKey)
  return (data?.rankings ?? []).map((r) => ({
    rank: r.rank,
    teamNumber: Number(r.team_key.replace('frc', '')),
    wins: r.record?.wins ?? 0,
    losses: r.record?.losses ?? 0,
  }))
}

export async function fetchTbaMatches(eventKey: string, apiKey: string): Promise<EventMatch[]> {
  // Nota: /matches (no /matches/simple) porque score_breakdown solo viene en el endpoint completo.
  const matches = await tbaGet<TbaMatch[]>(`/event/${eventKey}/matches`, apiKey)
  const toTeams = (a: TbaMatchAlliance) => a.team_keys.map((k) => Number(k.replace('frc', '')))
  const toScore = (a: TbaMatchAlliance) => (a.score !== null && a.score >= 0 ? a.score : null)
  return matches
    .filter((m) => m.comp_level === 'qm') // solo calificación: los ids de playoffs no coinciden con lo que el scout escribe
    .map((m) => ({
      matchNumber: m.match_number,
      red: toTeams(m.alliances.red),
      blue: toTeams(m.alliances.blue),
      redScore: toScore(m.alliances.red),
      blueScore: toScore(m.alliances.blue),
      redBreakdown: toBreakdown(m.score_breakdown?.red),
      blueBreakdown: toBreakdown(m.score_breakdown?.blue),
    }))
}

export async function fetchTbaAlliances(eventKey: string, apiKey: string): Promise<string[][]> {
  const alliances = await tbaGet<TbaAlliance[]>(`/event/${eventKey}/alliances`, apiKey)
  return alliances.map((a) => a.picks.map((p) => p.replace('frc', '')))
}
