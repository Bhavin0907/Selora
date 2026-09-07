/**
 * Cheap, cached WebGL availability probe. Used to decide whether to attempt
 * the lazy 3D scenes at all — if unsupported we render the 2D fallbacks so
 * nothing ever hangs.
 */
let cached: boolean | null = null

export function hasWebGL(): boolean {
  if (cached !== null) return cached
  if (typeof document === 'undefined') {
    cached = false
    return cached
  }
  try {
    const canvas = document.createElement('canvas')
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')
    cached = !!gl
  } catch {
    cached = false
  }
  return cached
}
