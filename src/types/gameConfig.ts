export type FieldType =
  | 'counter'
  | 'toggle'
  | 'dropdown'
  | 'rating'
  | 'fieldMap'
  | 'text'

export interface BaseField {
  id: string
  label: string
  type: FieldType
  /** Which phase of the match this field belongs to. */
  phase: 'auto' | 'teleop' | 'endgame' | 'pit' | 'subjective'
}

export interface CounterField extends BaseField {
  type: 'counter'
  min?: number
  max?: number
  step?: number
}

export interface ToggleField extends BaseField {
  type: 'toggle'
}

export interface DropdownField extends BaseField {
  type: 'dropdown'
  options: string[]
}

export interface RatingField extends BaseField {
  type: 'rating'
  max?: number // defaults to 5
}

export interface FieldMapField extends BaseField {
  type: 'fieldMap'
  /** URL/path to the field image used as the click target background. */
  imageUrl: string
}

export interface TextField extends BaseField {
  type: 'text'
}

export type GameField =
  | CounterField
  | ToggleField
  | DropdownField
  | RatingField
  | FieldMapField
  | TextField

export interface GameConfig {
  /** e.g. "reefscape-2025" — used as the IndexedDB partition key. */
  gameId: string
  gameName: string
  season: number
  mode: 'FRC' | 'FTC'
  fields: GameField[]
}
