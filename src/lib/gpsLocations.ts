/**
 * GPS coordinates for Potheri Town & SRM Campus area (Chennai).
 * Presentation-only — does not affect soul/advisor/building formulas.
 */

export const POTHERI_CENTER = { lat: 12.8342, lng: 80.0454 }

export interface GpsCoord {
  lat: number
  lng: number
}

/** Default landmark pins for built-in spending locations. */
export const DEFAULT_LANDMARKS: Record<string, GpsCoord & { emoji: string }> = {
  Home: { lat: 12.8318, lng: 80.0421, emoji: '🏠' },
  College: { lat: 12.8231, lng: 80.0445, emoji: '🎓' },
  Mall: { lat: 12.8375, lng: 80.0488, emoji: '🛍️' },
  'Café': { lat: 12.8326, lng: 80.0462, emoji: '☕' },
  Metro: { lat: 12.8295, lng: 80.051, emoji: '🚇' },
  Online: { lat: 12.8342, lng: 80.0454, emoji: '💻' },
  Restaurant: { lat: 12.8358, lng: 80.0435, emoji: '🍽️' },
}

/** Resolve coords: user pin → default landmark → null. */
export function resolveCoords(
  location: string,
  pins: Record<string, GpsCoord>,
): GpsCoord | null {
  if (pins[location]) return pins[location]
  const d = DEFAULT_LANDMARKS[location]
  return d ? { lat: d.lat, lng: d.lng } : null
}

/** Mood → marker emoji for retro GPS pins. */
export function moodEmoji(mood: 'tidy' | 'moderate' | 'ominous'): string {
  if (mood === 'tidy') return '🏡'
  if (mood === 'moderate') return '🏠'
  return '🏰'
}
