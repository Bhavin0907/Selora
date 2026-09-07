import { useEffect, useRef, useState } from 'react'
import type { SoulMood } from '../types'

/**
 * SoulSprite — a hand-authored 16x16 pixel-art creature that reacts to mood.
 *
 * Asset strategy: if a real PNG exists at /sprites/soul-<mood>.png it is shown
 * (integer-scaled, pixelated). Otherwise we fall back to the generated SVG
 * pixel-matrix placeholder below — so dropping in real art needs ZERO code
 * changes beyond adding the file.
 */

interface SoulSpriteProps {
  mood: SoulMood
  size?: number
  showAura?: boolean
  showShadow?: boolean
  className?: string
}

// Base body silhouette shared by all moods (each row is exactly 16 chars).
// O=outline  H=highlight  B=base  D=shade  (space = transparent)
const BODY: string[] = [
  '                ',
  '     OOOOOO     ',
  '   OHHHHHHHHO   ',
  '  OHHHHHHHHHHO  ',
  ' OHHHHHHHHHHHHO ',
  ' OHHBBBBBBBBHHO ',
  'OHBBBBBBBBBBBBHO',
  'OBBBBBBBBBBBBBBO',
  'OBBBBBBBBBBBBBBO',
  'OBBBBBBBBBBBBBBO',
  ' OBBBBBBBBBBBBO ',
  ' ODBBBBBBBBBBDO ',
  '  ODDBBBBBBDDO  ',
  '   ODDDDDDDDO   ',
  '     OOOOOO     ',
  '                ',
]

type Patch = [row: number, col: number, ch: string]

interface MoodStyle {
  palette: Record<string, string>
  eyes: Patch[]
  mouth: Patch[]
  extras: Patch[]
}

const COMMON = { O: '#000000', E: '#ffffff', P: '#0a0a0f' }

const MOOD_STYLES: Record<SoulMood, MoodStyle> = {
  thriving: {
    palette: {
      ...COMMON,
      H: '#8affc4',
      B: '#3ddc97',
      D: '#1f9c6b',
      M: '#0a3d2a',
      C: '#f5c518',
      S: '#f5c518',
    },
    // big happy eyes with a white shine
    eyes: [
      [6, 4, 'E'], [6, 5, 'E'], [7, 4, 'P'], [7, 5, 'E'],
      [6, 10, 'E'], [6, 11, 'E'], [7, 10, 'E'], [7, 11, 'P'],
    ],
    // wide open smile
    mouth: [
      [9, 6, 'M'], [9, 7, 'M'], [9, 8, 'M'], [9, 9, 'M'],
      [10, 7, 'M'], [10, 8, 'M'],
    ],
    extras: [
      [8, 3, 'C'], [8, 12, 'C'],
      [1, 2, 'S'], [3, 14, 'S'], [12, 1, 'S'], [13, 14, 'S'], [4, 13, 'S'],
    ],
  },
  content: {
    palette: {
      ...COMMON,
      H: '#ffe680',
      B: '#f5c518',
      D: '#c99a12',
      M: '#5a3d00',
      C: '#ffd24d',
      S: '#ffffff',
    },
    // calm eyes, pupils inward
    eyes: [
      [6, 4, 'E'], [6, 5, 'E'], [7, 4, 'E'], [7, 5, 'P'],
      [6, 10, 'E'], [6, 11, 'E'], [7, 10, 'P'], [7, 11, 'E'],
    ],
    // gentle smile
    mouth: [
      [9, 6, 'M'], [9, 9, 'M'], [10, 7, 'M'], [10, 8, 'M'],
    ],
    extras: [
      [8, 3, 'C'], [8, 12, 'C'],
    ],
  },
  worried: {
    palette: {
      ...COMMON,
      H: '#ffd27f',
      B: '#f0a830',
      D: '#b8791a',
      M: '#5a3a00',
      C: '#e08a1a',
      S: '#ffffff',
    },
    // small raised eyes (pupils up) + slanted brows
    eyes: [
      [5, 4, 'O'], [5, 11, 'O'],
      [6, 4, 'P'], [6, 5, 'E'], [7, 4, 'E'], [7, 5, 'E'],
      [6, 10, 'E'], [6, 11, 'P'], [7, 10, 'E'], [7, 11, 'E'],
    ],
    // small frown
    mouth: [
      [10, 6, 'M'], [10, 9, 'M'], [9, 7, 'M'], [9, 8, 'M'],
    ],
    extras: [],
  },
  distressed: {
    palette: {
      ...COMMON,
      H: '#b06a90',
      B: '#8a4a6a',
      D: '#502040',
      M: '#2a0a1a',
      C: '#6a3050',
      T: '#6bd0ff',
      S: '#ffffff',
    },
    // droopy half-lidded eyes
    eyes: [
      [6, 4, 'O'], [6, 5, 'O'], [6, 10, 'O'], [6, 11, 'O'],
      [7, 4, 'E'], [7, 5, 'P'], [7, 10, 'P'], [7, 11, 'E'],
    ],
    // deep open frown + a tear
    mouth: [
      [11, 6, 'M'], [11, 9, 'M'], [10, 7, 'M'], [10, 8, 'M'],
    ],
    extras: [
      [8, 4, 'T'], [9, 4, 'T'],
    ],
  },
}

interface RenderCell {
  x: number
  y: number
  color: string
  spark: boolean
}

function buildMatrix(mood: SoulMood, blink: boolean): RenderCell[] {
  const style = MOOD_STYLES[mood]
  // clone body into a mutable grid
  const grid: string[][] = BODY.map((row) => row.split(''))

  const apply = (patches: Patch[]) => {
    for (const [r, c, ch] of patches) grid[r][c] = ch
  }

  apply(style.extras)
  apply(style.mouth)

  if (blink) {
    // closed eyes: clear eye region to body, draw a lash line on row 7
    for (const r of [5, 6, 7, 8]) {
      for (const c of [4, 5, 10, 11]) {
        if (grid[r]?.[c] !== undefined && grid[r][c] !== ' ') grid[r][c] = 'B'
      }
    }
    for (const c of [4, 5, 10, 11]) grid[7][c] = 'O'
  } else {
    apply(style.eyes)
  }

  const cells: RenderCell[] = []
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const ch = grid[y][x]
      if (ch === ' ') continue
      const color = style.palette[ch] ?? '#ffffff'
      cells.push({ x, y, color, spark: ch === 'S' })
    }
  }
  return cells
}

function PixelSvg({ mood, blink }: { mood: SoulMood; blink: boolean }) {
  const cells = buildMatrix(mood, blink)
  return (
    <svg
      viewBox="0 0 16 16"
      width="100%"
      height="100%"
      shapeRendering="crispEdges"
      style={{ imageRendering: 'pixelated' }}
    >
      {cells.map((cell, i) => (
        <rect
          key={i}
          x={cell.x}
          y={cell.y}
          width={1}
          height={1}
          fill={cell.color}
          className={cell.spark ? 'soul-spark' : undefined}
        />
      ))}
    </svg>
  )
}

const MOOD_AURA: Record<SoulMood, string> = {
  thriving: '#3ddc97',
  content: '#9b5de5',
  worried: '#f5c518',
  distressed: '#ff6b6b',
}

const MOOD_RANK: Record<SoulMood, number> = {
  distressed: 0,
  worried: 1,
  content: 2,
  thriving: 3,
}

export function SoulSprite({
  mood,
  size = 140,
  showAura = true,
  showShadow = true,
  className,
}: SoulSpriteProps) {
  const aura = MOOD_AURA[mood]
  const [pngOk, setPngOk] = useState(true)
  const [reaction, setReaction] = useState<'up' | 'down' | null>(null)
  const [burstKey, setBurstKey] = useState(0)
  const prevMood = useRef<SoulMood>(mood)

  // reset PNG attempt whenever mood changes
  useEffect(() => {
    setPngOk(true)
  }, [mood])

  // detect mood improve/worsen → play reaction
  useEffect(() => {
    const prev = prevMood.current
    if (prev !== mood) {
      const dir = MOOD_RANK[mood] > MOOD_RANK[prev] ? 'up' : 'down'
      setReaction(dir)
      if (dir === 'up') setBurstKey((k) => k + 1)
      const t = setTimeout(() => setReaction(null), 650)
      prevMood.current = mood
      return () => clearTimeout(t)
    }
  }, [mood])

  const idleClass = reaction
    ? reaction === 'up'
      ? 'soul-react-up'
      : 'soul-react-down'
    : `soul-idle-${mood}`

  const showBurst = (reaction === 'up' || mood === 'thriving') && showAura

  return (
    <div
      className={`relative flex items-center justify-center ${className ?? ''}`}
      style={{ width: size, height: size }}
    >
      {/* Aura glow ring (sprite FX, allowed to be soft) */}
      {showAura && (
        <>
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at 50% 45%, ${aura}44 0%, ${aura}18 45%, transparent 70%)`,
            }}
          />
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" aria-hidden="true">
            <circle
              cx="50"
              cy="47"
              r="42"
              fill="none"
              stroke={aura}
              strokeOpacity="0.45"
              strokeWidth="1.5"
            />
          </svg>
        </>
      )}

      {/* Sprite stack */}
      <div className={idleClass} style={{ width: '72%', height: '72%' }}>
        <div className="soul-breathe relative w-full h-full">
          {/* SVG placeholder (always present) */}
          <div className="absolute inset-0">
            <PixelSvg mood={mood} blink={false} />
          </div>
          {/* Blink layer */}
          <div className="absolute inset-0 soul-blink-layer">
            <PixelSvg mood={mood} blink />
          </div>
          {/* Real PNG override (shown only if it loads) */}
          <img
            src={`/sprites/soul-${mood}.png`}
            alt=""
            onLoad={() => setPngOk(true)}
            onError={() => setPngOk(false)}
            className="absolute inset-0 w-full h-full object-contain"
            style={{
              imageRendering: 'pixelated',
              display: pngOk ? 'block' : 'none',
            }}
          />
        </div>
      </div>

      {/* Sparkle burst on improve / continuous for thriving */}
      {showBurst && (
        <div key={burstKey} className="absolute inset-0 pointer-events-none">
          {[
            { bx: '-140%', by: '-120%' },
            { bx: '150%', by: '-110%' },
            { bx: '-120%', by: '130%' },
            { bx: '130%', by: '140%' },
            { bx: '0%', by: '-170%' },
          ].map((p, i) => (
            <span
              key={i}
              className="spark-particle absolute left-1/2 top-1/2 block"
              style={
                {
                  width: 6,
                  height: 6,
                  marginLeft: -3,
                  marginTop: -3,
                  background: MOOD_AURA[mood],
                  boxShadow: '0 0 0 1px #000',
                  ['--bx' as string]: p.bx,
                  ['--by' as string]: p.by,
                  animationDelay: `${i * 0.05}s`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}

      {/* Hard pixel shadow ellipse */}
      {showShadow && (
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            bottom: '4%',
            width: '46%',
            height: '8%',
            background: '#000000',
            opacity: 0.5,
          }}
        />
      )}
    </div>
  )
}
