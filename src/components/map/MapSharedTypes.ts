import type { BuildingState } from '../../types'
import type { Greeting } from '../IsoWorld/OverworldScene'

/** Shared map data computed once in MapPage — all three modes read this. */
export interface SharedMapData {
  buildings: BuildingState[]
  activeBuildings: BuildingState[]
  totalSpend: number
  totalSavings: number
  isEmpty: boolean
  currentLocation?: string
  greeting: Greeting
}

export interface MapModeProps extends SharedMapData {
  selected: BuildingState | null
  onSelect: (b: BuildingState) => void
}
