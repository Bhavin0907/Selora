import { Suspense, lazy, useMemo, useRef, useState } from 'react'
import { Card } from '../components/Card'
import { computeBuildings } from '../lib/map'
import { getAllLocations, useStore } from '../store/useStore'
import { hasWebGL } from '../lib/webgl'
import { sfx } from '../lib/sfx'
import { effectiveMapMode, useUiStore, type MapMode } from '../store/useUiStore'
import { MapErrorBoundary } from '../components/Map3D/MapErrorBoundary'
import { MapModeToggle } from '../components/map/MapModeToggle'
import { MapBuildingDialog } from '../components/map/MapBuildingDialog'
import { MapLoadingShell } from '../components/map/MapLoadingShell'
import { OverworldMap } from '../components/IsoWorld/OverworldMap'
import type { BuildingState } from '../types'
import type { ControlsApi, Greeting } from '../components/IsoWorld/OverworldScene'

const GpsWorldMap = lazy(() => import('../components/GpsMap/GpsWorldMap'))
const Overworld3D = lazy(() => import('../components/IsoWorld/Overworld3D'))

export function MapPage() {
  const spends = useStore((s) => s.spends)
  const savings = useStore((s) => s.savings)
  const customLocations = useStore((s) => s.customLocations)

  const storedMode = useUiStore((s) => s.mapMode)
  const webgl = hasWebGL()
  const mode = effectiveMapMode(storedMode)

  const [selected, setSelected] = useState<BuildingState | null>(null)
  const controls3d = useRef<ControlsApi | null>(null)

  const locations = useMemo(
    () => getAllLocations({ customLocations }),
    [customLocations],
  )

  const buildings = useMemo(
    () => computeBuildings(spends, savings, locations),
    [spends, savings, locations],
  )

  const activeBuildings = buildings.filter((b) => b.totalSpend > 0)
  const totalSpend = spends.reduce((s, sp) => s + sp.amount, 0)
  const totalSavings = savings.reduce((s, sv) => s + sv.amount, 0)
  const isEmpty = totalSpend === 0
  const currentLocation = spends[0]?.location

  const greeting = useMemo<Greeting>(() => {
    const lastSpend = spends[0]
    const lastSaving = savings[0]
    if (!lastSpend && !lastSaving) return 'none'
    const saveNewer = (lastSaving?.timestamp ?? -1) >= (lastSpend?.timestamp ?? -1)
    if (saveNewer && lastSaving) return 'save'
    if (lastSpend) return lastSpend.amount >= 2000 ? 'bigspend' : 'spend'
    return 'none'
  }, [spends, savings])

  const shared = {
    buildings,
    activeBuildings,
    totalSpend,
    totalSavings,
    isEmpty,
    currentLocation,
    greeting,
  }

  const select = (b: BuildingState) => {
    setSelected(b)
    sfx.select()
  }

  const handleModeChange = (_next: MapMode) => {
    setSelected(null)
  }

  const modeProps = { ...shared, selected, onSelect: select }

  const island2d = (
    <OverworldMap
      buildings={activeBuildings}
      totalSpend={totalSpend}
      totalSavings={totalSavings}
      isEmpty={isEmpty}
      currentLocation={currentLocation}
      onSelect={select}
    />
  )

  return (
    <div className="space-y-4">
      <header>
        <h1>World Map</h1>
        <p className="font-body text-base text-ink/70">
          Three views, one wallet — GPS, 2D island &amp; 3D island
        </p>
      </header>

      <Card glow="green" className="!p-3 overflow-hidden">
        <MapModeToggle
          effectiveMode={mode}
          webgl={webgl}
          onModeChange={handleModeChange}
          onRecenter={() => controls3d.current?.recenter()}
        />

        <div className="relative">
          {mode === 'gps' && (
            <MapErrorBoundary
              fallback={
                <div className="h-[340px] flex items-center justify-center retro-panel retro-panel--blue mx-1">
                  <p className="font-body text-lg text-ink text-center px-4">
                    GPS map failed to load — try 2D or 3D mode
                  </p>
                </div>
              }
            >
              <Suspense fallback={<MapLoadingShell label="LOADING GPS…" />}>
                <GpsWorldMap {...modeProps} />
              </Suspense>
            </MapErrorBoundary>
          )}

          {mode === '2d' && (
            <MapErrorBoundary fallback={island2d}>{island2d}</MapErrorBoundary>
          )}

          {mode === '3d' && (
            <MapErrorBoundary fallback={island2d}>
              {webgl ? (
                <Suspense fallback={<MapLoadingShell label="LOADING WORLD…" />}>
                  <Overworld3D
                    buildings={activeBuildings}
                    totalSavings={totalSavings}
                    currentLocation={currentLocation}
                    focusId={selected?.location}
                    greeting={greeting}
                    onSelect={select}
                    controlsApi={controls3d}
                  />
                </Suspense>
              ) : (
                island2d
              )}

              {isEmpty && webgl && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-6">
                  <div className="retro-panel retro-panel--blue text-center">
                    <p className="font-body text-lg leading-tight text-ink">
                      Uncharted waters —<br />log a spend to grow your world
                    </p>
                  </div>
                </div>
              )}
            </MapErrorBoundary>
          )}

          <MapBuildingDialog
            building={selected}
            totalSpend={totalSpend}
            onClose={() => setSelected(null)}
          />
        </div>
      </Card>

      <Card>
        <h2 className="mb-3">Legend</h2>
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center gap-1.5 p-2 bg-grass/15 shadow-[inset_0_0_0_2px_#2e7d3266]">
            <span className="text-xl">🏡</span>
            <span className="font-body text-sm text-grass-dark text-center">Cozy cottage</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 p-2 bg-coin-gold/15 shadow-[inset_0_0_0_2px_#b5860b66]">
            <span className="text-xl">🏠</span>
            <span className="font-body text-sm text-coin-gold-deep text-center">Busy house</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 p-2 bg-danger-red/15 shadow-[inset_0_0_0_2px_#d6454566]">
            <span className="text-xl">🏰</span>
            <span className="font-body text-sm text-danger-red text-center">Storm fortress</span>
          </div>
        </div>
        <p className="font-body text-sm text-ink/60 mt-3">
          Same spending data in every view. Tap a landmark for spend, share &amp; a tip.
        </p>
      </Card>
    </div>
  )
}
