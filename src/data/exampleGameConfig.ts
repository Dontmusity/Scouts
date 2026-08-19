import type { GameConfig } from '../types/gameConfig'

/**
 * Plantilla de ejemplo — no corresponde a un juego oficial real.
 * Edítala desde la pestaña Admin o reemplázala por el JSON del juego de la temporada.
 */
export const exampleGameConfig: GameConfig = {
  gameId: 'example-2026',
  gameName: 'Juego de Ejemplo',
  season: 2026,
  mode: 'FRC',
  fields: [
    { id: 'startPosition', label: 'Posición inicial', type: 'dropdown', phase: 'auto', options: ['Izquierda', 'Centro', 'Derecha'] },
    { id: 'autoMobility', label: 'Salió de zona (Mobility)', type: 'toggle', phase: 'auto' },
    { id: 'autoScored', label: 'Piezas anotadas (Auto)', type: 'counter', phase: 'auto', min: 0, max: 20, step: 1 },
    { id: 'teleopScoredLow', label: 'Piezas anotadas — Bajo', type: 'counter', phase: 'teleop', min: 0, max: 30, step: 1 },
    { id: 'teleopScoredHigh', label: 'Piezas anotadas — Alto', type: 'counter', phase: 'teleop', min: 0, max: 30, step: 1 },
    { id: 'defensePlayed', label: 'Jugó defensa', type: 'toggle', phase: 'teleop' },
    { id: 'endgameClimb', label: 'Resultado de Endgame', type: 'dropdown', phase: 'endgame', options: ['Ninguno', 'Parqueado', 'Colgado - Bajo', 'Colgado - Alto'] },
    { id: 'driverSkill', label: 'Habilidad del piloto', type: 'rating', phase: 'subjective', max: 5 },
    { id: 'robotSpeed', label: 'Velocidad del robot', type: 'rating', phase: 'subjective', max: 5 },
    { id: 'startSpot', label: 'Punto de inicio (clic en el campo)', type: 'fieldMap', phase: 'auto', imageUrl: './field-placeholder.svg' },
    { id: 'notes', label: 'Notas', type: 'text', phase: 'subjective' },
  ],
}
