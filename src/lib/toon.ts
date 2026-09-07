import * as THREE from 'three'

/**
 * Shared, lazily-created textures for the retro 3D scene. Created once and
 * cached so every mesh shares them (cheap, no per-render allocation).
 */

let gradient: THREE.DataTexture | null = null

/**
 * 4-step grayscale ramp used as a MeshToonMaterial `gradientMap` so surfaces
 * get banded cel-shading (readable light→shadow depth) instead of one flat
 * color — while staying crisp/retro via NearestFilter.
 */
export function toonGradient(): THREE.DataTexture {
  if (gradient) return gradient
  const data = new Uint8Array([84, 84, 84, 255, 150, 150, 150, 255, 205, 205, 205, 255, 255, 255, 255, 255])
  const tex = new THREE.DataTexture(data, 4, 1, THREE.RGBAFormat)
  tex.minFilter = THREE.NearestFilter
  tex.magFilter = THREE.NearestFilter
  tex.needsUpdate = true
  gradient = tex
  return tex
}

let shadow: THREE.CanvasTexture | null = null

/** Soft radial blob used as a cheap stylized contact shadow. */
export function softShadowTexture(): THREE.CanvasTexture | null {
  if (shadow) return shadow
  if (typeof document === 'undefined') return null
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')
  if (!g) return null
  const grd = g.createRadialGradient(32, 32, 2, 32, 32, 30)
  grd.addColorStop(0, 'rgba(20,40,20,0.55)')
  grd.addColorStop(0.6, 'rgba(20,40,20,0.28)')
  grd.addColorStop(1, 'rgba(20,40,20,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, 64, 64)
  const tex = new THREE.CanvasTexture(c)
  shadow = tex
  return tex
}
