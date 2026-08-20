const FILLER_WORDS = /\b(the|team|robotics|de|equipo|el|la|los|las)\b/gi

/**
 * "254 · Cheesy Poofs" en vez de "254 · The Cheesy Poofs Robotics Team" —
 * quita relleno para que quepa en chips angostos en pantallas chicas.
 */
export function formatTeamLabel(teamNumber: string, name: string | undefined, showName: boolean): string {
  if (!showName || !name) return teamNumber
  const stripped = name.replace(FILLER_WORDS, ' ').replace(/\s+/g, ' ').trim()
  return `${teamNumber} · ${stripped || name}`
}
