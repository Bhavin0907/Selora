import { useEffect, useMemo, useRef, useState } from 'react'
import type { BuildingState } from '../../types'
import { formatINR } from '../Card'

/* ── Isometric projection constants ─────────────────────── */
const TW = 48 // tile width
const TH = 24 // tile height
const ORIGIN_X = 170
const ORIGIN_Y = 130
const GRID = 4 // 4x4 tiles

type Point = [number, number]

function tileCenter(gx: number, gy: number): Point {
  return [ORIGIN_X + (gx - gy) * (TW / 2), ORIGIN_Y + (gx + gy) * (TH / 2)]
}

function pts(arr: Point[]): string {
  return arr.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
}

function lerp(a: Point, b: Point, t: number): Point {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
}

// bilinear interpolation over a quad [tl, tr, br, bl]
function bilerp(quad: Point[], u: number, v: number): Point {
  const top = lerp(quad[0], quad[1], u)
  const bot = lerp(quad[3], quad[2], u)
  return lerp(top, bot, v)
}

function windowsFor(quad: Point[], rows: number, color: string, keyPrefix: string) {
  const cells: React.ReactElement[] = []
  const cols = 2
  const wu = 0.24
  const hv = Math.min(0.16, 0.7 / rows)
  for (let r = 0; r < rows; r++) {
    const cv = 0.16 + ((r + 0.5) / rows) * 0.68
    for (let c = 0; c < cols; c++) {
      const cu = c === 0 ? 0.32 : 0.68
      const q = [
        bilerp(quad, cu - wu / 2, cv - hv / 2),
        bilerp(quad, cu + wu / 2, cv - hv / 2),
        bilerp(quad, cu + wu / 2, cv + hv / 2),
        bilerp(quad, cu - wu / 2, cv + hv / 2),
      ]
      cells.push(
        <polygon key={`${keyPrefix}-${r}-${c}`} points={pts(q)} fill={color} stroke="#000" strokeWidth={0.4} />,
      )
    }
  }
  return cells
}

/* ── Stepped growth (chunky, not smooth) ───────────────── */
function useSteppedHeight(target: number, step = 8, dur = 550): number {
  const [h, setH] = useState(0)
  const fromRef = useRef(0)
  const raf = useRef(0)

  useEffect(() => {
    const from = fromRef.current
    const to = target
    if (from === to) return
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / dur, 1)
      const eased = 1 - Math.pow(1 - t, 2)
      const raw = from + (to - from) * eased
      setH(Math.round(raw / step) * step)
      if (t < 1) raf.current = requestAnimationFrame(tick)
      else {
        fromRef.current = to
        setH(to)
      }
    }
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, step, dur])

  return h
}

interface MoodPalette {
  top: string
  right: string
  left: string
  roof: string
  window: string
}

const PALETTES: Record<BuildingState['mood'], MoodPalette> = {
  tidy: { top: '#4fe3a6', right: '#2fae7a', left: '#1c7a54', roof: '#7bffc4', window: '#f5c518' },
  moderate: { top: '#ffd24d', right: '#e0a81f', left: '#9c760f', roof: '#ffe680', window: '#fff2ab' },
  ominous: { top: '#7a2f43', right: '#4e1c2a', left: '#2c0f18', roof: '#ff6b6b', window: '#ff8a8a' },
}

/* ── One building ──────────────────────────────────────── */
function BuildingSprite({
  gx,
  gy,
  building,
  isoHeight,
  onSelect,
}: {
  gx: number
  gy: number
  building: BuildingState
  isoHeight: number
  onSelect: (b: BuildingState) => void
}) {
  const [cx, cy] = tileCenter(gx, gy)
  const h = useSteppedHeight(isoHeight)
  const [pngOk, setPngOk] = useState(true)
  const pal = PALETTES[building.mood]
  const hw = TW * 0.34
  const hd = TH * 0.34

  // base diamond (y = cy) & top diamond (y = cy - h)
  const bE: Point = [cx + hw, cy]
  const bS: Point = [cx, cy + hd]
  const bW: Point = [cx - hw, cy]
  const tN: Point = [cx, cy - hd - h]
  const tE: Point = [cx + hw, cy - h]
  const tS: Point = [cx, cy + hd - h]
  const tW: Point = [cx - hw, cy - h]

  // faces as quads [tl, tr, br, bl]
  const leftQuad = [tW, tS, bS, bW]
  const rightQuad = [tS, tE, bE, bS]
  const rows = Math.max(1, Math.floor(h / 16))

  return (
    <g style={{ cursor: 'pointer' }} onClick={() => onSelect(building)}>
      {/* ominous pulsing red glow at the base */}
      {building.mood === 'ominous' && (
        <polygon
          className="iso-danger-glow"
          points={pts([
            [cx, cy - TH * 0.8],
            [cx + TW * 0.8, cy],
            [cx, cy + TH * 0.8],
            [cx - TW * 0.8, cy],
          ])}
          fill="#ff2b3b"
        />
      )}

      {/* left face */}
      <polygon points={pts(leftQuad)} fill={pal.left} stroke="#000" strokeWidth={1} />
      {windowsFor(leftQuad, rows, pal.window, `l-${building.location}`)}
      {/* right face */}
      <polygon points={pts(rightQuad)} fill={pal.right} stroke="#000" strokeWidth={1} />
      {windowsFor(rightQuad, rows, pal.window, `r-${building.location}`)}
      {/* top face */}
      <polygon points={pts([tN, tE, tS, tW])} fill={pal.top} stroke="#000" strokeWidth={1} />

      {/* roof / details */}
      {building.mood === 'tidy' ? (
        // pitched pyramid roof (cottage)
        <>
          <polygon points={pts([tW, tN, [cx, cy - hd - h - 12]])} fill={pal.roof} stroke="#000" strokeWidth={1} />
          <polygon points={pts([tN, tE, [cx, cy - hd - h - 12]])} fill={pal.right} stroke="#000" strokeWidth={1} />
          <polygon points={pts([tS, tE, [cx, cy - hd - h - 12]])} fill={pal.left} stroke="#000" strokeWidth={1} />
          <polygon points={pts([tW, tS, [cx, cy - hd - h - 12]])} fill={pal.roof} stroke="#000" strokeWidth={1} />
        </>
      ) : building.mood === 'ominous' ? (
        // antenna with a blinking red light
        <>
          <rect x={cx - 0.8} y={cy - h - hd - 12} width={1.6} height={12} fill="#000" />
          <rect className="iso-lamp" x={cx - 2} y={cy - h - hd - 15} width={4} height={4} fill="#ff2b3b" />
        </>
      ) : (
        // gold rooftop trim
        <polygon
          points={pts([
            [cx, cy - hd - h + 1],
            [cx + hw * 0.6, cy - h + 1],
            [cx, cy + hd - h - 1],
            [cx - hw * 0.6, cy - h + 1],
          ])}
          fill={pal.roof}
          opacity={0.5}
        />
      )}

      {/* optional real PNG override, anchored to the tile */}
      <image
        href={`/sprites/building-${building.mood}.png`}
        x={cx - 32}
        y={cy + hd - (isoHeight + 44)}
        width={64}
        height={isoHeight + 44}
        preserveAspectRatio="xMidYMax meet"
        style={{ imageRendering: 'pixelated', display: pngOk ? 'block' : 'none' }}
        onError={() => setPngOk(false)}
        onLoad={() => setPngOk(true)}
      />
    </g>
  )
}

/* ── Central savings monument ──────────────────────────── */
function Monument({ totalSavings }: { totalSavings: number }) {
  const [cx, cy] = tileCenter(1.5, 1.5)
  const target = Math.min(20 + totalSavings / 60, 96)
  const h = useSteppedHeight(target, 6)
  const [pngOk, setPngOk] = useState(true)
  const hw = TW * 0.28
  const hd = TH * 0.28

  return (
    <g>
      {/* glowing platform */}
      <polygon
        points={pts([
          [cx, cy - hd * 1.6],
          [cx + hw * 1.8, cy],
          [cx, cy + hd * 1.6],
          [cx - hw * 1.8, cy],
        ])}
        fill="#123d2c"
        stroke="#3ddc97"
        strokeWidth={1}
      />
      {/* crystal shaft */}
      <polygon
        points={pts([
          [cx - hw * 0.5, cy],
          [cx + hw * 0.5, cy],
          [cx + hw * 0.3, cy - h],
          [cx - hw * 0.3, cy - h],
        ])}
        fill="#1f9c6b"
        stroke="#000"
        strokeWidth={1}
      />
      {/* crystal head (glowing diamond) */}
      <polygon
        className="iso-crystal"
        points={pts([
          [cx, cy - h - 16],
          [cx + hw * 0.55, cy - h],
          [cx, cy - h + 10],
          [cx - hw * 0.55, cy - h],
        ])}
        fill="#3ddc97"
        stroke="#7bffc4"
        strokeWidth={1}
      />
      {/* highlight */}
      <polygon
        points={pts([
          [cx, cy - h - 16],
          [cx - hw * 0.2, cy - h - 4],
          [cx, cy - h + 2],
        ])}
        fill="#c9ffe8"
        opacity={0.7}
      />
      <image
        href="/sprites/monument.png"
        x={cx - 30}
        y={cy + hd - (target + 40)}
        width={60}
        height={target + 40}
        preserveAspectRatio="xMidYMax meet"
        style={{ imageRendering: 'pixelated', display: pngOk ? 'block' : 'none' }}
        onError={() => setPngOk(false)}
        onLoad={() => setPngOk(true)}
      />
    </g>
  )
}

/* ── Ground / island slab ──────────────────────────────── */
const CENTER_TILES = new Set(['1,1', '1,2', '2,1', '2,2'])

function Island() {
  const cyMid = ORIGIN_Y + 1.5 * TH
  const halfW = 2 * TW
  const halfH = 2 * TH
  const N: Point = [ORIGIN_X, cyMid - halfH]
  const E: Point = [ORIGIN_X + halfW, cyMid]
  const S: Point = [ORIGIN_X, cyMid + halfH]
  const W: Point = [ORIGIN_X - halfW, cyMid]
  const T = 22

  const tiles: React.ReactElement[] = []
  for (let gx = 0; gx < GRID; gx++) {
    for (let gy = 0; gy < GRID; gy++) {
      const [cx, cy] = tileCenter(gx, gy)
      const isCenter = CENTER_TILES.has(`${gx},${gy}`)
      const base = (gx + gy) % 2 === 0 ? '#1b1b34' : '#232342'
      tiles.push(
        <polygon
          key={`t-${gx}-${gy}`}
          points={pts([
            [cx, cy - TH / 2],
            [cx + TW / 2, cy],
            [cx, cy + TH / 2],
            [cx - TW / 2, cy],
          ])}
          fill={isCenter ? '#2c2c50' : base}
          stroke="#0d0d18"
          strokeWidth={1}
        />,
      )
    }
  }

  return (
    <g>
      {/* side faces (thickness) */}
      <polygon points={pts([W, S, [S[0], S[1] + T], [W[0], W[1] + T]])} fill="#08080f" />
      <polygon points={pts([S, E, [E[0], E[1] + T], [S[0], S[1] + T]])} fill="#0d0d1c" />
      {/* top slab */}
      <polygon points={pts([N, E, S, W])} fill="#14142a" stroke="#9b5de5" strokeWidth={1} strokeOpacity={0.4} />
      {tiles}
    </g>
  )
}

/* ── Ambient FX ────────────────────────────────────────── */
function Ambient() {
  const stars = useMemo(
    () =>
      Array.from({ length: 34 }).map((_, i) => ({
        x: (i * 41) % 340,
        y: (i * 23) % 120,
        tw: `${1.4 + ((i * 7) % 20) / 10}s`,
        c: i % 3 === 0 ? '#f5c518' : i % 3 === 1 ? '#9b5de5' : '#ffffff',
      })),
    [],
  )
  const particles = useMemo(
    () =>
      Array.from({ length: 8 }).map((_, i) => ({
        x: 90 + ((i * 47) % 170),
        y: 150 + ((i * 29) % 60),
        dur: `${3 + (i % 4)}s`,
        c: i % 2 === 0 ? '#3ddc97' : '#f5c518',
      })),
    [],
  )
  return (
    <g>
      {stars.map((s, i) => (
        <rect
          key={`s-${i}`}
          className="iso-star"
          x={s.x}
          y={s.y}
          width={1.5}
          height={1.5}
          fill={s.c}
          style={{ ['--tw' as string]: s.tw }}
        />
      ))}
      {/* drifting pixel clouds */}
      <g className="iso-cloud" style={{ ['--dur' as string]: '30s' }}>
        <g fill="#20203c" opacity={0.7}>
          <rect x={0} y={40} width={10} height={4} />
          <rect x={6} y={36} width={12} height={4} />
          <rect x={14} y={40} width={10} height={4} />
        </g>
      </g>
      <g className="iso-cloud" style={{ ['--dur' as string]: '44s' }}>
        <g fill="#191932" opacity={0.6} transform="translate(0,74)">
          <rect x={0} y={0} width={8} height={3} />
          <rect x={5} y={-3} width={10} height={3} />
          <rect x={13} y={0} width={8} height={3} />
        </g>
      </g>
      {particles.map((p, i) => (
        <rect
          key={`p-${i}`}
          className="iso-particle"
          x={p.x}
          y={p.y}
          width={2}
          height={2}
          fill={p.c}
          style={{ ['--dur' as string]: p.dur }}
        />
      ))}
    </g>
  )
}

function Lamppost({ gx, gy }: { gx: number; gy: number }) {
  const [cx, cy] = tileCenter(gx, gy)
  return (
    <g>
      <rect x={cx - 0.8} y={cy - 14} width={1.6} height={14} fill="#000" />
      <rect className="iso-lamp" x={cx - 2.5} y={cy - 18} width={5} height={5} fill="#f5c518" />
      <ellipse className="iso-lamp" cx={cx} cy={cy + 1} rx={6} ry={2.4} fill="#f5c518" opacity={0.25} />
    </g>
  )
}

/* ── Perimeter placement (tallest to the back) ─────────── */
const PERIMETER: Array<[number, number]> = [
  [0, 0], [1, 0], [2, 0], [3, 0],
  [3, 1], [3, 2], [3, 3],
  [2, 3], [1, 3], [0, 3],
  [0, 2], [0, 1],
]

interface IsoWorldProps {
  buildings: BuildingState[]
  totalSpend: number
  totalSavings: number
  isEmpty: boolean
}

export function IsoWorld({ buildings, totalSpend, totalSavings, isEmpty }: IsoWorldProps) {
  const [selected, setSelected] = useState<BuildingState | null>(null)

  // tallest buildings to the back (lowest depth) so nothing is hidden
  const placements = useMemo(() => {
    const sortedTiles = [...PERIMETER].sort((a, b) => a[0] + a[1] - (b[0] + b[1]))
    const sortedBuildings = [...buildings].sort((a, b) => b.totalSpend - a.totalSpend)
    return sortedBuildings.slice(0, sortedTiles.length).map((b, i) => ({
      building: b,
      gx: sortedTiles[i][0],
      gy: sortedTiles[i][1],
    }))
  }, [buildings])

  // depth-sorted draw list (buildings + monument), back to front
  const drawList = useMemo(() => {
    const items = placements.map((p) => ({
      type: 'building' as const,
      depth: p.gx + p.gy,
      ...p,
    }))
    const withMonument = [
      ...items,
      { type: 'monument' as const, depth: 3, gx: 1.5, gy: 1.5, building: null as BuildingState | null },
    ]
    return withMonument.sort((a, b) => a.depth - b.depth || a.gx - b.gx)
  }, [placements])

  const pct = (b: BuildingState) =>
    totalSpend > 0 ? Math.round((b.totalSpend / totalSpend) * 100) : 0

  return (
    <div className="relative">
      <svg viewBox="0 0 340 320" className="w-full block" style={{ imageRendering: 'pixelated' }}>
        <rect x={0} y={0} width={340} height={320} fill="#08080f" />
        <Ambient />
        <Island />
        <Lamppost gx={3} gy={0} />
        <Lamppost gx={0} gy={3} />

        {drawList.map((item) =>
          item.type === 'monument' ? (
            <Monument key="monument" totalSavings={totalSavings} />
          ) : (
            <BuildingSprite
              key={item.building!.location}
              gx={item.gx}
              gy={item.gy}
              building={item.building!}
              isoHeight={Math.min(item.building!.height * 0.55, 100)}
              onSelect={setSelected}
            />
          ),
        )}
      </svg>

      {/* Empty state */}
      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-6">
          <div className="retro-panel retro-panel--violet text-center">
            <p className="font-body text-lg text-white leading-tight">
              Your city is waiting —<br />log a spend to build it
            </p>
          </div>
        </div>
      )}

      {/* Retro dialog box on building click */}
      {selected && (
        <div className="absolute left-3 right-3 bottom-3 retro-panel retro-panel--gold">
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0">
              <p className="font-pixel text-[0.6rem] text-coin-gold pixel-shadow-sm">
                {selected.location.toUpperCase()}
              </p>
              <p className="font-body text-xl text-white mt-1">{formatINR(selected.totalSpend)}</p>
              <p className="font-body text-base text-white/60">
                {pct(selected)}% of total spending
              </p>
              <p className="font-body text-base text-white/80 mt-1 leading-tight">{selected.tip}</p>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="font-pixel text-[0.6rem] text-white/60 hover:text-white shrink-0"
            >
              X
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
