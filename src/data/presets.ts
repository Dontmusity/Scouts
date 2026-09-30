import type { GameConfig } from '../types/gameConfig'
import { exampleGameConfig } from './exampleGameConfig'
import { biobuzzConfig } from './biobuzzConfig'

export const presets: GameConfig[] = [exampleGameConfig, biobuzzConfig]

/**
 * Un config guardado antes de que existiera "points" no traería los puntos del preset;
 * los completa por id de campo sin tocar nada que el usuario haya editado.
 */
export function withPresetPoints(config: GameConfig): GameConfig {
  const preset = presets.find((p) => p.gameId === config.gameId)
  if (!preset) return config
  const pts = new Map(preset.fields.filter((f) => f.points !== undefined).map((f) => [f.id, f.points]))
  return { ...config, fields: config.fields.map((f) => (f.points === undefined && pts.has(f.id) ? { ...f, points: pts.get(f.id) } : f)) }
}
