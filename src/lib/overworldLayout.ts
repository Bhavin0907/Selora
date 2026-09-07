import type { BuildingState } from '../types'

/**
 * Shared overworld layout — the single source of truth for node positions so
 * the 2D SVG map and the 3D scene render the SAME island structure. (Purely
 * geometric constants; changes nothing about the deterministic formulas.)
 */

export const VW = 360
export const VH = 340

export interface Pt {
  x: number
  y: number
}

// Winding trail of node slots (bottom entrance → up toward the tree)
export const SLOTS: Pt[] = [
  { x: 78, y: 280 },
  { x: 152, y: 258 },
  { x: 98, y: 210 },
  { x: 190, y: 196 },
  { x: 258, y: 220 },
  { x: 296, y: 168 },
  { x: 214, y: 146 },
  { x: 138, y: 124 },
]

export const MONUMENT: Pt = { x: 204, y: 74 }

export interface Placement {
  building: BuildingState
  pos: Pt
}

/** Assign active buildings (biggest spend first) to trail slots. */
export function placeBuildings(buildings: BuildingState[]): Placement[] {
  return [...buildings]
    .filter((b) => b.totalSpend > 0)
    .sort((a, b) => b.totalSpend - a.totalSpend)
    .slice(0, SLOTS.length)
    .map((building, i) => ({ building, pos: SLOTS[i] }))
}

/** Which node the avatar stands on (latest activity → first node fallback). */
export function avatarSlot(placements: Placement[], currentLocation?: string): Pt {
  const cur = placements.find((p) => p.building.location === currentLocation)
  return (cur ?? placements[0])?.pos ?? SLOTS[0]
}

/**
 * Convert a 2D map point (viewBox space) to 3D ground coordinates [x, z].
 * Centered on the island so both maps line up spatially.
 */
export function to3D(p: Pt): [number, number] {
  return [(p.x - VW / 2) / 20, (p.y - VH / 2) / 20]
}
