import type { Tier } from '../store/usePicklistStore'

const TIER_RANK: Record<Exclude<Tier, 'uncategorized'>, number> = {
  tier1: 1,
  tier2: 2,
  tier3: 3,
  doNotPick: 4,
}
const RANK_TIER: Tier[] = ['uncategorized', 'tier1', 'tier2', 'tier3', 'doNotPick']

/**
 * Combina las picklists de todos los scouts en una sola: para cada equipo,
 * promedia el rango numérico de tier entre los scouts que lo clasificaron
 * (ignora a quienes lo dejaron sin clasificar) y redondea al tier más cercano.
 */
export function computeMergedTiers(assignments: Record<string, Record<string, Tier>>): Record<string, Tier> {
  const ranksByTeam = new Map<string, number[]>()
  for (const scoutAssignments of Object.values(assignments)) {
    for (const [teamNumber, tier] of Object.entries(scoutAssignments)) {
      if (tier === 'uncategorized') continue
      const list = ranksByTeam.get(teamNumber) ?? []
      list.push(TIER_RANK[tier])
      ranksByTeam.set(teamNumber, list)
    }
  }

  const merged: Record<string, Tier> = {}
  for (const [teamNumber, ranks] of ranksByTeam) {
    const avg = ranks.reduce((a, b) => a + b, 0) / ranks.length
    merged[teamNumber] = RANK_TIER[Math.min(4, Math.max(1, Math.round(avg)))]
  }
  return merged
}
