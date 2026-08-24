export type FieldType =
  | 'counter'
  | 'toggle'
  | 'dropdown'
  | 'rating'
  | 'fieldMap'
  | 'text'
  | 'number'
  | 'tags'

export interface BaseField {
  id: string
  label: string
  type: FieldType
  /** Which phase of the match this field belongs to. */
  phase: 'prematch' | 'auto' | 'teleop' | 'endgame' | 'pit' | 'subjective'
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

/**
 * Entrada numérica directa (teclado), para valores grandes que sería tedioso
 * contar con +/- (números de equipo aliados, puntaje de alianza). A diferencia
 * de counter, NO se suma en las estadísticas por equipo (ver teamStats).
 */
export interface NumberField extends BaseField {
  type: 'number'
  /** Sugerir los equipos del evento sincronizado (datalist) al escribir. */
  suggestTeams?: boolean
  /**
   * Incluir este campo en el promedio/picklist del dashboard (teamStats).
   * Por defecto NO: la mayoría de los campos "number" son identificadores
   * (números de equipo aliado), no puntaje — sumarlos rompería el ranking.
   * Actívalo solo en campos que sí sean una métrica de desempeño (puntaje).
   */
  countInStats?: boolean
  /**
   * Autocompletar este campo desde el cronograma oficial del evento
   * sincronizado, cuando # Partido y # Equipo coinciden con un partido real:
   * 'ally' → siguiente compañero de alianza (en orden, uno por campo);
   * 'score' → puntaje final oficial de la alianza (solo si ya se jugó);
   * 'opponentScore' → puntaje final oficial de la alianza contraria.
   * Nunca sobreescribe un valor que el scout ya haya escrito a mano.
   */
  autofill?: 'ally' | 'score' | 'opponentScore'
}

/**
 * Chips de selección múltiple (ej. "Rápido", "Juega defensa"). El valor se
 * guarda como un solo string separado por comas — MatchEntry.values solo
 * admite number | boolean | string, no arreglos.
 */
export interface TagsField extends BaseField {
  type: 'tags'
  options: string[]
}

export type GameField =
  | CounterField
  | ToggleField
  | DropdownField
  | RatingField
  | FieldMapField
  | TextField
  | NumberField
  | TagsField

export interface GameConfig {
  /** e.g. "reefscape-2025" — used as the IndexedDB partition key. */
  gameId: string
  gameName: string
  season: number
  mode: 'FRC' | 'FTC'
  fields: GameField[]
}

const FIELD_TYPES: FieldType[] = ['counter', 'toggle', 'dropdown', 'rating', 'fieldMap', 'text', 'number', 'tags']
const PHASES: BaseField['phase'][] = ['prematch', 'auto', 'teleop', 'endgame', 'pit', 'subjective']

/**
 * Valida un config antes de persistirlo — un config inválido guardado en
 * IndexedDB rompería el render en cada arranque sin forma de repararlo.
 * Lanza Error con mensaje en español apto para mostrar en el editor.
 */
export function validateGameConfig(parsed: unknown): GameConfig {
  const c = parsed as Partial<GameConfig>
  if (!c || typeof c !== 'object') throw new Error('El JSON debe ser un objeto.')
  if (typeof c.gameId !== 'string' || !c.gameId) throw new Error('Falta "gameId" (texto).')
  if (typeof c.gameName !== 'string' || !c.gameName) throw new Error('Falta "gameName" (texto).')
  if (typeof c.season !== 'number') throw new Error('Falta "season" (número).')
  if (c.mode !== 'FRC' && c.mode !== 'FTC') throw new Error('"mode" debe ser "FRC" o "FTC".')
  if (!Array.isArray(c.fields) || c.fields.length === 0) throw new Error('"fields" debe ser un arreglo con al menos un campo.')

  const ids = new Set<string>()
  for (const [i, f] of c.fields.entries()) {
    const at = `fields[${i}]`
    if (!f || typeof f !== 'object') throw new Error(`${at} debe ser un objeto.`)
    if (typeof f.id !== 'string' || !f.id) throw new Error(`${at}: falta "id" (texto).`)
    if (ids.has(f.id)) throw new Error(`${at}: id "${f.id}" repetido.`)
    ids.add(f.id)
    if (typeof f.label !== 'string' || !f.label) throw new Error(`${at}: falta "label" (texto).`)
    if (!FIELD_TYPES.includes(f.type)) throw new Error(`${at}: "type" debe ser uno de: ${FIELD_TYPES.join(', ')}.`)
    if (!PHASES.includes(f.phase)) throw new Error(`${at}: "phase" debe ser una de: ${PHASES.join(', ')}.`)
    if (f.type === 'dropdown' && (!Array.isArray(f.options) || f.options.some((o) => typeof o !== 'string')))
      throw new Error(`${at}: un dropdown necesita "options" (arreglo de textos).`)
    if (f.type === 'tags' && (!Array.isArray(f.options) || f.options.length === 0 || f.options.some((o) => typeof o !== 'string')))
      throw new Error(`${at}: un tags necesita "options" (arreglo de textos, no vacío).`)
    if (f.type === 'fieldMap' && typeof f.imageUrl !== 'string')
      throw new Error(`${at}: un fieldMap necesita "imageUrl" (texto).`)
    if (f.type === 'rating' && f.max !== undefined && typeof f.max !== 'number')
      throw new Error(`${at}: "max" debe ser un número.`)
    if (f.type === 'counter') {
      for (const k of ['min', 'max', 'step'] as const) {
        if (f[k] !== undefined && typeof f[k] !== 'number') throw new Error(`${at}: "${k}" debe ser un número.`)
      }
    }
  }
  return c as GameConfig
}
