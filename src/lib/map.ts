import type { BuildingState, Saving, Spend } from '../types'
import { formatINR, groupByField, sumAmount } from './stats'

const BASE_HEIGHT = 30
const HEIGHT_SCALE = 50 // every ₹500 ≈ 50px extra height

export function computeBuildings(
  spends: Spend[],
  savings: Saving[],
  locations: string[],
): BuildingState[] {
  const spendByLocation = groupByField(spends, 'location')
  const totalSavings = sumAmount(savings)

  return locations.map((location) => {
    const totalSpendAtLocation = spendByLocation[location] ?? 0
    const height = BASE_HEIGHT + (totalSpendAtLocation / 500) * HEIGHT_SCALE

    const ratio = totalSavings > 0 ? totalSpendAtLocation / totalSavings : totalSpendAtLocation > 0 ? 2 : 0

    let mood: BuildingState['mood']
    let color: string
    if (ratio < 0.3 || totalSpendAtLocation === 0) {
      mood = 'tidy'
      color = '#3ddc97'
    } else if (ratio < 0.8) {
      mood = 'moderate'
      color = '#f5c518'
    } else {
      mood = 'ominous'
      color = '#ff6b6b'
    }

    const tip = buildBuildingTip(location, totalSpendAtLocation, mood)

    return {
      location,
      totalSpend: totalSpendAtLocation,
      height: Math.min(height, 200),
      mood,
      color,
      tip,
    }
  })
}

function buildBuildingTip(
  location: string,
  totalSpend: number,
  mood: BuildingState['mood'],
): string {
  if (totalSpend === 0) {
    return `No spending at ${location} yet — a quiet neighbourhood!`
  }
  const tips: Record<BuildingState['mood'], string> = {
    tidy: `${location} is well-managed at ${formatINR(totalSpend)}. Keep it green!`,
    moderate: `${formatINR(totalSpend)} at ${location}. Watch this zone — it could grow.`,
    ominous: `${formatINR(totalSpend)} at ${location}! This tower is getting too tall. Try a spending cap.`,
  }
  return tips[mood]
}
