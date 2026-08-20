import type { TbaTeam, TbaRanking, TbaAlliance, EventTeam, EventRanking } from '../types/tba'

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

export async function fetchTbaAlliances(eventKey: string, apiKey: string): Promise<string[][]> {
  const alliances = await tbaGet<TbaAlliance[]>(`/event/${eventKey}/alliances`, apiKey)
  return alliances.map((a) => a.picks.map((p) => p.replace('frc', '')))
}
