import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import { motion, useAnimationControls } from 'framer-motion'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { BuildingState } from '../../types'
import {
  MONUMENT,
  avatarSlot,
  placeBuildings,
  to3D,
  type Placement,
} from '../../lib/overworldLayout'
import { useStore } from '../../store/useStore'
import { toonGradient, softShadowTexture } from '../../lib/toon'
import { fx } from '../../lib/fx'
import { formatINR } from '../Card'
import { Avatar } from '../Avatar'

export interface ControlsApi {
  recenter: () => void
}

export type Greeting = 'save' | 'spend' | 'bigspend' | 'none'

interface OverworldSceneProps {
  buildings: BuildingState[]
  totalSavings: number
  currentLocation?: string
  focusId?: string
  greeting: Greeting
  reduced: boolean
  onSelect: (b: BuildingState) => void
  controlsApi: { current: ControlsApi | null }
}

const HOME_TARGET = new THREE.Vector3(0, 0.7, 0)
const HOME_CAM = new THREE.Vector3(7.5, 7.5, 11)

/** Chunky, stepped rise so growth reads as 16-bit rather than smooth. */
function useSteppedGrow(reduced: boolean, step = 0.12, speed = 5) {
  const value = useRef(reduced ? 1 : 0.001)
  return (group: THREE.Group | null, dt: number) => {
    value.current = THREE.MathUtils.lerp(value.current, 1, Math.min(dt * speed, 1))
    if (group) group.scale.y = Math.max(0.04, Math.round(value.current / step) * step)
  }
}

function heightUnits(h: number): number {
  return 0.5 + Math.min(Math.max((h - 30) / 170, 0), 1) * 2.0
}

/** Toon-shaded material shorthand. */
function toonProps(color: string, extra?: Partial<THREE.MeshToonMaterialParameters>) {
  return { color, gradientMap: toonGradient(), ...extra }
}

function SoftShadow({ scale = 1 }: { scale?: number }) {
  const tex = softShadowTexture()
  if (!tex) return null
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.13, 0]}>
      <planeGeometry args={[1.5 * scale, 1.5 * scale]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} opacity={0.6} />
    </mesh>
  )
}

function NodePad() {
  return (
    <>
      <SoftShadow scale={1.15} />
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.78, 0.9, 0.1, 8]} />
        <meshToonMaterial {...toonProps('#e8cf8f')} />
      </mesh>
    </>
  )
}

function Cottage({ h, glow }: { h: number; glow: number }) {
  return (
    <group>
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[1.1, h, 1.1]} />
        <meshToonMaterial {...toonProps('#f3e2b0', { emissive: '#f3e2b0', emissiveIntensity: glow * 0.4 })} />
      </mesh>
      <mesh position={[0, h + 0.28, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.92, 0.6, 4]} />
        <meshToonMaterial {...toonProps('#3a9e3f')} />
      </mesh>
      <mesh position={[0, h * 0.35, 0.56]}>
        <boxGeometry args={[0.34, Math.min(h * 0.6, 0.7), 0.06]} />
        <meshToonMaterial {...toonProps('#8a5a2b')} />
      </mesh>
    </group>
  )
}

function House({ h, glow }: { h: number; glow: number }) {
  return (
    <group>
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[1.15, h, 1.15]} />
        <meshToonMaterial {...toonProps('#f0d79a', { emissive: '#f0d79a', emissiveIntensity: glow * 0.4 })} />
      </mesh>
      <mesh position={[0, h + 0.3, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.98, 0.62, 4]} />
        <meshToonMaterial {...toonProps('#e08a3f')} />
      </mesh>
      {[-0.28, 0.28].map((x) => (
        <mesh key={x} position={[x, h * 0.62, 0.59]}>
          <boxGeometry args={[0.26, 0.26, 0.05]} />
          <meshToonMaterial {...toonProps('#f5c518', { emissive: '#f5c518', emissiveIntensity: 0.8 })} />
        </mesh>
      ))}
    </group>
  )
}

function Fortress({ h, glow, reduced }: { h: number; glow: number; reduced: boolean }) {
  const flash = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (flash.current && !reduced) {
      const on = Math.sin(state.clock.elapsedTime * 6) > 0.96 ? 1 : 0
      const mat = flash.current.material as THREE.MeshToonMaterial
      mat.emissiveIntensity = on * 2
      mat.opacity = 0.15 + on * 0.85
    }
  })
  return (
    <group>
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[1.05, h, 1.05]} />
        <meshToonMaterial {...toonProps('#5b5b68', { emissive: '#8a3b3b', emissiveIntensity: glow * 0.5 })} />
      </mesh>
      {[-0.38, 0, 0.38].map((x) => (
        <mesh key={x} position={[x, h + 0.11, 0]}>
          <boxGeometry args={[0.24, 0.24, 0.24]} />
          <meshToonMaterial {...toonProps('#4a4a56')} />
        </mesh>
      ))}
      {[-0.26, 0.26].map((x) => (
        <mesh key={x} position={[x, h * 0.66, 0.54]}>
          <boxGeometry args={[0.2, 0.24, 0.05]} />
          <meshToonMaterial {...toonProps('#ff5a5a', { emissive: '#ff3b3b', emissiveIntensity: 0.9 })} />
        </mesh>
      ))}
      <group position={[0, h + 1, 0]}>
        {[
          [-0.4, 0, 0],
          [0.2, 0.12, 0.1],
          [0.55, -0.05, -0.1],
        ].map(([x, y, z], i) => (
          <mesh key={i} position={[x, y, z]}>
            <boxGeometry args={[0.7, 0.4, 0.5]} />
            <meshToonMaterial {...toonProps(i === 1 ? '#3a3a46' : '#4a4a58')} />
          </mesh>
        ))}
        <mesh ref={flash} position={[0.1, -0.5, 0.2]}>
          <boxGeometry args={[0.08, 0.5, 0.02]} />
          <meshToonMaterial color="#ffe27a" emissive="#f5c518" emissiveIntensity={0} transparent opacity={0.15} />
        </mesh>
      </group>
    </group>
  )
}

function LandmarkNode({
  placement,
  reduced,
  selected,
  onSelect,
}: {
  placement: Placement
  reduced: boolean
  selected: boolean
  onSelect: (b: BuildingState) => void
}) {
  const { building, pos } = placement
  const [x, z] = to3D(pos)
  const grow = useSteppedGrow(reduced)
  const riser = useRef<THREE.Group>(null)
  const lifter = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const active = hovered || selected
  const glow = useRef(0)
  const h = heightUnits(building.height)

  useFrame((_, dt) => {
    grow(riser.current, dt)
    glow.current = THREE.MathUtils.lerp(glow.current, active ? 1 : 0, Math.min(dt * 10, 1))
    if (lifter.current) {
      lifter.current.position.y = glow.current * 0.24
      const s = 1 + glow.current * 0.07
      lifter.current.scale.set(s, s, s)
    }
  })

  const Shape = building.mood === 'tidy' ? Cottage : building.mood === 'moderate' ? House : Fortress

  return (
    <group
      position={[x, 0.1, z]}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(building)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHovered(false)
        document.body.style.cursor = 'default'
      }}
    >
      <NodePad />
      <group ref={lifter}>
        <group ref={riser} scale={[1, reduced ? 1 : 0.001, 1]}>
          <Shape h={h} glow={active ? 1 : 0} reduced={reduced} />
        </group>
      </group>

      {active && (
        <Html position={[0, h + 1.05, 0]} center distanceFactor={9} zIndexRange={[35, 0]}>
          <div className="ow-label">
            <span className="ow-label__name">{building.location.toUpperCase()}</span>
            <span className="ow-label__val">{formatINR(building.totalSpend)}</span>
          </div>
        </Html>
      )}
    </group>
  )
}

function GoldenTree({ totalSavings, reduced }: { totalSavings: number; reduced: boolean }) {
  const [x, z] = to3D(MONUMENT)
  const target = 0.7 + Math.min(totalSavings / 8000, 1) * 1.1
  const scale = useRef(reduced ? target : 0.4)
  const group = useRef<THREE.Group>(null)
  const star = useRef<THREE.Mesh>(null)

  useFrame((state, dt) => {
    scale.current = THREE.MathUtils.lerp(scale.current, target, Math.min(dt * 4, 1))
    if (group.current) group.current.scale.setScalar(Math.round(scale.current / 0.1) * 0.1)
    if (star.current && !reduced) star.current.rotation.y = state.clock.elapsedTime * 1.2
  })

  return (
    <group position={[x, 0.1, z]}>
      <NodePad />
      <group ref={group} scale={reduced ? target : 0.4}>
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.14, 0.18, 1, 6]} />
          <meshToonMaterial {...toonProps('#8a5a2b')} />
        </mesh>
        <mesh position={[0, 1.1, 0]}>
          <boxGeometry args={[1.5, 0.5, 1.5]} />
          <meshToonMaterial {...toonProps('#c99a12')} />
        </mesh>
        <mesh position={[0, 1.5, 0]}>
          <boxGeometry args={[1.1, 0.45, 1.1]} />
          <meshToonMaterial {...toonProps('#f5c518', { emissive: '#f5c518', emissiveIntensity: 0.35 })} />
        </mesh>
        <mesh position={[0, 1.85, 0]}>
          <boxGeometry args={[0.7, 0.4, 0.7]} />
          <meshToonMaterial {...toonProps('#ffe680', { emissive: '#ffe680', emissiveIntensity: 0.5 })} />
        </mesh>
        <mesh ref={star} position={[0, 2.3, 0]}>
          <octahedronGeometry args={[0.3, 0]} />
          <meshToonMaterial color="#fff2ab" emissive="#f5c518" emissiveIntensity={1.4} />
        </mesh>
        <pointLight position={[0, 2, 0]} color="#ffe27a" intensity={1.3} distance={6} />
      </group>
    </group>
  )
}

function Island() {
  const foam = useMemo(() => new THREE.RingGeometry(8.9, 9.6, 24), [])
  return (
    <group>
      {/* foam ring */}
      <mesh geometry={foam} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.32, 0]}>
        <meshToonMaterial {...toonProps('#bfe3ff')} transparent opacity={0.8} />
      </mesh>
      {/* cliff */}
      <mesh position={[0, -0.5, 0]}>
        <cylinderGeometry args={[8.6, 7.4, 1.1, 9]} />
        <meshToonMaterial {...toonProps('#8a5a2b')} />
      </mesh>
      {/* grass top */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[8.9, 8.6, 0.35, 9]} />
        <meshToonMaterial {...toonProps('#5fbf3f')} />
      </mesh>
      <mesh position={[-1.4, 0.24, -0.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.4, 8]} />
        <meshToonMaterial {...toonProps('#7ad257')} transparent opacity={0.7} />
      </mesh>
    </group>
  )
}

function Water({ reduced }: { reduced: boolean }) {
  const geo = useMemo(() => new THREE.PlaneGeometry(60, 60, 28, 28), [])
  const base = useMemo(() => Float32Array.from(geo.attributes.position.array as Float32Array), [geo])
  const frame = useRef(0)
  useFrame((state) => {
    if (reduced) return
    const t = state.clock.elapsedTime
    const pos = geo.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3]
      const y = base[i * 3 + 1]
      pos.setZ(i, Math.sin(x * 0.4 + t) * 0.12 + Math.cos(y * 0.5 + t * 0.8) * 0.1)
    }
    pos.needsUpdate = true
    if (frame.current++ % 2 === 0) geo.computeVertexNormals()
  })
  return (
    <mesh geometry={geo} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]}>
      <meshToonMaterial {...toonProps('#3a7bd5')} />
    </mesh>
  )
}

function Tree({ position, sway }: { position: [number, number, number]; sway: boolean }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (ref.current && sway) {
      ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.5 + position[0]) * 0.08
    }
  })
  return (
    <group position={position}>
      <SoftShadow scale={0.7} />
      <group ref={ref}>
        <mesh position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.09, 0.12, 0.7, 5]} />
          <meshToonMaterial {...toonProps('#6e4620')} />
        </mesh>
        <mesh position={[0, 0.95, 0]}>
          <coneGeometry args={[0.6, 1.1, 6]} />
          <meshToonMaterial {...toonProps('#2e7d32')} />
        </mesh>
        <mesh position={[0, 1.35, 0]}>
          <coneGeometry args={[0.4, 0.7, 6]} />
          <meshToonMaterial {...toonProps('#4fbf46')} />
        </mesh>
      </group>
    </group>
  )
}

function Clouds({ reduced }: { reduced: boolean }) {
  const g = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (g.current && !reduced) {
      g.current.children.forEach((c, i) => {
        c.position.x = ((state.clock.elapsedTime * 0.4 + i * 6) % 26) - 13
      })
    }
  })
  return (
    <group ref={g} position={[0, 6.5, -2]}>
      {[0, 1, 2].map((i) => (
        <group key={i} position={[i * 6 - 6, i % 2, -i * 2]}>
          <mesh>
            <boxGeometry args={[2.2, 0.8, 1]} />
            <meshToonMaterial {...toonProps('#ffffff')} />
          </mesh>
          <mesh position={[0.9, 0.3, 0]}>
            <boxGeometry args={[1.2, 0.7, 0.9]} />
            <meshToonMaterial {...toonProps('#eef6ff')} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function GradientSky() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          top: { value: new THREE.Color('#a7dcff') },
          mid: { value: new THREE.Color('#d8f0ff') },
          bottom: { value: new THREE.Color('#2f6fbf') },
        },
        vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `varying vec3 vP; uniform vec3 top; uniform vec3 mid; uniform vec3 bottom;
          void main(){ float h = normalize(vP).y; vec3 c = h > 0.0 ? mix(mid, top, h) : mix(mid, bottom, -h); gl_FragColor = vec4(c,1.0); }`,
      }),
    [],
  )
  return <mesh scale={[60, 60, 60]} material={mat}>
    <sphereGeometry args={[1, 16, 16]} />
  </mesh>
}

function PathDots({ placements }: { placements: Placement[] }) {
  const dots = useMemo(() => {
    if (placements.length === 0) return []
    const pts = [...placements.map((p) => to3D(p.pos)), to3D(MONUMENT)]
    const out: [number, number][] = []
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i]
      const [bx, bz] = pts[i + 1]
      for (let t = 0.18; t < 0.9; t += 0.22) out.push([ax + (bx - ax) * t, az + (bz - az) * t])
    }
    return out
  }, [placements])
  return (
    <>
      {dots.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.24, z]}>
          <cylinderGeometry args={[0.1, 0.1, 0.05, 6]} />
          <meshToonMaterial {...toonProps('#f2e2b8')} />
        </mesh>
      ))}
    </>
  )
}

function WorldAvatar({
  pos,
  reduced,
  greeting,
}: {
  pos: [number, number]
  reduced: boolean
  greeting: Greeting
}) {
  const avatar = useStore((s) => s.avatar)
  const controls = useAnimationControls()
  const [emote, setEmote] = useState<string | null>(null)
  const timer = useRef<number>(0)

  const react = (
    def: Parameters<typeof controls.start>[0],
    emoji: string,
  ) => {
    if (reduced) return
    void controls.start(def)
    setEmote(emoji)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setEmote(null), 1300)
  }

  const hop = { y: [0, -16, 0, -6, 0], transition: { duration: 0.7, ease: 'easeOut' as const } }
  const worry = { x: [0, -4, 4, -4, 4, 0], rotate: [0, -3, 3, -3, 3, 0], transition: { duration: 0.6 } }
  const cheer = { y: [0, -22, 0], scale: [1, 1.12, 1], transition: { duration: 0.6, ease: 'easeOut' as const } }
  const spin = { rotate: [0, 360], y: [0, -18, 0], transition: { duration: 0.85, ease: 'easeOut' as const } }

  useEffect(() => {
    // Reactions are driven purely by existing events — no new game logic.
    const offCoins = fx.on('coins', ({ kind, amount }) => {
      if (kind === 'save') react(hop, '😄')
      else if (amount >= 2000) react(worry, '😰')
    })
    const offSoul = fx.on('soulBurst', () => react(cheer, '✨'))
    const offLevel = fx.on('levelUp', () => react(spin, '🎉'))
    return () => {
      offCoins()
      offSoul()
      offLevel()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced])

  // Entrance greeting based on the most recent activity (existing state).
  useEffect(() => {
    if (reduced || greeting === 'none') return
    const id = window.setTimeout(() => {
      if (greeting === 'save') react(hop, '😄')
      else if (greeting === 'bigspend') react(worry, '😰')
    }, 500)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [x, z] = pos
  return (
    <group position={[x, 0, z]}>
      <SoftShadow scale={0.75} />
      <Html position={[0, 1.15, 0]} center distanceFactor={8.5} zIndexRange={[40, 0]}>
        <motion.div animate={controls} style={{ position: 'relative', pointerEvents: 'none' }}>
          {emote && <div className="ow-emote">{emote}</div>}
          <Avatar config={avatar} size={44} bob={!reduced} />
        </motion.div>
      </Html>
    </group>
  )
}

function CameraRig({
  controlsRef,
  focusPos,
  reduced,
  controlsApi,
}: {
  controlsRef: { current: OrbitControlsImpl | null }
  focusPos: THREE.Vector3 | null
  reduced: boolean
  controlsApi: { current: ControlsApi | null }
}) {
  const { camera } = useThree()
  const desired = useRef(new THREE.Vector3().copy(HOME_TARGET))
  const flyHome = useRef(false)

  useEffect(() => {
    controlsApi.current = { recenter: () => (flyHome.current = true) }
    return () => {
      controlsApi.current = null
    }
  }, [controlsApi])

  useFrame((_, dt) => {
    const c = controlsRef.current
    if (!c) return
    desired.current.copy(focusPos ?? HOME_TARGET)
    c.target.lerp(desired.current, Math.min(dt * 3, 1))
    if (flyHome.current) {
      camera.position.lerp(HOME_CAM, Math.min(dt * 3, 1))
      if (camera.position.distanceTo(HOME_CAM) < 0.06) flyHome.current = false
    }
    c.autoRotate = !reduced && !focusPos && !flyHome.current
    c.update()
  })
  return null
}

export function OverworldScene({
  buildings,
  totalSavings,
  currentLocation,
  focusId,
  greeting,
  reduced,
  onSelect,
  controlsApi,
}: OverworldSceneProps) {
  const island = useRef<THREE.Group>(null)
  const controlsRef = useRef<OrbitControlsImpl | null>(null)

  const placements = useMemo(() => placeBuildings(buildings), [buildings])
  const avatarPos = to3D(avatarSlot(placements, currentLocation))

  const focusPos = useMemo(() => {
    const p = placements.find((pl) => pl.building.location === focusId)
    if (!p) return null
    const [fx, fz] = to3D(p.pos)
    return new THREE.Vector3(fx, 0.9, fz)
  }, [focusId, placements])

  useFrame((state) => {
    if (island.current && !reduced) {
      island.current.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.05
    }
  })

  return (
    <>
      <GradientSky />
      <fog attach="fog" args={['#bfe3ff', 22, 46]} />

      <hemisphereLight args={['#cfeeff', '#6b8f3a', 0.7]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[6, 11, 5]} intensity={1.25} color="#ffe9c2" />
      <directionalLight position={[-6, 4, -6]} intensity={0.35} color="#bfe3ff" />

      <mesh position={[10, 12, -12]}>
        <sphereGeometry args={[1.6, 10, 10]} />
        <meshBasicMaterial color="#fff2ab" />
      </mesh>

      <Clouds reduced={reduced} />
      <Water reduced={reduced} />

      <group ref={island}>
        <Island />
        <Tree position={[-5.2, 0.2, 1.4]} sway={!reduced} />
        <Tree position={[5.4, 0.2, 1]} sway={!reduced} />
        <Tree position={[-2, 0.2, 5]} sway={!reduced} />
        <Tree position={[4, 0.2, -4.4]} sway={!reduced} />

        <PathDots placements={placements} />
        <GoldenTree totalSavings={totalSavings} reduced={reduced} />

        {placements.map((p) => (
          <LandmarkNode
            key={p.building.location}
            placement={p}
            reduced={reduced}
            selected={focusId === p.building.location}
            onSelect={onSelect}
          />
        ))}

        {placements.length > 0 && (
          <WorldAvatar pos={avatarPos} reduced={reduced} greeting={greeting} />
        )}
      </group>

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        enablePan={false}
        enableZoom
        zoomSpeed={0.8}
        rotateSpeed={0.6}
        autoRotateSpeed={0.35}
        minDistance={6}
        maxDistance={20}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.35}
        target={[0, 0.7, 0]}
      />
      <CameraRig
        controlsRef={controlsRef}
        focusPos={focusPos}
        reduced={reduced}
        controlsApi={controlsApi}
      />
    </>
  )
}
