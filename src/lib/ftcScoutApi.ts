import type { EventTeam, EventRanking, EventMatch } from '../types/tba'

const ENDPOINT = 'https://api.ftcscout.org/graphql'

async function ftcQuery<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) throw new Error(`FTCScout ${res.status}`)
  const json = await res.json()
  if (json.errors) {
    const msg: string = json.errors[0]?.message ?? 'FTCScout query error'
    // El schema tiene un tipo por temporada (MatchScores2025, TeamEventStats2025…).
    // Para una temporada que FTCScout todavía no publica, el error crudo es
    // "Unknown type" — intraducible para un scout en la arena.
    if (/Unknown type|Cannot query field/i.test(msg)) {
      const season = variables.season
      throw new Error(`FTCScout aún no tiene datos de la temporada ${season}. Prueba con la temporada anterior.`)
    }
    throw new Error(msg)
  }
  return json.data
}

function assertSeason(season: number): void {
  if (!Number.isInteger(season) || season < 2019) {
    throw new Error('Temporada inválida — usa el año de inicio, p.ej. 2024.')
  }
}

interface EventTeamsResponse {
  eventByCode: {
    name: string
    teams: { team: { number: number; name: string } }[]
  } | null
}

export async function fetchFtcEventTeams(season: number, code: string): Promise<EventTeam[]> {
  assertSeason(season)
  const data = await ftcQuery<EventTeamsResponse>(
    `query($season: Int!, $code: String!){ eventByCode(season: $season, code: $code) { name teams { team { number name } } } }`,
    { season, code: code.trim() },
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

interface EventMatchesResponse {
  eventByCode: {
    matches: {
      matchNum: number
      teams: { teamNumber: number; alliance: 'Red' | 'Blue' }[]
      scores: { red: { totalPoints: number } | null; blue: { totalPoints: number } | null } | null
    }[]
  } | null
}

export async function fetchFtcEventMatches(season: number, code: string): Promise<EventMatch[]> {
  assertSeason(season)
  const data = await ftcQuery<EventMatchesResponse>(
    `query($season: Int!, $code: String!){ eventByCode(season: $season, code: $code) { matches { matchNum teams { teamNumber alliance } scores { ... on MatchScores${season} { red { totalPoints } blue { totalPoints } } } } } }`,
    { season, code: code.trim() },
  )
  if (!data.eventByCode) throw new Error('Evento no encontrado en FTCScout')
  return data.eventByCode.matches.map((m) => ({
    matchNumber: m.matchNum,
    red: m.teams.filter((t) => t.alliance === 'Red').map((t) => t.teamNumber),
    blue: m.teams.filter((t) => t.alliance === 'Blue').map((t) => t.teamNumber),
    redScore: m.scores?.red?.totalPoints ?? null,
    blueScore: m.scores?.blue?.totalPoints ?? null,
  }))
}

export async function fetchFtcEventRankings(season: number, code: string): Promise<EventRanking[]> {
  assertSeason(season)
  // El nombre del fragmento (TeamEventStats<año>) no admite variables GraphQL;
  // assertSeason ya garantizó que season es un entero antes de interpolarlo.
  const data = await ftcQuery<EventRankingsResponse>(
    `query($season: Int!, $code: String!){ eventByCode(season: $season, code: $code) { teams { team { number } stats { ... on TeamEventStats${season} { rank wins losses } } } } }`,
    { season, code: code.trim() },
  )
  if (!data.eventByCode) throw new Error('Evento no encontrado en FTCScout')
  return data.eventByCode.teams
    .filter((t) => t.stats)
    .map((t) => ({ rank: t.stats!.rank, teamNumber: t.team.number, wins: t.stats!.wins, losses: t.stats!.losses }))
    .sort((a, b) => a.rank - b.rank)
}
