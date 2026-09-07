import { useState } from 'react'
import {
  AVATAR_GRID,
  buildAvatarLayers,
  type AvatarConfig,
  type Rect,
} from '../lib/avatar'

const PNG_BASE = '/avatar'

interface AvatarProps {
  config: AvatarConfig
  /** Rendered pixel size of the square canvas. */
  size?: number
  /** Optional mood aura color drawn behind the avatar (effects only). */
  auraColor?: string
  /** Idle bob animation. */
  bob?: boolean
  className?: string
}

/** One layer's SVG pixel-matrix placeholder. */
function LayerSvg({ rects }: { rects: Rect[] }) {
  if (rects.length === 0) return null
  return (
    <svg
      viewBox={`0 0 ${AVATAR_GRID} ${AVATAR_GRID}`}
      width="100%"
      height="100%"
      shapeRendering="crispEdges"
      style={{ imageRendering: 'pixelated', position: 'absolute', inset: 0 }}
      aria-hidden="true"
    >
      {rects.map((rc, i) => (
        <rect key={i} x={rc.x} y={rc.y} width={rc.w} height={rc.h} fill={rc.c} />
      ))}
    </svg>
  )
}

/**
 * Real PNG override for a layer. Renders `/avatar/<folder>/<id>.png`.
 * Stays transparent until it successfully loads (so the SVG placeholder shows
 * through), then covers the placeholder. Hidden entirely if the PNG 404s.
 */
function PngOverlay({ folder, id }: { folder: string; id: string }) {
  const [state, setState] = useState<'pending' | 'ok' | 'err'>('pending')
  if (state === 'err') return null
  return (
    <img
      src={`${PNG_BASE}/${folder}/${id}.png`}
      alt=""
      aria-hidden="true"
      onLoad={() => setState('ok')}
      onError={() => setState('err')}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        imageRendering: 'pixelated',
        opacity: state === 'ok' ? 1 : 0,
        pointerEvents: 'none',
      }}
    />
  )
}

/**
 * Stacked pixel-art avatar. Renders each part layer as an SVG placeholder with
 * an optional real-PNG override on top — so dropping PNGs into /public/avatar/
 * needs zero code changes. Mood only ever affects the aura/effects here, never
 * the user-chosen parts.
 */
export function Avatar({ config, size = 128, auraColor, bob, className }: AvatarProps) {
  const layers = buildAvatarLayers(config)

  return (
    <div
      className={className}
      style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}
    >
      {auraColor && (
        <div
          style={{
            position: 'absolute',
            inset: '-8%',
            background: `radial-gradient(circle at 50% 45%, ${auraColor}44 0%, ${auraColor}18 45%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
      )}
      <div
        className={bob ? 'avatar-bob' : undefined}
        style={{ position: 'absolute', inset: 0 }}
      >
        {layers.map((layer) => (
          <div key={layer.key} style={{ position: 'absolute', inset: 0 }}>
            <LayerSvg rects={layer.rects} />
            {layer.id !== 'none' && <PngOverlay folder={layer.folder} id={layer.id} />}
          </div>
        ))}
      </div>
    </div>
  )
}
