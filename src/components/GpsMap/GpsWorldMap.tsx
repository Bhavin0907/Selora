import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import { AnimatePresence, motion } from 'framer-motion'
import { Avatar } from '../Avatar'
import { formatINR } from '../Card'
import type { BuildingState } from '../../types'
import { useStore, getAllReasons } from '../../store/useStore'
import { fx } from '../../lib/fx'
import { sfx } from '../../lib/sfx'
import { computeSoulState } from '../../lib/soul'
import {
  calculateDistanceMeters,
  getLandmarkGeo,
  POTHERI_BOUNDS,
  POTHERI_CENTER,
  PROXIMITY_THRESHOLD_METERS,
} from '../../lib/gpsLocations'

/**
 * ARCHITECTURAL NOTE:
 * In the existing codebase, clicking a building in 2D or 3D map modes displays
 * an informational SNES inspection box (spend, share, mood tip) rather than a
 * merchant purchase catalog. In accordance with the project specification:
 * Instead of introducing a parallel/disconnected merchant catalog system,
 * landmark interactions on the Real GPS map open a retro Quick Spend / Quick Save
 * dialog prefilled with the landmark's location name.
 * It directly updates useStore (addSpend / addSaving) and emits global fx / sfx,
 * immediately synchronizing HUD, 2D/3D map islands, and Insights charts.
 */

interface GpsWorldMapProps {
  buildings: BuildingState[]
  totalSpend: number
  totalSavings: number
  currentLocation?: string
  onSelect?: (building: BuildingState) => void
}

// Controls camera movement to follow or pan to avatar
function MapCameraController({
  position,
  shouldFollow,
}: {
  position: [number, number]
  shouldFollow: boolean
}) {
  const map = useMap()
  const lastFollow = useRef<[number, number]>(position)

  useEffect(() => {
    if (!shouldFollow) return
    const [lat, lng] = position
    const [prevLat, prevLng] = lastFollow.current
    const dist = Math.hypot(lat - prevLat, lng - prevLng)
    // Only pan if moved noticeably
    if (dist > 0.0003) {
      map.panTo([lat, lng], { animate: true, duration: 0.5 })
      lastFollow.current = position
    }
  }, [position, shouldFollow, map])

  return null
}

// Custom Marker for the player's Avatar using createPortal
function AvatarMarker({
  position,
  avatarConfig,
}: {
  position: [number, number]
  avatarConfig: ReturnType<typeof useStore.getState>['avatar']
}) {
  const container = useMemo(() => {
    const el = document.createElement('div')
    el.className = 'leaflet-avatar-wrapper'
    return el
  }, [])

  const icon = useMemo(
    () =>
      L.divIcon({
        html: container,
        className: 'leaflet-avatar-divicon',
        iconSize: [44, 44],
        iconAnchor: [22, 38],
      }),
    [container],
  )

  return (
    <>
      <Marker position={position} icon={icon} interactive={false} zIndexOffset={1000} />
      {createPortal(
        <div className="relative flex flex-col items-center select-none pointer-events-none">
          <div className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]">
            <Avatar config={avatarConfig} size={38} bob />
          </div>
          {/* Shadow pad under avatar */}
          <div className="w-5 h-1.5 bg-black/40 rounded-full blur-[1px] -mt-1" />
        </div>,
        container,
      )}
    </>
  )
}

// Custom Landmark Pin Marker
function LandmarkMarker({
  building,
  isNear,
  onClick,
}: {
  building: BuildingState
  isNear: boolean
  onClick: () => void
}) {
  const geo = useMemo(() => getLandmarkGeo(building.location), [building.location])
  const container = useMemo(() => {
    const el = document.createElement('div')
    el.className = 'leaflet-landmark-wrapper'
    return el
  }, [])

  const icon = useMemo(
    () =>
      L.divIcon({
        html: container,
        className: 'leaflet-landmark-divicon',
        iconSize: [64, 40],
        iconAnchor: [32, 38],
      }),
    [container],
  )

  // Border color corresponding to Tidy / Moderate / Ominous
  const borderColor = building.color

  return (
    <>
      <Marker
        position={[geo.lat, geo.lng]}
        icon={icon}
        eventHandlers={{
          click: onClick,
        }}
        zIndexOffset={isNear ? 500 : 100}
      />
      {createPortal(
        <div
          onClick={onClick}
          className={`cursor-pointer transition-transform active:scale-95 select-none flex flex-col items-center ${
            isNear ? 'gps-pin-near' : ''
          }`}
          style={{
            position: 'relative',
          }}
        >
          {/* Badge container with retro border */}
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 bg-[#f7e6bd] text-[#3a2410] shadow-[0_0_0_2px_#3a2410] whitespace-nowrap"
            style={{
              boxShadow: `0 0 0 2px #3a2410, 0 0 0 4px ${borderColor}`,
            }}
          >
            <span className="text-sm leading-none">{geo.emoji}</span>
            <span className="font-pixel text-[0.42rem] tracking-tight">
              {building.location.toUpperCase()}
            </span>
          </div>

          {/* Downward triangle anchor */}
          <div
            className="w-0 h-0 border-x-[5px] border-x-transparent border-t-[6px] -mt-[1px]"
            style={{ borderTopColor: '#3a2410' }}
          />
        </div>,
        container,
      )}
    </>
  )
}

export function GpsWorldMap({
  buildings,
  totalSpend,
  currentLocation,
}: GpsWorldMapProps) {
  const avatarConfig = useStore((s) => s.avatar)
  const customReasons = useStore((s) => s.customReasons)
  const allReasons = useMemo(() => getAllReasons({ customReasons }), [customReasons])
  const addSpend = useStore((s) => s.addSpend)
  const addSaving = useStore((s) => s.addSaving)

  // Determine initial avatar coordinate (at current location landmark or Potheri center)
  const initialCoord = useMemo<[number, number]>(() => {
    if (currentLocation) {
      const geo = getLandmarkGeo(currentLocation)
      return [geo.lat, geo.lng]
    }
    return POTHERI_CENTER
  }, [currentLocation])

  const [avatarPos, setAvatarPos] = useState<[number, number]>(initialCoord)
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingState | null>(null)
  const [followCamera, setFollowCamera] = useState(true)

  // Quick transaction modal state
  const [modalMode, setModalMode] = useState<'spend' | 'save'>('spend')
  const [amountStr, setAmountStr] = useState('')
  const [reasonStr, setReasonStr] = useState(allReasons[0] ?? 'Food')
  const [noteStr, setNoteStr] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  // Calculate nearest landmark and proximity
  const { nearestBuilding, nearestDistance } = useMemo(() => {
    let bestDist = Infinity
    let bestBuilding: BuildingState | null = null

    for (const b of buildings) {
      const geo = getLandmarkGeo(b.location)
      const dist = calculateDistanceMeters(avatarPos[0], avatarPos[1], geo.lat, geo.lng)
      if (dist < bestDist) {
        bestDist = dist
        bestBuilding = b
      }
    }

    return { nearestBuilding: bestBuilding, nearestDistance: bestDist }
  }, [buildings, avatarPos])

  const isNear = nearestDistance <= PROXIMITY_THRESHOLD_METERS

  // Movement step in lat/lng (~15 meters)
  const STEP_LAT = 0.00014
  const STEP_LNG = 0.00016

  const moveAvatar = (deltaLat: number, deltaLng: number) => {
    setAvatarPos(([curLat, curLng]) => {
      const nextLat = Math.max(
        POTHERI_BOUNDS.minLat,
        Math.min(POTHERI_BOUNDS.maxLat, curLat + deltaLat),
      )
      const nextLng = Math.max(
        POTHERI_BOUNDS.minLng,
        Math.min(POTHERI_BOUNDS.maxLng, curLng + deltaLng),
      )
      return [nextLat, nextLng]
    })
    sfx.blip()
  }

  // Keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture keys if typing into modal input
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return
      }

      if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') {
        e.preventDefault()
        moveAvatar(STEP_LAT, 0)
      } else if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') {
        e.preventDefault()
        moveAvatar(-STEP_LAT, 0)
      } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        e.preventDefault()
        moveAvatar(0, -STEP_LNG)
      } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        e.preventDefault()
        moveAvatar(0, STEP_LNG)
      } else if ((e.key === ' ' || e.key.toLowerCase() === 'e') && isNear && nearestBuilding) {
        e.preventDefault()
        setSelectedBuilding(nearestBuilding)
        sfx.select()
      } else if (e.key === 'Escape' && selectedBuilding) {
        e.preventDefault()
        setSelectedBuilding(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isNear, nearestBuilding, selectedBuilding])

  // Open modal for building
  const handleSelectBuilding = (b: BuildingState) => {
    setSelectedBuilding(b)
    setAmountStr('')
    setNoteStr('')
    setFormError(null)
    sfx.select()
  }

  // Handle Quick Transaction Submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBuilding) return

    const val = parseFloat(amountStr)
    if (!amountStr.trim() || Number.isNaN(val) || val <= 0) {
      setFormError('Enter amount > ₹0')
      sfx.error()
      return
    }

    if (modalMode === 'spend') {
      addSpend(val, selectedBuilding.location, reasonStr)
    } else {
      addSaving(val, noteStr.trim() || `Saved at ${selectedBuilding.location}`)
    }

    // Play coin sfx and particle burst
    sfx.coin()
    fx.emit('coins', {
      kind: modalMode === 'save' ? 'save' : 'spend',
      amount: val,
    })

    // Companion reaction
    const currentSpends = useStore.getState().spends
    const currentSavings = useStore.getState().savings
    const soulState = computeSoulState(currentSpends, currentSavings)
    fx.emit('companionThought', {
      kind: modalMode === 'save' ? 'save' : 'spend',
      mood: soulState.mood,
      amount: val,
      reason: modalMode === 'spend' ? reasonStr : undefined,
    })

    setSelectedBuilding(null)
  }

  const spendPct = (b: BuildingState) =>
    totalSpend > 0 ? Math.round((b.totalSpend / totalSpend) * 100) : 0

  return (
    // Outer wrapper: relative, no overflow clip so the dialog can extend beyond the frame
    <div className="relative w-full">
      {/* Retro arcade border frame — overflow visible so dialog floats freely */}
      <div className="retro-gps-frame h-[380px] sm:h-[440px] w-full relative select-none overflow-hidden">
        {/* HUD location info — left side, capped so it never overlaps mode toggle */}
        <div
          className="absolute top-2 left-2 z-30 flex items-center gap-1.5 bg-[#f7e6bd]/95 px-2 py-1 shadow-[0_0_0_2px_#3a2410] pointer-events-none"
          style={{ maxWidth: 'calc(100% - 160px)' }}
        >
          <span className="text-xs leading-none">📍</span>
          <div className="flex flex-col min-w-0">
            <span className="font-pixel text-[0.4rem] text-wood-dark truncate">
              SRM &amp; POTHERI
            </span>
            <span className="font-body text-xs text-ink/70 truncate leading-tight">
              {isNear && nearestBuilding
                ? `Near ${nearestBuilding.location} (${Math.round(nearestDistance)}m)`
                : 'WASD / Arrows to walk'}
            </span>
          </div>
        </div>

        {/* Camera Follow Toggle — bottom-left inside map frame, away from mode toggle */}
        <div className="absolute bottom-2 left-2 z-30 pointer-events-auto">
          <button
            type="button"
            onClick={() => {
              setFollowCamera((prev) => !prev)
              sfx.blip()
            }}
            className={`font-pixel text-[0.42rem] px-2 py-1 shadow-[0_0_0_2px_#3a2410] active:translate-y-[1px] ${
              followCamera ? 'bg-[#f5c518] text-vault-indigo font-bold' : 'bg-[#fffaf0] text-ink'
            }`}
            title="Toggle camera follow avatar"
          >
            {followCamera ? 'CAM:LOCK' : 'CAM:FREE'}
          </button>
        </div>

        {/* Leaflet Map */}
        <MapContainer
          center={avatarPos}
          zoom={16}
          minZoom={14}
          maxZoom={18}
          className="h-full w-full"
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'
          />

          <MapCameraController position={avatarPos} shouldFollow={followCamera} />

          {/* Player Avatar Marker */}
          <AvatarMarker position={avatarPos} avatarConfig={avatarConfig} />

          {/* Landmark Markers */}
          {buildings.map((b) => (
            <LandmarkMarker
              key={b.location}
              building={b}
              isNear={b.location === nearestBuilding?.location && isNear}
              onClick={() => handleSelectBuilding(b)}
            />
          ))}
        </MapContainer>

        {/* Proximity Interaction Prompt Banner */}
        {isNear && nearestBuilding && !selectedBuilding && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
            <button
              type="button"
              onClick={() => handleSelectBuilding(nearestBuilding)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f5c518] text-vault-indigo shadow-[0_0_0_2px_#3a2410] active:translate-y-[1px] cursor-pointer animate-bounce"
            >
              <span className="font-pixel text-[0.5rem] font-bold">
                [SPACE] LOG AT {nearestBuilding.location.toUpperCase()}
              </span>
            </button>
          </div>
        )}

        {/* On-screen Retro D-Pad */}
        <div className="absolute bottom-6 right-2 z-30 pointer-events-auto flex flex-col items-center gap-1 opacity-90 hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => moveAvatar(STEP_LAT, 0)}
            className="w-8 h-8 flex items-center justify-center bg-[#f7e6bd] text-[#3a2410] font-pixel text-xs shadow-[0_0_0_2px_#3a2410] active:translate-y-[1px]"
            aria-label="Move Up"
          >
            ▲
          </button>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => moveAvatar(0, -STEP_LNG)}
              className="w-8 h-8 flex items-center justify-center bg-[#f7e6bd] text-[#3a2410] font-pixel text-xs shadow-[0_0_0_2px_#3a2410] active:translate-y-[1px]"
              aria-label="Move Left"
            >
              ◀
            </button>
            <button
              type="button"
              onClick={() => {
                if (isNear && nearestBuilding) {
                  handleSelectBuilding(nearestBuilding)
                }
              }}
              disabled={!isNear || !nearestBuilding}
              className={`w-8 h-8 flex items-center justify-center font-pixel text-[0.5rem] shadow-[0_0_0_2px_#3a2410] active:translate-y-[1px] ${
                isNear && nearestBuilding
                  ? 'bg-[#f5c518] text-vault-indigo font-bold'
                  : 'bg-[#ecd39b] text-ink/40 cursor-not-allowed'
              }`}
              aria-label="Interact"
              title="Interact with landmark"
            >
              ●
            </button>
            <button
              type="button"
              onClick={() => moveAvatar(0, STEP_LNG)}
              className="w-8 h-8 flex items-center justify-center bg-[#f7e6bd] text-[#3a2410] font-pixel text-xs shadow-[0_0_0_2px_#3a2410] active:translate-y-[1px]"
              aria-label="Move Right"
            >
              ▶
            </button>
          </div>
          <button
            type="button"
            onClick={() => moveAvatar(-STEP_LAT, 0)}
            className="w-8 h-8 flex items-center justify-center bg-[#f7e6bd] text-[#3a2410] font-pixel text-xs shadow-[0_0_0_2px_#3a2410] active:translate-y-[1px]"
            aria-label="Move Down"
          >
            ▼
          </button>
        </div>
      </div>{/* end retro-gps-frame */}

      {/* SNES Quick Spend Dialog — outside the overflow-hidden map frame, anchored below */}
      <AnimatePresence>
        {selectedBuilding && (
          <motion.div
            key={selectedBuilding.location}
            initial={{ opacity: 0, scale: 0.9, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 24 }}
            className="retro-panel retro-panel--gold z-40 mt-2"
          >
            {/* Header row */}
            <div className="flex justify-between items-start gap-2 mb-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-base leading-none">
                    {getLandmarkGeo(selectedBuilding.location).emoji}
                  </span>
                  <p className="font-pixel text-[0.6rem] text-wood-dark pixel-shadow-sm">
                    {selectedBuilding.location.toUpperCase()}
                  </p>
                </div>
                <p className="font-body text-lg text-ink font-bold leading-tight mt-0.5">
                  {formatINR(selectedBuilding.totalSpend)}
                  <span className="text-ink/60 font-normal text-sm ml-1.5">
                    ({spendPct(selectedBuilding)}% of spend)
                  </span>
                </p>
                <p className="font-body text-xs text-ink/75 leading-tight">
                  {selectedBuilding.tip}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBuilding(null)}
                className="font-pixel text-[0.6rem] text-wood-dark hover:text-ink shrink-0 p-1 leading-none"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Quick Spend / Save toggle + form */}
            <div className="pt-2 border-t border-[#3a2410]/20">
              <div className="flex bg-vault-indigo-light p-0.5 shadow-[0_0_0_1px_#3a2410] mb-2">
                <button
                  type="button"
                  onClick={() => setModalMode('spend')}
                  className={`flex-1 py-1 text-sm font-semibold ${
                    modalMode === 'spend'
                      ? 'bg-danger-red text-[#fff7e0]'
                      : 'text-ink/70 hover:text-ink'
                  }`}
                >
                  Quick Spend
                </button>
                <button
                  type="button"
                  onClick={() => setModalMode('save')}
                  className={`flex-1 py-1 text-sm font-semibold ${
                    modalMode === 'save'
                      ? 'bg-heal-green text-[#fff7e0]'
                      : 'text-ink/70 hover:text-ink'
                  }`}
                >
                  Quick Save
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-2" noValidate>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="number"
                      inputMode="decimal"
                      value={amountStr}
                      onChange={(e) => {
                        setAmountStr(e.target.value)
                        setFormError(null)
                      }}
                      placeholder="₹ Amount"
                      className="w-full px-2 py-1.5 text-base font-bold bg-[#fffaf0]"
                      min="1"
                      step="any"
                      autoFocus
                    />
                  </div>
                  {modalMode === 'spend' ? (
                    <div className="flex-1">
                      <select
                        value={reasonStr}
                        onChange={(e) => setReasonStr(e.target.value)}
                        className="w-full px-2 py-1.5 text-sm bg-[#fffaf0]"
                      >
                        {allReasons.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="flex-1">
                      <input
                        type="text"
                        value={noteStr}
                        onChange={(e) => setNoteStr(e.target.value)}
                        placeholder="Note (optional)"
                        className="w-full px-2 py-1.5 text-sm bg-[#fffaf0]"
                      />
                    </div>
                  )}
                </div>

                {formError && (
                  <p className="font-body text-sm text-danger-red leading-tight">{formError}</p>
                )}

                <button
                  type="submit"
                  className={`w-full py-2 font-pixel text-[0.45rem] tracking-wider uppercase shadow-[0_0_0_2px_#3a2410] active:translate-y-[1px] ${
                    modalMode === 'save' ? 'bg-heal-green text-[#fff7e0]' : 'bg-coin-gold text-vault-indigo'
                  }`}
                >
                  {modalMode === 'save' ? 'Deposit to Vault' : 'Log Expense'}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default GpsWorldMap
