import type { EventTeam, EventRanking } from '../types/tba'

const ENDPOINT = 'https://api.ftcscout.org/graphql'

async function ftcQuery<T>(query: string): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  if (!res.ok) throw new Error(`FTCScout ${res.status}`)
  const json = await res.json()
  if (json.errors) throw new Error(json.errors[0]?.message ?? 'FTCScout query error')
  return json.data
}

interface EventTeamsResponse {
  eventByCode: {
    name: string
    teams: { team: { number: number; name: string } }[]
  } | null
}

export async function fetchFtcEventTeams(season: number, code: string): Promise<EventTeam[]> {
  const data = await ftcQuery<EventTeamsResponse>(
    `query{ eventByCode(season: ${season}, code: "${code}") { name teams { team { number name } } } }`,
  )
  if (!data.eventByCode) throw new Error('Evento no encontrado en FTCScout')
  return data.eventByCode.teams
    .map((t) => ({ teamNumber: t.team.number, name: t.team.name }))
    .sort((a, b) => a.teamNumber - b.teamNumber)
}

interface EventRankingsResponse {
  eventByCode: {
    teams: { team: { number: number }; stats: { rank: number; wins: number; losses: number } | null }[]
  } | null
}

export async function fetchFtcEventRankings(season: number, code: string): Promise<EventRanking[]> {
  const data = await ftcQuery<EventRankingsResponse>(
    `query{ eventByCode(season: ${season}, code: "${code}") { teams { team { number } stats { ... on TeamEventStats${season} { rank wins losses } } } } }`,
  )
  if (!data.eventByCode) throw new Error('Evento no encontrado en FTCScout')
  return data.eventByCode.teams
    .filter((t) => t.stats)
    .map((t) => ({ rank: t.stats!.rank, teamNumber: t.team.number, wins: t.stats!.wins, losses: t.stats!.losses }))
    .sort((a, b) => a.rank - b.rank)
}
