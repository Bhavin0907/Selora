import { useMemo, useState } from 'react'
import type { BuildingState } from '../../types'
import { formatINR } from '../Card'
import { Avatar } from '../Avatar'
import { useStore } from '../../store/useStore'
import {
  MONUMENT,
  VH,
  VW,
  avatarSlot,
  placeBuildings,
  type Pt,
} from '../../lib/overworldLayout'

/**
 * OverworldMap — a bright, original 16-bit style world map (2D SVG).
 *
 * Green islands on a blue ocean, warm daytime sky, winding dotted trails
 * connecting spending LOCATIONS as map nodes. Each node's landmark reflects
 * its spend health (cottage → house → dark fortress). A golden savings tree
 * grows at the top. The user's avatar stands on the most-recent node.
 *
 * This is also the guaranteed fallback for the 3D scene, so it shares the same
 * layout constants (see lib/overworldLayout). Purely presentational.
 */

// ── Island landform (grass blob with a brown cliff rim) ──────
function Island() {
  const d =
    'M 60 300 C 22 262 30 214 72 192 C 60 150 110 110 160 106 ' +
    'C 202 82 252 96 276 122 C 322 142 330 202 300 242 ' +
    'C 302 292 242 306 192 300 C 142 314 92 314 60 300 Z'
  return (
    <g>
      {/* cliff (brown, offset down so only the lower rim shows) */}
      <path d={d} fill="#8a5a2b" transform="translate(0,14)" stroke="#5e3c1a" strokeWidth={2} />
      <path d={d} fill="#6e4620" transform="translate(0,20)" opacity={0.5} />
      {/* grass top */}
      <path d={d} fill="#5fbf3f" stroke="#2e7d32" strokeWidth={2} />
      {/* lighter grass highlights */}
      <ellipse cx={150} cy={165} rx={70} ry={26} fill="#7ad257" opacity={0.6} />
      <ellipse cx={250} cy={210} rx={44} ry={18} fill="#7ad257" opacity={0.5} />
      <ellipse cx={110} cy={250} rx={40} ry={16} fill="#4fae35" opacity={0.5} />
    </g>
  )
}

// ── Little grassy hill ───────────────────────────────────────
function Hill({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <ellipse cx={0} cy={0} rx={34} ry={16} fill="#4fae35" stroke="#2e7d32" strokeWidth={1.5} />
      <ellipse cx={-6} cy={-4} rx={20} ry={9} fill="#7ad257" opacity={0.7} />
    </g>
  )
}

// ── Swaying tree ─────────────────────────────────────────────
function Tree({ x, y, s = 1, dur = '3s' }: { x: number; y: number; s?: number; dur?: string }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      {/* shadow */}
      <ellipse cx={0} cy={2} rx={11} ry={3.5} fill="#1f5a22" opacity={0.35} />
      <g className="ow-sway" style={{ ['--dur' as string]: dur }}>
        <rect x={-2} y={-12} width={4} height={14} fill="#6e4620" stroke="#3a2410" strokeWidth={0.75} />
        {/* chunky canopy */}
        <rect x={-11} y={-30} width={22} height={12} fill="#2e7d32" />
        <rect x={-8} y={-36} width={16} height={10} fill="#3a9e3f" />
        <rect x={-5} y={-40} width={10} height={8} fill="#4fbf46" />
        <rect x={-8} y={-30} width={16} height={3} fill="#1f5a22" opacity={0.6} />
        <rect x={-6} y={-38} width={5} height={4} fill="#7ad257" opacity={0.8} />
      </g>
    </g>
  )
}

// ── Bush ─────────────────────────────────────────────────────
function Bush({ x, y, s = 1, dur = '3.4s' }: { x: number; y: number; s?: number; dur?: string }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} className="ow-sway" style={{ ['--dur' as string]: dur }}>
      <ellipse cx={0} cy={0} rx={12} ry={7} fill="#2e7d32" />
      <ellipse cx={-4} cy={-3} rx={7} ry={5} fill="#4fbf46" />
      <ellipse cx={5} cy={-1} rx={6} ry={4} fill="#3a9e3f" />
    </g>
  )
}

// ── Dirt/stone node pad under each landmark ──────────────────
function NodePad({ x, y }: Pt) {
  return (
    <g>
      <ellipse cx={x} cy={y + 2} rx={17} ry={7} fill="#3a2410" opacity={0.25} />
      <ellipse cx={x} cy={y} rx={16} ry={6.5} fill="#e8cf8f" stroke="#b98f42" strokeWidth={1.5} />
      <ellipse cx={x} cy={y - 1} rx={10} ry={3.5} fill="#f7e6bd" opacity={0.7} />
    </g>
  )
}

// ── Landmarks (original art per mood) ────────────────────────
function Cottage({ x, y }: Pt) {
  return (
    <g>
      <rect x={x - 10} y={y - 16} width={20} height={16} fill="#f3e2b0" stroke="#3a2410" strokeWidth={1.5} />
      {/* roof */}
      <polygon points={`${x - 13},${y - 15} ${x + 13},${y - 15} ${x},${y - 28}`} fill="#3a9e3f" stroke="#3a2410" strokeWidth={1.5} />
      <polygon points={`${x - 13},${y - 15} ${x},${y - 28} ${x - 3},${y - 15}`} fill="#4fbf46" opacity={0.8} />
      {/* door + window */}
      <rect x={x - 3} y={y - 9} width={6} height={9} fill="#8a5a2b" stroke="#3a2410" strokeWidth={1} />
      <rect x={x + 3} y={y - 13} width={4} height={4} fill="#f5c518" stroke="#3a2410" strokeWidth={0.75} />
      {/* chimney */}
      <rect x={x + 6} y={y - 26} width={3} height={7} fill="#8a5a2b" stroke="#3a2410" strokeWidth={0.75} />
    </g>
  )
}

function House({ x, y }: Pt) {
  return (
    <g>
      <rect x={x - 12} y={y - 24} width={24} height={24} fill="#f0d79a" stroke="#3a2410" strokeWidth={1.5} />
      <polygon points={`${x - 15},${y - 23} ${x + 15},${y - 23} ${x},${y - 36}`} fill="#c96a2f" stroke="#3a2410" strokeWidth={1.5} />
      <polygon points={`${x - 15},${y - 23} ${x},${y - 36} ${x - 4},${y - 23}`} fill="#e08a3f" opacity={0.85} />
      {/* windows (gold, lit) */}
      <rect x={x - 8} y={y - 20} width={5} height={5} fill="#f5c518" stroke="#3a2410" strokeWidth={0.75} />
      <rect x={x + 3} y={y - 20} width={5} height={5} fill="#f5c518" stroke="#3a2410" strokeWidth={0.75} />
      {/* door */}
      <rect x={x - 3} y={y - 11} width={7} height={11} fill="#8a5a2b" stroke="#3a2410" strokeWidth={1} />
      <rect x={x + 2.5} y={y - 6} width={1.5} height={1.5} fill="#f5c518" />
    </g>
  )
}

function Fortress({ x, y }: Pt) {
  return (
    <g>
      {/* ominous ground glow */}
      <ellipse className="ow-storm" cx={x} cy={y} rx={20} ry={8} fill="#5a2a3a" opacity={0.5} />
      {/* storm cloud + lightning above */}
      <g transform={`translate(${x},${y - 46})`}>
        <g className="ow-storm">
          <ellipse cx={-8} cy={0} rx={9} ry={6} fill="#4a4a58" />
          <ellipse cx={4} cy={-2} rx={11} ry={7} fill="#3a3a46" />
          <ellipse cx={12} cy={2} rx={8} ry={5} fill="#4a4a58" />
        </g>
        <polygon className="ow-flash" points="2,4 -2,12 2,12 -2,20" fill="#ffe27a" stroke="#f5c518" strokeWidth={0.5} />
      </g>
      {/* stone tower */}
      <rect x={x - 11} y={y - 30} width={22} height={30} fill="#5b5b68" stroke="#26262e" strokeWidth={1.5} />
      <rect x={x - 11} y={y - 30} width={7} height={30} fill="#6d6d7a" opacity={0.7} />
      {/* battlements */}
      <rect x={x - 11} y={y - 34} width={5} height={5} fill="#4a4a56" stroke="#26262e" strokeWidth={1} />
      <rect x={x - 2.5} y={y - 34} width={5} height={5} fill="#4a4a56" stroke="#26262e" strokeWidth={1} />
      <rect x={x + 6} y={y - 34} width={5} height={5} fill="#4a4a56" stroke="#26262e" strokeWidth={1} />
      {/* dark doorway + red eye windows */}
      <rect x={x - 4} y={y - 12} width={8} height={12} fill="#1a1a20" />
      <rect x={x - 7} y={y - 24} width={3} height={4} fill="#ff5a5a" />
      <rect x={x + 4} y={y - 24} width={3} height={4} fill="#ff5a5a" />
    </g>
  )
}

function Landmark({ building, pos }: { building: BuildingState; pos: Pt }) {
  if (building.mood === 'tidy') return <Cottage {...pos} />
  if (building.mood === 'moderate') return <House {...pos} />
  return <Fortress {...pos} />
}

// ── Central savings monument: a growing golden tree ──────────
function GoldenTree({ totalSavings }: { totalSavings: number }) {
  const s = Math.max(0.7, Math.min(0.7 + totalSavings / 6000, 1.7))
  const { x, y } = MONUMENT
  const sparkles = useMemo(
    () =>
      Array.from({ length: 6 }).map((_, i) => ({
        dx: [-22, 20, -14, 16, 0, 26][i],
        dy: [-30, -34, -14, -10, -44, -22][i],
        dur: `${1.1 + (i % 3) * 0.4}s`,
      })),
    [],
  )
  return (
    <g transform={`translate(${x},${y})`}>
      {/* glowing base ring */}
      <ellipse className="ow-storm" cx={0} cy={4} rx={26 * s} ry={9 * s} fill="#f5c518" opacity={0.3} />
      <NodePad x={0} y={4} />
      <g transform={`scale(${s})`} style={{ transformBox: 'fill-box', transformOrigin: 'center bottom' } as React.CSSProperties}>
        <g className="ow-bob">
          {/* trunk */}
          <rect x={-3} y={-16} width={6} height={20} fill="#8a5a2b" stroke="#3a2410" strokeWidth={1} />
          {/* layered golden canopy */}
          <rect x={-16} y={-40} width={32} height={16} fill="#c99a12" />
          <rect x={-12} y={-50} width={24} height={14} fill="#f5c518" />
          <rect x={-8} y={-58} width={16} height={12} fill="#ffe680" />
          <rect x={-12} y={-40} width={24} height={3} fill="#a5790c" opacity={0.7} />
          <rect x={-8} y={-56} width={6} height={5} fill="#fff6c9" opacity={0.9} />
          {/* star topper */}
          <polygon points="0,-66 2,-60 8,-60 3,-56 5,-50 0,-54 -5,-50 -3,-56 -8,-60 -2,-60" fill="#fff2ab" stroke="#c99a12" strokeWidth={0.5} />
        </g>
      </g>
      {/* sparkles */}
      {sparkles.map((sp, i) => (
        <g key={i} className="ow-sparkle" style={{ ['--dur' as string]: sp.dur }} transform={`translate(${sp.dx},${sp.dy})`}>
          <polygon points="0,-3 0.8,-0.8 3,0 0.8,0.8 0,3 -0.8,0.8 -3,0 -0.8,-0.8" fill="#fff6c9" />
        </g>
      ))}
    </g>
  )
}

// ── Ambient sky life ─────────────────────────────────────────
function Cloud({ y, dur, scale = 1, opacity = 0.9 }: { y: number; dur: string; scale?: number; opacity?: number }) {
  return (
    <g className="ow-cloud" style={{ ['--dur' as string]: dur }}>
      <g transform={`translate(-60,${y}) scale(${scale})`} fill="#ffffff" opacity={opacity}>
        <ellipse cx={0} cy={0} rx={12} ry={7} />
        <ellipse cx={12} cy={-3} rx={14} ry={9} />
        <ellipse cx={26} cy={0} rx={11} ry={7} />
        <rect x={-6} y={0} width={38} height={7} />
      </g>
    </g>
  )
}

function Bird({ y, dur, delay }: { y: number; dur: string; delay: string }) {
  return (
    <g className="ow-bird" style={{ ['--dur' as string]: dur, animationDelay: delay }}>
      <g transform={`translate(-30,${y})`} stroke="#3a2f26" strokeWidth={1.5} fill="none">
        <path d="M -4 0 Q -2 -3 0 0 Q 2 -3 4 0" />
      </g>
    </g>
  )
}

function Ambient() {
  const shimmers = useMemo(
    () =>
      Array.from({ length: 16 }).map((_, i) => ({
        x: (i * 53) % VW,
        y: 70 + ((i * 37) % (VH - 90)),
        w: 6 + (i % 3) * 3,
        dur: `${1.8 + (i % 4) * 0.5}s`,
      })),
    [],
  )
  return (
    <g>
      {/* water shimmer (only reads over ocean, islands drawn on top) */}
      {shimmers.map((s, i) => (
        <rect
          key={i}
          className="ow-shimmer"
          x={s.x}
          y={s.y}
          width={s.w}
          height={2}
          fill="#bfeaff"
          style={{ ['--dur' as string]: s.dur }}
        />
      ))}
    </g>
  )
}

interface OverworldMapProps {
  buildings: BuildingState[]
  totalSpend: number
  totalSavings: number
  isEmpty: boolean
  currentLocation?: string
  /** When provided, selection is controlled by MapPage (shared dialog). */
  onSelect?: (b: BuildingState) => void
}

export function OverworldMap({
  buildings,
  totalSpend,
  totalSavings,
  isEmpty,
  currentLocation,
  onSelect,
}: OverworldMapProps) {
  const [internalSelected, setInternalSelected] = useState<BuildingState | null>(null)
  const controlled = !!onSelect
  const avatarCfg = useStore((s) => s.avatar)

  // Assign active buildings (biggest spend first) to trail slots.
  const placements = useMemo(() => placeBuildings(buildings), [buildings])

  // Trail path: through nodes (in slot order) then up to the tree.
  const trailD = useMemo(() => {
    if (placements.length === 0) return ''
    const pts = [...placements.map((p) => p.pos), MONUMENT]
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  }, [placements])

  // Where the avatar stands (most recent activity → fallback to first node).
  const avatarPos = useMemo(
    () => avatarSlot(placements, currentLocation),
    [placements, currentLocation],
  )

  // Draw landmarks back-to-front (higher on screen first).
  const drawOrder = useMemo(
    () => [...placements].sort((a, b) => a.pos.y - b.pos.y),
    [placements],
  )

  const pct = (b: BuildingState) =>
    totalSpend > 0 ? Math.round((b.totalSpend / totalSpend) * 100) : 0

  return (
    <div className="relative select-none">
      <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full block" style={{ imageRendering: 'pixelated' }}>
        <defs>
          <linearGradient id="ow-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#bfeaff" />
            <stop offset="42%" stopColor="#8fd0f2" />
            <stop offset="100%" stopColor="#3a7bd5" />
          </linearGradient>
        </defs>

        {/* sky + ocean */}
        <rect x={0} y={0} width={VW} height={VH} fill="url(#ow-sky)" />
        {/* sun */}
        <circle cx={318} cy={40} r={22} fill="#fff2ab" />
        <circle cx={318} cy={40} r={15} fill="#ffe27a" />

        <Ambient />

        {/* drifting clouds */}
        <Cloud y={34} dur="34s" scale={1} opacity={0.95} />
        <Cloud y={62} dur="52s" scale={0.7} opacity={0.8} />
        <Cloud y={20} dur="44s" scale={0.85} opacity={0.85} />
        {/* birds */}
        <Bird y={90} dur="20s" delay="0s" />
        <Bird y={110} dur="26s" delay="6s" />

        {/* land */}
        <Island />

        {/* scenery */}
        <Hill x={250} y={168} s={0.9} />
        <Hill x={95} y={165} s={0.7} />
        <Tree x={54} y={214} s={0.9} dur="3.2s" />
        <Tree x={318} y={214} s={1} dur="2.8s" />
        <Tree x={165} y={286} s={0.8} dur="3.6s" />
        <Bush x={124} y={296} s={0.9} />
        <Bush x={286} y={250} s={1} dur="3s" />
        <Bush x={70} y={258} s={0.8} dur="4s" />

        {/* winding dotted trail */}
        {trailD && (
          <>
            <path d={trailD} fill="none" stroke="#8a5a2b" strokeWidth={7} strokeLinecap="round" opacity={0.35} />
            <path
              className="ow-path"
              d={trailD}
              fill="none"
              stroke="#f2e2b8"
              strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray="0.5 8"
            />
          </>
        )}

        {/* node pads (under landmarks) */}
        {placements.map((p) => (
          <NodePad key={`pad-${p.building.location}`} x={p.pos.x} y={p.pos.y} />
        ))}

        {/* savings golden tree */}
        <GoldenTree totalSavings={totalSavings} />

        {/* landmarks (clickable nodes) */}
        {drawOrder.map((p) => (
          <g
            key={p.building.location}
            style={{ cursor: 'pointer' }}
            onClick={() => (onSelect ? onSelect(p.building) : setInternalSelected(p.building))}
          >
            <g className="ow-bob">
              <Landmark building={p.building} pos={p.pos} />
            </g>
            {/* invisible larger hit area */}
            <rect
              x={p.pos.x - 18}
              y={p.pos.y - 40}
              width={36}
              height={44}
              fill="transparent"
            />
          </g>
        ))}
      </svg>

      {/* Avatar standing on the current node (HTML overlay) */}
      {placements.length > 0 && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${(avatarPos.x / VW) * 100}%`,
            top: `${(avatarPos.y / VH) * 100}%`,
            transform: 'translate(-50%, -92%)',
          }}
        >
          <Avatar config={avatarCfg} size={38} bob />
        </div>
      )}

      {/* Empty state */}
      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-6">
          <div className="retro-panel retro-panel--blue text-center">
            <p className="font-body text-lg leading-tight text-ink">
              Uncharted waters —<br />log a spend to grow your world
            </p>
          </div>
        </div>
      )}

      {/* SNES message box on node tap (only when not controlled externally) */}
      {!controlled && internalSelected && (
        <div className="absolute left-3 right-3 bottom-3 retro-panel retro-panel--gold">
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0">
              <p className="font-pixel text-[0.6rem] text-wood-dark pixel-shadow-sm">
                {internalSelected.location.toUpperCase()}
              </p>
              <p className="font-body text-xl text-ink mt-1">{formatINR(internalSelected.totalSpend)}</p>
              <p className="font-body text-base text-ink/60">{pct(internalSelected)}% of total spending</p>
              <p className="font-body text-base text-ink/80 mt-1 leading-tight">{internalSelected.tip}</p>
            </div>
            <button
              type="button"
              onClick={() => setInternalSelected(null)}
              className="font-pixel text-[0.6rem] text-wood-dark hover:text-ink shrink-0"
            >
              X
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
