import type { GameConfig } from '../types/gameConfig'

/**
 * FTC 2026-2027 BIOBUZZ (Competition Manual TU02, sección 10).
 * Puntos: LEAVE 3 (auto) · PARK 5 (auto y fin) · HIVE TIP 20 · POLLEN/NECTAR en CELL al final 2 ·
 * FLOWER poseída 2 por elemento + Bottom NECTAR 5 · GARDEN 1. FLOWERS solo en el último minuto.
 * RP: SWARM (LEAVE+PARK ≥ 16), POLLINATOR 1/2 (≥ 4 / 7 TIPS).
 */
export const biobuzzConfig: GameConfig = {
  gameId: 'ftc-biobuzz-2026',
  gameName: 'FTC BIOBUZZ',
  season: 2026,
  mode: 'FTC',
  fields: [
    // En FTC la alianza es de 2 equipos: solo 1 aliado
    { id: 'allyTeam1', label: 'Aliado (# de equipo)', type: 'number', phase: 'prematch', suggestTeams: true, autofill: 'ally' },

    // Autónomo (30 s)
    { id: 'startSpot', label: 'Punto de inicio (clic en el campo)', type: 'fieldMap', phase: 'auto', imageUrl: './field-placeholder.svg' },
    { id: 'autoLeave', label: 'LEAVE (dejó la pared)', type: 'toggle', phase: 'auto', points: 3 },
    { id: 'autoPark', label: 'PARK en LOADING ZONE al final de Auto', type: 'toggle', phase: 'auto', points: 5 },
    { id: 'autoLaunched', label: 'Elementos lanzados a la CELL (Auto)', type: 'counter', phase: 'auto', min: 0 },
    { id: 'autoTips', label: 'HIVE TIPs completados (Auto)', type: 'counter', phase: 'auto', min: 0, points: 20 },
    { id: 'officialAutoPoints', label: 'Puntos de Auto (oficial)', type: 'number', phase: 'auto', autofill: 'breakdownOwn', breakdownKey: 'autoPoints' },

    // TeleOp (2 min)
    { id: 'teleopLaunched', label: 'Elementos lanzados a la CELL (TeleOp)', type: 'counter', phase: 'teleop', min: 0 },
    { id: 'teleopTips', label: 'HIVE TIPs completados (TeleOp)', type: 'counter', phase: 'teleop', min: 0, points: 20 },
    { id: 'gardenElements', label: 'Elementos llevados al GARDEN', type: 'counter', phase: 'teleop', min: 0, points: 1 },
    { id: 'launchAccuracy', label: 'Precisión al lanzar', type: 'rating', phase: 'teleop', max: 5 },
    { id: 'defensePlayed', label: 'Jugó defensa', type: 'toggle', phase: 'teleop' },

    // Último minuto: FLOWERS + PARK
    { id: 'flowerElements', label: 'Elementos colocados en FLOWERS', type: 'counter', phase: 'endgame', min: 0, points: 2 },
    { id: 'flowerNectar', label: 'Puso NECTAR arriba (reclamó FLOWER)', type: 'toggle', phase: 'endgame' },
    { id: 'endPark', label: 'PARK en LOADING ZONE al final', type: 'toggle', phase: 'endgame', points: 5 },
    { id: 'allianceScore', label: 'Puntaje final de la alianza', type: 'number', phase: 'endgame', countInStats: true, autofill: 'score' },
    { id: 'opponentAllianceScore', label: 'Puntaje final de la alianza contraria', type: 'number', phase: 'endgame', autofill: 'opponentScore' },

    // Subjetivo
    { id: 'driverSkill', label: 'Habilidad del piloto', type: 'rating', phase: 'subjective', max: 5 },
    { id: 'robotSpeed', label: 'Velocidad del robot', type: 'rating', phase: 'subjective', max: 5 },
    {
      id: 'tags',
      label: 'Etiquetas rápidas',
      type: 'tags',
      phase: 'subjective',
      options: ['Rápido', 'Preciso', 'Buen piloto', 'Juega defensa', 'Falta (foul)', 'Se descompuso', 'Inconsistente'],
    },
    { id: 'notes', label: 'Notas', type: 'text', phase: 'subjective' },

    // Pit
    { id: 'drivetrainType', label: 'Tipo de tren motriz', type: 'dropdown', phase: 'pit', options: ['Mecanum', 'Swerve', 'Tanque', 'Otro'] },
    { id: 'pitCanLaunch', label: 'Puede lanzar a la CELL', type: 'toggle', phase: 'pit' },
    { id: 'pitCanFlower', label: 'Puede colocar en FLOWERS', type: 'toggle', phase: 'pit' },
    { id: 'pitAutoTips', label: 'TIPs que promete en Auto', type: 'number', phase: 'pit' },
    { id: 'pitNotes', label: 'Notas del robot', type: 'text', phase: 'pit' },
  ],
}
