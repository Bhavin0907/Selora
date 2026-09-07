/** Convert spend amount to 3D building height in world units */
export function spendToHeight3D(totalSpend: number): number {
  const BASE = 0.6
  const SCALE = 0.004
  return Math.min(BASE + totalSpend * SCALE, 5)
}

/** Savings monument scale from total savings */
export function savingsToMonumentScale(totalSavings: number): number {
  const BASE = 0.8
  const SCALE = 0.0008
  return Math.min(BASE + totalSavings * SCALE, 3.5)
}

/** Arrange N buildings in a circle around the island center */
export function buildingPosition(index: number, total: number): [number, number, number] {
  if (total === 0) return [0, 0, 0]
  const radius = 2.8 + Math.min(total * 0.15, 1.2)
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2
  return [Math.cos(angle) * radius, 0, Math.sin(angle) * radius]
}
