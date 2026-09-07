import { useRef, useState, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { OrbitControls, Html, Grid } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'
import type { BuildingState } from '../../types'
import { buildingPosition, savingsToMonumentScale, spendToHeight3D } from '../../lib/map3d'
import { Avatar } from '../Avatar'
import { useStore } from '../../store/useStore'

export interface CityControlsApi {
  recenter: () => void
}

interface CitySceneProps {
  buildings: BuildingState[]
  totalSpend: number
  totalSavings: number
  isEmpty: boolean
  currentLocation?: string
  reduced: boolean
  onSelect: (b: BuildingState) => void
  controlsApi: { current: CityControlsApi | null }
}

interface BuildingMeshProps {
  building: BuildingState
  position: [number, number, number]
  onSelect: (b: BuildingState) => void
}

function BuildingMesh({ building, position, onSelect }: BuildingMeshProps) {
  const groupRef = useRef<THREE.Group>(null)
  const targetHeight = spendToHeight3D(building.totalSpend)
  const animatedHeight = useRef(0.01)
  const [hovered, setHovered] = useState(false)

  const { bodyColor, roofColor, width, depth, emissiveIntensity, pulse } = useMemo(() => {
    switch (building.mood) {
      case 'tidy':
        return {
          bodyColor: '#2a6b4a',
          roofColor: '#3ddc97',
          width: 1.1,
          depth: 1.1,
          emissiveIntensity: 0.35,
          pulse: false,
        }
      case 'moderate':
        return {
          bodyColor: '#8a7020',
          roofColor: '#f5c518',
          width: 0.85,
          depth: 0.85,
          emissiveIntensity: 0.45,
          pulse: false,
        }
      default:
        return {
          bodyColor: '#4a1a1a',
          roofColor: '#ff6b6b',
          width: 0.65,
          depth: 0.65,
          emissiveIntensity: 0.7,
          pulse: true,
        }
    }
  }, [building.mood])

  useFrame((_, delta) => {
    animatedHeight.current = THREE.MathUtils.lerp(
      animatedHeight.current,
      targetHeight,
      Math.min(delta * 4, 1),
    )
    if (groupRef.current) {
      groupRef.current.scale.y = animatedHeight.current
      groupRef.current.position.y = animatedHeight.current / 2
    }
  })

  const windowCount = Math.max(1, Math.floor(targetHeight / 0.5))

  return (
    <group position={[position[0], 0, position[2]]}>
      <group
        ref={groupRef}
        scale={[1, 0.01, 1]}
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
        <mesh castShadow receiveShadow scale={hovered ? 1.05 : 1}>
          <boxGeometry args={[width, 1, depth]} />
          <meshStandardMaterial
            color={bodyColor}
            emissive={building.color}
            emissiveIntensity={
              pulse
                ? emissiveIntensity * (0.7 + Math.sin(Date.now() * 0.003) * 0.3)
                : emissiveIntensity * 0.3
            }
            roughness={0.7}
          />
        </mesh>

        <mesh position={[0, 0.58, 0]} castShadow>
          {building.mood === 'tidy' ? (
            <coneGeometry args={[width * 0.75, 0.35, 4]} />
          ) : (
            <boxGeometry args={[width * 1.05, 0.18, depth * 1.05]} />
          )}
          <meshStandardMaterial color={roofColor} emissive={roofColor} emissiveIntensity={0.4} />
        </mesh>

        {Array.from({ length: windowCount }).map((_, row) => (
          <mesh key={row} position={[0, -0.35 + row * 0.22, depth / 2 + 0.02]}>
            <planeGeometry args={[width * 0.45, 0.1]} />
            <meshStandardMaterial
              color="#f5c518"
              emissive="#f5c518"
              emissiveIntensity={building.mood === 'ominous' ? 0.2 : 0.8}
            />
          </mesh>
        ))}
      </group>

      {hovered && (
        <Html distanceFactor={12} position={[0, targetHeight + 0.5, 0]} center>
          <div className="px-2 py-1 rounded bg-vault-indigo/90 border border-coin-gold/30 text-[10px] text-coin-gold whitespace-nowrap pointer-events-none">
            {building.location}
          </div>
        </Html>
      )}
    </group>
  )
}

function SavingsMonument({ totalSavings }: { totalSavings: number }) {
  const groupRef = useRef<THREE.Group>(null)
  const targetScale = savingsToMonumentScale(totalSavings)
  const currentScale = useRef(0.5)

  useFrame((_, delta) => {
    currentScale.current = THREE.MathUtils.lerp(
      currentScale.current,
      targetScale,
      Math.min(delta * 3, 1),
    )
    if (groupRef.current) {
      groupRef.current.scale.setScalar(currentScale.current)
    }
  })

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.35, 1.2, 8]} />
        <meshStandardMaterial
          color="#1a5c3a"
          emissive="#3ddc97"
          emissiveIntensity={0.6}
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>
      <mesh position={[0, 1.35, 0]} castShadow>
        <octahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial
          color="#3ddc97"
          emissive="#3ddc97"
          emissiveIntensity={1.2}
          transparent
          opacity={0.9}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.6, 1.1, 32]} />
        <meshStandardMaterial color="#2a6b4a" emissive="#3ddc97" emissiveIntensity={0.15} />
      </mesh>
      {[[-0.8, 0.5], [0.7, -0.6], [-0.5, -0.7]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.06, 0.08, 0.5, 6]} />
            <meshStandardMaterial color="#3d2817" />
          </mesh>
          <mesh position={[0, 0.55, 0]}>
            <coneGeometry args={[0.25, 0.45, 6]} />
            <meshStandardMaterial color="#3ddc97" emissive="#3ddc97" emissiveIntensity={0.2} />
          </mesh>
        </group>
      ))}
      <pointLight position={[0, 1.5, 0]} color="#3ddc97" intensity={2} distance={5} />
    </group>
  )
}

function FloatingIsland() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <cylinderGeometry args={[4.5, 4.8, 0.3, 32]} />
        <meshStandardMaterial color="#8a5a2b" roughness={0.8} flatShading />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <cylinderGeometry args={[4.5, 4.5, 0.08, 32]} />
        <meshStandardMaterial color="#5fbf3f" roughness={0.7} flatShading />
      </mesh>
      <Grid
        position={[0, 0.08, 0]}
        args={[9, 9]}
        cellSize={0.5}
        cellThickness={0.4}
        cellColor="#2e7d3240"
        sectionSize={2}
        sectionThickness={0.8}
        sectionColor="#f5c51830"
        fadeDistance={12}
        infiniteGrid={false}
      />
    </group>
  )
}

export function CityScene({
  buildings,
  totalSavings,
  isEmpty,
  currentLocation,
  reduced,
  onSelect,
  controlsApi,
}: CitySceneProps) {
  const islandRef = useRef<THREE.Group>(null)
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const avatar = useStore((s) => s.avatar)
  const HOME_CAM = useMemo(() => new THREE.Vector3(8, 7, 8), [])

  useEffect(() => {
    controlsApi.current = {
      recenter: () => {
        if (controlsRef.current) {
          controlsRef.current.object.position.copy(HOME_CAM)
          controlsRef.current.target.set(0, 0.5, 0)
          controlsRef.current.update()
        }
      },
    }
    return () => {
      controlsApi.current = null
    }
  }, [controlsApi, HOME_CAM])

  useFrame((state) => {
    if (islandRef.current && !reduced) {
      islandRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.06
    }
  })

  const avatarPos = useMemo(() => {
    const idx = buildings.findIndex((b) => b.location === currentLocation)
    const i = idx >= 0 ? idx : 0
    return buildingPosition(i, Math.max(buildings.length, 1))
  }, [buildings, currentLocation])

  return (
    <>
      <color attach="background" args={['#8fd0f2']} />
      <fog attach="fog" args={['#bfe3ff', 14, 30]} />

      <hemisphereLight args={['#cfeeff', '#6b8f3a', 0.65]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 10, 5]} intensity={1.1} castShadow color="#ffe9c2" />
      <directionalLight position={[-4, 4, -4]} intensity={0.35} color="#bfe3ff" />

      <group ref={islandRef}>
        <FloatingIsland />
        <SavingsMonument totalSavings={totalSavings} />

        {buildings.map((building, i) => (
          <BuildingMesh
            key={building.location}
            building={building}
            position={buildingPosition(i, buildings.length)}
            onSelect={onSelect}
          />
        ))}

        {buildings.length > 0 && (
          <Html position={[avatarPos[0], 1.1, avatarPos[2]]} center distanceFactor={9}>
            <div style={{ pointerEvents: 'none' }}>
              <Avatar config={avatar} size={36} bob={!reduced} />
            </div>
          </Html>
        )}
      </group>

      {isEmpty && (
        <Html position={[0, 2.5, 0]} center>
          <div className="retro-panel retro-panel--blue text-center max-w-[220px] pointer-events-none">
            <p className="font-body text-sm text-ink leading-snug">
              Your city is waiting — log a spend to build it
            </p>
          </div>
        </Html>
      )}

      <OrbitControls
        ref={controlsRef}
        autoRotate={!reduced}
        autoRotateSpeed={0.45}
        enableDamping
        dampingFactor={0.08}
        enablePan={false}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.4}
        minDistance={6}
        maxDistance={16}
        target={[0, 0.5, 0]}
      />
    </>
  )
}
