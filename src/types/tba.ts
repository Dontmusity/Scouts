export interface TbaTeam {
  team_number: number
  nickname: string
  key: string
}

export interface TbaRanking {
  rank: number
  team_key: string
  wins: number
  losses: number
  ties: number
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
