import type { GameConfig } from '../types/gameConfig'

/**
 * Config de la temporada — editable desde la pestaña Admin.
 * Nota: cambiar gameId inicia una partición nueva de partidos en IndexedDB.
 */
export const exampleGameConfig: GameConfig = {
  gameId: 'frc-2026',
  gameName: 'FRC 2026',
  season: 2026,
  mode: 'FRC',
  fields: [
    // Inicio: con qué otros equipos estaba la alianza
    { id: 'allyTeam1', label: 'Aliado 1 (# de equipo)', type: 'number', phase: 'prematch', suggestTeams: true },
    { id: 'allyTeam2', label: 'Aliado 2 (# de equipo)', type: 'number', phase: 'prematch', suggestTeams: true },

    // Autónomo
    { id: 'startPosition', label: 'Posición inicial', type: 'dropdown', phase: 'auto', options: ['Izquierda', 'Centro', 'Derecha'] },
    { id: 'startSpot', label: 'Punto de inicio (clic en el campo)', type: 'fieldMap', phase: 'auto', imageUrl: './field-placeholder.svg' },
    { id: 'autoMobility', label: 'Salió de zona (Mobility)', type: 'toggle', phase: 'auto' },
    { id: 'autoShooter', label: 'Funcionalidad del shooter (Auto)', type: 'rating', phase: 'auto', max: 5 },

    // TeleOp
    { id: 'teleopShooter', label: 'Funcionalidad del shooter (TeleOp)', type: 'rating', phase: 'teleop', max: 5 },
    { id: 'movesBalls', label: 'Desplaza pelotas', type: 'toggle', phase: 'teleop' },
    { id: 'defensePlayed', label: 'Jugó defensa', type: 'toggle', phase: 'teleop' },

    // Endgame
    { id: 'endgameClimb', label: 'Resultado de Endgame', type: 'dropdown', phase: 'endgame', options: ['Ninguno', 'Parqueado', 'Colgado - Bajo', 'Colgado - Alto'] },
    { id: 'allianceScore', label: 'Puntaje final de la alianza', type: 'number', phase: 'endgame' },

    // Subjetivo
    { id: 'driverSkill', label: 'Habilidad del piloto', type: 'rating', phase: 'subjective', max: 5 },
    { id: 'robotSpeed', label: 'Velocidad del robot', type: 'rating', phase: 'subjective', max: 5 },
    { id: 'notes', label: 'Notas', type: 'text', phase: 'subjective' },
  ],
}
