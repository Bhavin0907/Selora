import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { formatINR } from '../Card'
import { fx, type Anchor } from '../../lib/fx'
import { sfx } from '../../lib/sfx'
import { hasWebGL } from '../../lib/webgl'
import { usePrefersReducedMotion } from '../../lib/useReducedMotion'
import type { CoinInstance } from './CoinBurst3D'

const CoinBurst3D = lazy(() => import('./CoinBurst3D'))

interface FxText {
  id: string
  x: number
  y: number
  label: string
  big: boolean
}

let seq = 0
const uid = () => `fx-${Date.now()}-${seq++}`

function coinBatch(kind: 'save' | 'spend' | 'soul', anchor: Anchor): CoinInstance[] {
  const count = kind === 'spend' ? 3 : kind === 'soul' ? 5 : 6
  const size = kind === 'spend' ? 9 : kind === 'soul' ? 10 : 13
  const color = kind === 'spend' ? '#f0c020' : '#ffd83d'
  const emissive = kind === 'spend' ? '#caa010' : '#f5c518'
  return Array.from({ length: count }).map((_, i) => ({
    id: uid(),
    ax: anchor.x,
    ay: anchor.y,
    vx: (Math.random() - 0.5) * (kind === 'spend' ? 300 : 440),
    vy: (kind === 'spend' ? 440 : 520) + Math.random() * 150,
    delay: i * 0.045,
    size,
    color,
    emissive,
  }))
}

/**
 * Global feedback layer. Renders coin arcs (lazy 3D, 2D fallback) and rising
 * "+₹X" pixel text in response to fx events. Pointer-transparent overlay so it
 * never blocks interaction. Respects prefers-reduced-motion.
 */
export function FxLayer() {
  const reduced = usePrefersReducedMotion()
  const webgl = hasWebGL()
  const [coins, setCoins] = useState<CoinInstance[]>([])
  const [texts, setTexts] = useState<FxText[]>([])
  const reducedRef = useRef(reduced)
  reducedRef.current = reduced

  const removeCoin = (id: string) => setCoins((cs) => cs.filter((c) => c.id !== id))

  useEffect(() => {
    const center = (): Anchor => ({
      x: window.innerWidth / 2,
      y: window.innerHeight * 0.58,
    })

    const offCoins = fx.on('coins', ({ kind, amount, anchor }) => {
      const at = anchor ?? center()
      sfx.coin()
      if (amount > 0) {
        const id = uid()
        setTexts((t) => [...t, { id, x: at.x, y: at.y, label: `+${formatINR(amount)}`, big: kind === 'save' }])
        window.setTimeout(() => setTexts((t) => t.filter((x) => x.id !== id)), 1000)
      }
      if (reducedRef.current) return
      setCoins((cs) => [...cs, ...coinBatch(kind, at)].slice(-48))
    })

    const offSoul = fx.on('soulBurst', ({ anchor }) => {
      const at = anchor ?? center()
      sfx.select()
      if (reducedRef.current) return
      setCoins((cs) => [...cs, ...coinBatch('soul', at)].slice(-48))
    })

    return () => {
      offCoins()
      offSoul()
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[95] pointer-events-none overflow-hidden">
      {/* Coins */}
      {coins.length > 0 &&
        (webgl ? (
          <Suspense fallback={null}>
            <div className="absolute inset-0">
              <CoinBurst3D coins={coins} onDone={removeCoin} />
            </div>
          </Suspense>
        ) : (
          // 2D fallback: simple pixel coins
          coins.map((c) => (
            <span
              key={c.id}
              className="fx-coin-2d absolute"
              style={{ left: c.ax, top: c.ay, width: c.size * 1.4, height: c.size * 1.4 }}
              onAnimationEnd={() => removeCoin(c.id)}
            />
          ))
        ))}

      {/* +₹X pixel text */}
      {texts.map((t) => (
        <span
          key={t.id}
          className={`fx-text absolute font-pixel ${t.big ? 'text-[0.85rem]' : 'text-[0.65rem]'}`}
          style={{ left: t.x, top: t.y, color: t.big ? '#f5c518' : '#e08a3f' }}
        >
          {t.label}
        </span>
      ))}
    </div>
  )
}
