import { useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

export interface CoinInstance {
  id: string
  /** Spawn anchor in viewport pixels (top-left origin). */
  ax: number
  ay: number
  vx: number
  vy: number
  delay: number
  size: number
  color: string
  emissive: string
}

const GRAVITY = -1750
const LIFE = 1.5

function Coin({ coin, onDone }: { coin: CoinInstance; onDone: (id: string) => void }) {
  const ref = useRef<THREE.Group>(null)
  const { size } = useThree()
  // convert viewport px (top-left) → ortho world px (center origin, y up)
  const start = useRef({
    x: coin.ax - size.width / 2,
    y: size.height / 2 - coin.ay,
    vx: coin.vx,
    vy: coin.vy,
    t: 0,
    done: false,
  })
  const floorY = -size.height / 2 + 34

  useFrame((_, dt) => {
    const s = start.current
    if (s.done || !ref.current) return
    s.t += dt
    const local = s.t - coin.delay
    if (local < 0) {
      ref.current.visible = false
      return
    }
    ref.current.visible = true
    s.vy += GRAVITY * dt
    s.x += s.vx * dt
    s.y += s.vy * dt
    if (s.y < floorY && s.vy < 0) {
      s.y = floorY
      s.vy = -s.vy * 0.45
      s.vx *= 0.7
    }
    ref.current.position.set(s.x, s.y, 0)
    ref.current.rotation.y += dt * 9
    if (local > LIFE) {
      s.done = true
      onDone(coin.id)
      return
    }
    const fade = local > LIFE - 0.4 ? Math.max(0, (LIFE - local) / 0.4) : 1
    const mat = (ref.current.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial
    mat.opacity = fade
  })

  return (
    <group ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh>
        <cylinderGeometry args={[coin.size, coin.size, coin.size * 0.28, 10]} />
        <meshStandardMaterial
          color={coin.color}
          emissive={coin.emissive}
          emissiveIntensity={0.35}
          flatShading
          transparent
          roughness={0.5}
          metalness={0.2}
        />
      </mesh>
    </group>
  )
}

export default function CoinBurst3D({
  coins,
  onDone,
}: {
  coins: CoinInstance[]
  onDone: (id: string) => void
}) {
  return (
    <Canvas
      orthographic
      camera={{ position: [0, 0, 100], near: 0.1, far: 1000 }}
      gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
      dpr={0.55}
      style={{ imageRendering: 'pixelated', width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 6, 8]} intensity={1.1} />
      {coins.map((c) => (
        <Coin key={c.id} coin={c} onDone={onDone} />
      ))}
    </Canvas>
  )
}
