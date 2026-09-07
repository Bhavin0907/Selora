/**
 * GPS location coordinates and geospatial helpers for Potheri Town & SRM Campus.
 * Maps game landmarks (from seed.ts & custom locations) to real-world coordinates.
 */

export interface LandmarkGeo {
  name: string
  lat: number
  lng: number
  label: string
  emoji: string
}

// SRM IST Main Campus / Potheri center coordinates
export const POTHERI_CENTER: [number, number] = [12.8230, 80.0444]

export const POTHERI_BOUNDS = {
  minLat: 12.8140,
  maxLat: 12.8330,
  minLng: 80.0340,
  maxLng: 80.0550,
}

// Landmark mappings matching default locations from seed.ts
export const DEFAULT_GPS_LANDMARKS: Record<string, { lat: number; lng: number; label: string; emoji: string }> = {
  Home: {
    lat: 12.8195,
    lng: 80.0410,
    label: 'Hostels / Abode Valley',
    emoji: '🏡',
  },
  College: {
    lat: 12.8231,
    lng: 80.0425,
    label: 'SRM Tech Park & UB',
    emoji: '🏫',
  },
  Mall: {
    lat: 12.8285,
    lng: 80.0520,
    label: 'Estancia Mall / Signature',
    emoji: '🏬',
  },
  Café: {
    lat: 12.8218,
    lng: 80.0438,
    label: 'Java Green / Campus Café',
    emoji: '☕',
  },
  Metro: {
    lat: 12.8208,
    lng: 80.0385,
    label: 'Potheri Railway Station',
    emoji: '🚆',
  },
  Online: {
    lat: 12.8245,
    lng: 80.0450,
    label: 'SRM Innovation & Tech Hub',
    emoji: '💻',
  },
  Restaurant: {
    lat: 12.8252,
    lng: 80.0465,
    label: 'Potheri Food Street',
    emoji: '🍜',
  },
}

// Fallback deterministic location generation for custom user locations
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function getLandmarkGeo(locationName: string): LandmarkGeo {
  const known = DEFAULT_GPS_LANDMARKS[locationName]
  if (known) {
    return {
      name: locationName,
      lat: known.lat,
      lng: known.lng,
      label: known.label,
      emoji: known.emoji,
    }
  }

  // Generate deterministic offset around SRM campus for custom locations
  const hash = hashString(locationName)
  const angle = (hash % 360) * (Math.PI / 180)
  const radiusKm = 0.2 + ((hash % 100) / 100) * 0.5 // 200m - 700m radius
  const latOffset = (radiusKm / 111) * Math.cos(angle)
  const lngOffset = (radiusKm / (111 * Math.cos(POTHERI_CENTER[0] * (Math.PI / 180)))) * Math.sin(angle)

  return {
    name: locationName,
    lat: POTHERI_CENTER[0] + latOffset,
    lng: POTHERI_CENTER[1] + lngOffset,
    label: `${locationName} (Potheri Area)`,
    emoji: '📍',
  }
}

/**
 * Calculates straight-line distance in meters between two lat/lng coordinates (Haversine formula).
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3 // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180
  const phi2 = (lat2 * Math.PI) / 180
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

export const PROXIMITY_THRESHOLD_METERS = 55 // Highlight & allow quick interaction within ~55m
