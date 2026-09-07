/**
 * Avatar catalog + placeholder pixel-art generator.
 *
 * The avatar is a stack of transparent layers rendered back-to-front:
 *   body → outfit → hair-back → eyes → hair-front → hat → accessory
 *
 * Each layer maps to a deterministic PNG path `/avatar/<folder>/<id>.png`.
 * Until real PNGs exist, every layer also has a generated SVG pixel-matrix
 * placeholder (a real grid of colored squares forming a full-body character)
 * so the builder works immediately. Dropping real PNGs into /public/avatar/
 * later needs ZERO code changes — the <Avatar> component prefers the PNG when
 * it loads and falls back to this placeholder otherwise.
 *
 * All parts are authored on a fixed 32×32 pixel grid so layers align exactly.
 */

export const AVATAR_GRID = 32

export interface AvatarConfig {
  body: string
  skin: string
  hair: string
  hairColor: string
  eyes: string
  outfit: string
  hat: string
  accessory: string
}

export type CategoryId = keyof AvatarConfig

export interface CategoryDef {
  id: CategoryId
  label: string
  kind: 'shape' | 'color'
  options: string[]
}

/** A single pixel rectangle on the 32×32 grid. */
export interface Rect {
  x: number
  y: number
  w: number
  h: number
  c: string
}

/** One renderable layer: a PNG path + its SVG placeholder rects. */
export interface AvatarLayer {
  key: string
  folder: string
  id: string
  rects: Rect[]
}

// ── helpers ────────────────────────────────────────────────
function r(x: number, y: number, w: number, h: number, c: string): Rect {
  return { x, y, w, h, c }
}

function byte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)))
}

/** Darken (amt<0) or lighten (amt>0) a #rrggbb color. amt in [-1, 1]. */
export function shade(hex: string, amt: number): string {
  const h = hex.replace('#', '')
  const rr = parseInt(h.slice(0, 2), 16)
  const gg = parseInt(h.slice(2, 4), 16)
  const bb = parseInt(h.slice(4, 6), 16)
  const mix = (ch: number) => (amt < 0 ? ch * (1 + amt) : ch + (255 - ch) * amt)
  const to2 = (n: number) => byte(n).toString(16).padStart(2, '0')
  return `#${to2(mix(rr))}${to2(mix(gg))}${to2(mix(bb))}`
}

// ── color palettes (these categories tint other layers) ────
export const SKIN_COLORS: Record<string, string> = {
  light: '#ffd9b3',
  tan: '#e8b07a',
  brown: '#a5673f',
  deep: '#6b4423',
  olive: '#cd9b5a',
  mint: '#a9ecc6',
  lavender: '#d9c2ff',
  bot: '#c2cad6',
}

export const HAIR_COLORS: Record<string, string> = {
  black: '#20232a',
  brown: '#6b3e1d',
  blonde: '#f3d27a',
  red: '#c0392b',
  blue: '#4a90d9',
  pink: '#ff8fc7',
  white: '#e8e8ee',
  green: '#4caf50',
}

// ── BODY (silhouette, tinted by skin) ──────────────────────
// Head position is CONSTANT across builds so eyes/hair/hat always align.
function bodyRects(variant: string, skin: string): Rect[] {
  const d = shade(skin, -0.22)
  const base = [
    r(11, 5, 10, 10, skin), // head
    r(10, 8, 1, 3, skin),
    r(21, 8, 1, 3, skin), // ears
    r(20, 5, 1, 10, d), // face right shade
    r(14, 15, 4, 1, skin), // neck
  ]
  let build: Rect[]
  switch (variant) {
    case 'slim':
      build = [
        r(12, 16, 8, 8, skin),
        r(19, 16, 1, 8, d),
        r(9, 16, 2, 7, skin),
        r(21, 16, 2, 7, skin),
        r(13, 24, 2, 6, skin),
        r(17, 24, 2, 6, skin),
        r(13, 30, 2, 2, d),
        r(17, 30, 2, 2, d),
      ]
      break
    case 'buff':
      build = [
        r(10, 16, 12, 8, skin),
        r(21, 16, 1, 8, d),
        r(7, 16, 3, 8, skin),
        r(22, 16, 3, 8, skin),
        r(12, 24, 4, 6, skin),
        r(16, 24, 4, 6, skin),
        r(11, 30, 5, 2, d),
        r(16, 30, 5, 2, d),
      ]
      break
    case 'round':
      build = [
        r(10, 16, 12, 7, skin),
        r(21, 16, 1, 7, d),
        r(8, 17, 2, 6, skin),
        r(22, 17, 2, 6, skin),
        r(11, 23, 5, 5, skin),
        r(16, 23, 5, 5, skin),
        r(11, 28, 5, 2, d),
        r(16, 28, 5, 2, d),
      ]
      break
    default: // 'reg'
      build = [
        r(11, 16, 10, 8, skin),
        r(20, 16, 1, 8, d),
        r(8, 16, 3, 7, skin),
        r(21, 16, 3, 7, skin),
        r(12, 24, 3, 6, skin),
        r(17, 24, 3, 6, skin),
        r(11, 30, 4, 2, d),
        r(17, 30, 4, 2, d),
      ]
  }
  return [...base, ...build]
}

const BODY_OPTIONS = ['reg', 'slim', 'buff', 'round']

// ── EYES (+ a small neutral mouth) ─────────────────────────
const EYE_D = '#26232e'
const EYE_W = '#ffffff'
const EYE_G = '#f5c518'
const MOUTH = '#8a4b52'
const mouth: Rect[] = [r(14, 12, 4, 1, MOUTH)]

const EYES: Record<string, Rect[]> = {
  round: [
    r(13, 9, 2, 2, EYE_W),
    r(14, 10, 1, 1, EYE_D),
    r(17, 9, 2, 2, EYE_W),
    r(17, 10, 1, 1, EYE_D),
    ...mouth,
  ],
  dots: [r(14, 10, 1, 1, EYE_D), r(17, 10, 1, 1, EYE_D), ...mouth],
  wide: [
    r(13, 9, 2, 3, EYE_W),
    r(14, 10, 1, 2, EYE_D),
    r(17, 9, 2, 3, EYE_W),
    r(17, 10, 1, 2, EYE_D),
    ...mouth,
  ],
  happy: [
    r(13, 10, 1, 1, EYE_D),
    r(14, 9, 1, 1, EYE_D),
    r(15, 10, 1, 1, EYE_D),
    r(16, 10, 1, 1, EYE_D),
    r(17, 9, 1, 1, EYE_D),
    r(18, 10, 1, 1, EYE_D),
    ...mouth,
  ],
  sleepy: [r(13, 10, 2, 1, EYE_D), r(17, 10, 2, 1, EYE_D), ...mouth],
  star: [
    r(13, 9, 2, 2, EYE_W),
    r(14, 10, 1, 1, EYE_G),
    r(17, 9, 2, 2, EYE_W),
    r(17, 10, 1, 1, EYE_G),
    ...mouth,
  ],
  angry: [
    r(13, 8, 2, 1, EYE_D),
    r(17, 8, 2, 1, EYE_D),
    r(13, 9, 2, 2, EYE_W),
    r(14, 10, 1, 1, EYE_D),
    r(17, 9, 2, 2, EYE_W),
    r(17, 10, 1, 1, EYE_D),
    ...mouth,
  ],
}

// ── HAIR (tinted by hairColor, split into back/front layers) ─
type HairParts = { back: Rect[]; front: Rect[] }
const HAIR_BUILDERS: Record<string, (c: string) => HairParts> = {
  bald: () => ({ back: [], front: [] }),
  short: (c) => ({
    back: [],
    front: [
      r(11, 3, 10, 3, c),
      r(11, 6, 1, 3, c),
      r(20, 6, 1, 3, c),
      r(12, 6, 2, 1, c),
      r(18, 6, 2, 1, c),
      r(11, 3, 10, 1, shade(c, 0.28)),
    ],
  }),
  buzz: (c) => ({
    back: [],
    front: [r(11, 4, 10, 2, c), r(11, 6, 1, 2, c), r(20, 6, 1, 2, c)],
  }),
  spiky: (c) => ({
    back: [],
    front: [
      r(11, 4, 10, 2, c),
      r(11, 1, 2, 3, c),
      r(14, 0, 2, 4, c),
      r(17, 1, 2, 3, c),
      r(20, 2, 1, 2, c),
      r(10, 2, 1, 2, c),
    ],
  }),
  long: (c) => ({
    back: [
      r(9, 5, 14, 13, c),
      r(9, 5, 1, 13, shade(c, -0.2)),
      r(22, 5, 1, 13, shade(c, -0.2)),
    ],
    front: [
      r(11, 3, 10, 3, c),
      r(11, 6, 1, 4, c),
      r(20, 6, 1, 4, c),
      r(12, 6, 2, 1, c),
      r(18, 6, 2, 1, c),
    ],
  }),
  ponytail: (c) => ({
    back: [r(21, 6, 2, 4, c), r(22, 9, 2, 6, c), r(22, 15, 1, 2, shade(c, -0.2))],
    front: [r(11, 3, 10, 3, c), r(11, 6, 1, 3, c), r(20, 6, 1, 3, c)],
  }),
  bun: (c) => ({
    back: [r(14, 1, 4, 3, c), r(15, 0, 2, 1, c)],
    front: [r(11, 4, 10, 2, c), r(11, 6, 1, 2, c), r(20, 6, 1, 2, c)],
  }),
  mohawk: (c) => ({
    back: [],
    front: [r(15, 0, 2, 7, c), r(14, 3, 1, 3, c), r(17, 3, 1, 3, c)],
  }),
}

// ── OUTFIT (own palette, drawn over torso) ─────────────────
const OUTFIT: Record<string, Rect[]> = {
  tee: [
    r(11, 16, 10, 6, '#4a90d9'),
    r(8, 16, 3, 3, '#4a90d9'),
    r(21, 16, 3, 3, '#4a90d9'),
    r(11, 16, 10, 1, '#6aa9e8'),
    r(14, 16, 4, 1, '#2e6fb0'),
  ],
  hoodie: [
    r(11, 16, 10, 7, '#e67e22'),
    r(8, 16, 3, 7, '#e67e22'),
    r(21, 16, 3, 7, '#e67e22'),
    r(12, 15, 8, 1, '#c96a15'),
    r(15, 18, 2, 4, '#c96a15'),
  ],
  dress: [
    r(11, 16, 10, 5, '#e84393'),
    r(8, 16, 3, 2, '#e84393'),
    r(21, 16, 3, 2, '#e84393'),
    r(9, 21, 14, 4, '#d63384'),
    r(10, 25, 12, 1, '#b02a6f'),
  ],
  armor: [
    r(11, 16, 10, 7, '#9aa5b1'),
    r(8, 16, 3, 6, '#8592a0'),
    r(21, 16, 3, 6, '#8592a0'),
    r(11, 16, 10, 1, '#c3ccd6'),
    r(11, 20, 10, 1, '#6b7580'),
    r(14, 17, 4, 2, '#c3ccd6'),
  ],
  suit: [
    r(11, 16, 10, 8, '#2d3436'),
    r(8, 16, 3, 7, '#2d3436'),
    r(21, 16, 3, 7, '#2d3436'),
    r(15, 16, 2, 7, '#ecf0f1'),
    r(15, 17, 1, 4, '#c0392b'),
  ],
  robe: [
    r(11, 16, 10, 13, '#6c5ce7'),
    r(8, 16, 3, 8, '#6c5ce7'),
    r(21, 16, 3, 8, '#6c5ce7'),
    r(11, 22, 10, 1, '#f5c518'),
    r(11, 16, 10, 1, '#8571f0'),
  ],
}

// ── HAT (over hair-front) ──────────────────────────────────
const HAT: Record<string, Rect[]> = {
  none: [],
  cap: [r(11, 3, 10, 2, '#c0392b'), r(11, 2, 7, 1, '#c0392b'), r(11, 5, 7, 1, '#7d2118')],
  beanie: [
    r(11, 2, 10, 3, '#2980b9'),
    r(11, 5, 10, 1, '#1c6091'),
    r(15, 1, 2, 1, '#8bc34a'),
  ],
  crown: [
    r(11, 3, 10, 2, '#f5c518'),
    r(11, 1, 2, 2, '#f5c518'),
    r(15, 1, 2, 2, '#f5c518'),
    r(19, 1, 2, 2, '#f5c518'),
    r(13, 2, 1, 1, '#ff6b6b'),
    r(18, 2, 1, 1, '#4a90d9'),
  ],
  wizard: [
    r(15, 0, 2, 2, '#6c5ce7'),
    r(14, 2, 4, 1, '#6c5ce7'),
    r(13, 3, 6, 2, '#5a4bd0'),
    r(12, 5, 8, 1, '#6c5ce7'),
    r(16, 1, 1, 1, '#f5c518'),
  ],
  halo: [r(12, 1, 8, 1, '#ffe27a'), r(11, 2, 1, 1, '#ffe27a'), r(20, 2, 1, 1, '#ffe27a')],
  headband: [r(11, 6, 10, 1, '#e84393'), r(12, 5, 2, 1, '#ff8fc7')],
}

// ── ACCESSORY (front-most) ─────────────────────────────────
const ACCESSORY: Record<string, Rect[]> = {
  none: [],
  glasses: [
    r(12, 9, 3, 2, '#1b1b2e'),
    r(16, 9, 3, 2, '#1b1b2e'),
    r(15, 9, 1, 1, '#1b1b2e'),
    r(13, 9, 1, 1, '#6ec6ff'),
    r(17, 9, 1, 1, '#6ec6ff'),
  ],
  earrings: [r(10, 11, 1, 1, '#f5c518'), r(21, 11, 1, 1, '#f5c518')],
  scarf: [r(11, 15, 10, 2, '#e74c3c'), r(13, 17, 2, 3, '#c0392b')],
  blush: [r(12, 11, 2, 1, '#ff8fb0'), r(18, 11, 2, 1, '#ff8fb0')],
  freckles: [
    r(13, 11, 1, 1, '#a5673f'),
    r(18, 11, 1, 1, '#a5673f'),
    r(12, 12, 1, 1, '#a5673f'),
    r(19, 12, 1, 1, '#a5673f'),
  ],
}

// ── public catalog ─────────────────────────────────────────
export const CATEGORIES: CategoryDef[] = [
  { id: 'body', label: 'Body', kind: 'shape', options: BODY_OPTIONS },
  { id: 'skin', label: 'Skin', kind: 'color', options: Object.keys(SKIN_COLORS) },
  { id: 'hair', label: 'Hair', kind: 'shape', options: Object.keys(HAIR_BUILDERS) },
  { id: 'hairColor', label: 'Hair Color', kind: 'color', options: Object.keys(HAIR_COLORS) },
  { id: 'eyes', label: 'Eyes', kind: 'shape', options: Object.keys(EYES) },
  { id: 'outfit', label: 'Outfit', kind: 'shape', options: Object.keys(OUTFIT) },
  { id: 'hat', label: 'Hat', kind: 'shape', options: Object.keys(HAT) },
  { id: 'accessory', label: 'Accessory', kind: 'shape', options: Object.keys(ACCESSORY) },
]

export const DEFAULT_AVATAR: AvatarConfig = {
  body: 'reg',
  skin: 'light',
  hair: 'short',
  hairColor: 'brown',
  eyes: 'round',
  outfit: 'tee',
  hat: 'none',
  accessory: 'none',
}

/** Ensure a config always has valid values for every category. */
export function normalizeAvatar(partial?: Partial<AvatarConfig> | null): AvatarConfig {
  const merged = { ...DEFAULT_AVATAR, ...(partial ?? {}) }
  for (const cat of CATEGORIES) {
    if (!cat.options.includes(merged[cat.id])) merged[cat.id] = DEFAULT_AVATAR[cat.id]
  }
  return merged
}

/** Pick a random valid avatar. */
export function randomAvatar(): AvatarConfig {
  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]
  const out = {} as AvatarConfig
  for (const cat of CATEGORIES) out[cat.id] = pick(cat.options)
  return out
}

/** Resolve a display swatch color for a color-category option. */
export function swatchColor(category: CategoryId, id: string): string {
  if (category === 'skin') return SKIN_COLORS[id] ?? SKIN_COLORS.light
  if (category === 'hairColor') return HAIR_COLORS[id] ?? HAIR_COLORS.brown
  return '#9b5de5'
}

/**
 * Build the ordered, back-to-front layer stack for a config. Each layer
 * carries its deterministic PNG path (folder + id) and the SVG placeholder
 * rects to draw when no PNG is present.
 */
export function buildAvatarLayers(config: AvatarConfig): AvatarLayer[] {
  const cfg = normalizeAvatar(config)
  const skin = SKIN_COLORS[cfg.skin] ?? SKIN_COLORS.light
  const hairColor = HAIR_COLORS[cfg.hairColor] ?? HAIR_COLORS.brown
  const hair = (HAIR_BUILDERS[cfg.hair] ?? HAIR_BUILDERS.bald)(hairColor)

  return [
    { key: 'body', folder: 'body', id: cfg.body, rects: bodyRects(cfg.body, skin) },
    { key: 'outfit', folder: 'outfit', id: cfg.outfit, rects: OUTFIT[cfg.outfit] ?? [] },
    { key: 'hair-back', folder: 'hair-back', id: cfg.hair, rects: hair.back },
    { key: 'eyes', folder: 'eyes', id: cfg.eyes, rects: EYES[cfg.eyes] ?? [] },
    { key: 'hair-front', folder: 'hair-front', id: cfg.hair, rects: hair.front },
    { key: 'hat', folder: 'hat', id: cfg.hat, rects: HAT[cfg.hat] ?? [] },
    { key: 'accessory', folder: 'accessory', id: cfg.accessory, rects: ACCESSORY[cfg.accessory] ?? [] },
  ]
}

/** Human-friendly label for an option id. */
export function optionLabel(id: string): string {
  return id.charAt(0).toUpperCase() + id.slice(1)
}
