/**
 * Pixel-matrix icons rendered as crisp SVG rects. Single-color icons use
 * `currentColor` so they inherit the surrounding text color (gold when a nav
 * tab is active, dim white otherwise). Multi-tone icons (flame, coin) carry
 * their own palette.
 */

type NavIconName = 'soul' | 'log' | 'map' | 'insights' | 'advisor' | 'pact'

// 12x12 single-color matrices ('.' transparent, 'X' filled)
const NAV_MATRICES: Record<NavIconName, string[]> = {
  soul: [
    '............',
    '...XXXXXX...',
    '..XXXXXXXX..',
    '.XXXXXXXXXX.',
    '.XX.XXXX.XX.',
    '.XXXXXXXXXX.',
    '.XXXXXXXXXX.',
    '.XXXXXXXXXX.',
    '.XXXXXXXXXX.',
    '.X.X.X.X.X.X',
    '............',
    '............',
  ],
  log: [
    '............',
    '.XXXXXXXXX..',
    '.X.......X..',
    '.X.XXXXX.X..',
    '.X.......X..',
    '.X.XXXXX.X..',
    '.X.......X..',
    '.X.XXXXX.X..',
    '.X.......X..',
    '.XXXXXXXXX..',
    '............',
    '............',
  ],
  map: [
    '............',
    '....XXXX....',
    '....X..X....',
    '....XXXX....',
    '..XXXXXXXX..',
    '..X.XX.X.X..',
    '..XXXXXXXX..',
    '..X.XX.X.X..',
    '..XXXXXXXX..',
    '..XXXXXXXX..',
    '............',
    '............',
  ],
  insights: [
    '............',
    '............',
    '.....XX.....',
    '.....XX.....',
    '.XX..XX.....',
    '.XX..XX..XX.',
    '.XX..XX..XX.',
    '.XX..XX..XX.',
    'XXXXXXXXXXXX',
    '............',
    '............',
    '............',
  ],
  advisor: [
    '............',
    '....XXXX....',
    '...X....X...',
    '..X......X..',
    '..X......X..',
    '..X......X..',
    '...X....X...',
    '....XXXX....',
    '.....XX.....',
    '....XXXX....',
    '............',
    '............',
  ],
  pact: [
    '............',
    '..XXXXXXXX..',
    'X.XXXXXXXX.X',
    'X.XXXXXXXX.X',
    '..XXXXXXXX..',
    '...XXXXXX...',
    '.....XX.....',
    '.....XX.....',
    '...XXXXXX...',
    '..XXXXXXXX..',
    '............',
    '............',
  ],
}

function renderMono(matrix: string[]) {
  const rects: React.ReactElement[] = []
  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix[y].length; x++) {
      if (matrix[y][x] === 'X') {
        rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="currentColor" />)
      }
    }
  }
  return rects
}

export function PixelIcon({ name, size = 22 }: { name: NavIconName; size?: number }) {
  return (
    <svg
      viewBox="0 0 12 12"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      style={{ imageRendering: 'pixelated' }}
    >
      {renderMono(NAV_MATRICES[name])}
    </svg>
  )
}

// ── Multi-tone status icons ────────────────────────────────
function renderPalette(matrix: string[], palette: Record<string, string>) {
  const rects: React.ReactElement[] = []
  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix[y].length; x++) {
      const ch = matrix[y][x]
      if (ch !== '.' && palette[ch]) {
        rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={palette[ch]} />)
      }
    }
  }
  return rects
}

const FLAME = [
  '....X...',
  '...XoX..',
  '..XooX..',
  '..XooXX.',
  '.XooooX.',
  '.XoooooX',
  '.XooaooX',
  '..XoooX.',
  '..XXXX..',
  '........',
]

const COIN = [
  '..XXXX..',
  '.XoooaX.',
  'XoooaaoX',
  'Xooaaoox',
  'Xooaaoox',
  'XoaaoooX',
  '.XooooX.',
  '..XXXX..',
]

export function FlameIcon({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 8 10" width={size} height={(size * 10) / 8} shapeRendering="crispEdges">
      {renderPalette(FLAME, { X: '#c23a1a', o: '#ff6b3d', a: '#f5c518' })}
    </svg>
  )
}

export function CoinIcon({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 8 8" width={size} height={size} shapeRendering="crispEdges">
      {renderPalette(COIN, { X: '#a67c00', o: '#f5c518', a: '#fff2ab', x: '#c99a12' })}
    </svg>
  )
}

export type { NavIconName }
