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

/** Un solo valor primitivo del desglose oficial — ver GameField.breakdownKey. */
export type BreakdownValue = number | boolean | string
export type AllianceBreakdown = Record<string, BreakdownValue>

/** Partido oficial del cronograma del evento — usado para autocompletar aliados y puntaje. */
export interface EventMatch {
  matchNumber: number
  red: number[]
  blue: number[]
  /** null hasta que el partido se jugó/publicó el resultado. */
  redScore: number | null
  blueScore: number | null
  /** Desglose de puntaje por categoría (auto/teleop/penalizaciones…); null si no está disponible. */
  redBreakdown: AllianceBreakdown | null
  blueBreakdown: AllianceBreakdown | null
}
