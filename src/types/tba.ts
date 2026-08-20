export interface TbaTeam {
  team_number: number
  nickname: string
  key: string
}

export interface TbaRanking {
  rank: number
  team_key: string
  /** TBA anida el récord aquí; puede venir null si el evento aún no juega. */
  record: { wins: number; losses: number; ties: number } | null
}

export interface TbaAlliance {
  name: string
  picks: string[]
}

export interface EventTeam {
  teamNumber: number
  name: string
}

export interface EventRanking {
  rank: number
  teamNumber: number
  wins: number
  losses: number
}
