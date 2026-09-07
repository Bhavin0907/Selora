/**
 * Presentation-only level derivation from total verified savings.
 * Pure + deterministic. Does NOT affect any game logic or the store —
 * it's purely a HUD flourish. Each level needs progressively more savings.
 */
export function computeLevel(totalSavings: number): number {
  if (totalSavings <= 0) return 1
  // level grows with the square root of savings for a satisfying curve
  return Math.floor(Math.sqrt(totalSavings / 500)) + 1
}

export function levelProgress(totalSavings: number): number {
  const lvl = computeLevel(totalSavings)
  const curr = Math.pow(lvl - 1, 2) * 500
  const next = Math.pow(lvl, 2) * 500
  if (next === curr) return 0
  return Math.max(0, Math.min(1, (totalSavings - curr) / (next - curr)))
}
