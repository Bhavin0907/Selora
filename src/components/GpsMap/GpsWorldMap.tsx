import { useCallback, useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { BuildingState } from '../../types'
import { Avatar } from '../Avatar'
import { useStore } from '../../store/useStore'
import { POTHERI_CENTER, moodEmoji, resolveCoords } from '../../lib/gpsLocations'
import { sfx } from '../../lib/sfx'
import type { MapModeProps } from '../map/MapSharedTypes'

function MapPinListener({
  active,
  onPin,
}: {
  active: boolean
  onPin: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click(e) {
      if (active) {
        onPin(e.latlng.lat, e.latlng.lng)
        sfx.select()
      }
    },
  })
  return null
}

function RetroRecenter() {
  const map = useMap()
  useEffect(() => {
    map.setView([POTHERI_CENTER.lat, POTHERI_CENTER.lng], 15)
  }, [map])
  return null
}

function buildDivIcon(emoji: string, mood: BuildingState['mood'], active: boolean) {
  const ring =
    mood === 'ominous'
      ? '#ff5a5a'
      : mood === 'moderate'
        ? '#f5c518'
        : '#5fbf3f'
  return L.divIcon({
    className: '',
    html: `<div style="
      font-size:20px;line-height:1;text-align:center;
      filter:drop-shadow(0 2px 0 rgba(0,0,0,0.35));
      transform:scale(${active ? 1.15 : 1});
      box-shadow:0 0 0 2px #3a2410,0 0 0 4px ${ring};
      border-radius:4px;background:#fffaf0;padding:2px 4px;
    ">${emoji}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
}

export default function GpsWorldMap({
  activeBuildings,
  currentLocation,
  selected,
  onSelect,
}: MapModeProps) {
  const avatar = useStore((s) => s.avatar)
  const locationPins = useStore((s) => s.locationPins)
  const setLocationPin = useStore((s) => s.setLocationPin)
  const [pinTarget, setPinTarget] = useState<string | null>(null)

  const pinned = useMemo(() => {
    return activeBuildings
      .map((b) => ({ building: b, coord: resolveCoords(b.location, locationPins) }))
      .filter((x): x is { building: BuildingState; coord: { lat: number; lng: number } } =>
        x.coord !== null,
      )
  }, [activeBuildings, locationPins])

  const unpinned = useMemo(
    () => activeBuildings.filter((b) => resolveCoords(b.location, locationPins) === null),
    [activeBuildings, locationPins],
  )

  const avatarCoord = useMemo(() => {
    if (currentLocation) {
      const c = resolveCoords(currentLocation, locationPins)
      if (c) return c
    }
    return pinned[0]?.coord ?? POTHERI_CENTER
  }, [currentLocation, locationPins, pinned])

  const handlePin = useCallback(
    (lat: number, lng: number) => {
      if (!pinTarget) return
      setLocationPin(pinTarget, lat, lng)
      setPinTarget(null)
    },
    [pinTarget, setLocationPin],
  )

  if (activeBuildings.length === 0) {
    return (
      <div className="h-[340px] flex items-center justify-center retro-gps-frame bg-[#a4c4db]">
        <div className="retro-panel retro-panel--blue text-center mx-4">
          <p className="font-body text-lg text-ink leading-tight">
            No spending yet — log a spend to see pins on the map
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-[340px] retro-gps-frame">
      <MapContainer
        center={[POTHERI_CENTER.lat, POTHERI_CENTER.lng]}
        zoom={15}
        className="h-full w-full z-0"
        scrollWheelZoom
        touchZoom
      >
        <RetroRecenter />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {pinned.map(({ building, coord }) => (
          <Marker
            key={building.location}
            position={[coord.lat, coord.lng]}
            icon={buildDivIcon(
              moodEmoji(building.mood),
              building.mood,
              selected?.location === building.location,
            )}
            eventHandlers={{
              click: () => {
                onSelect(building)
                sfx.select()
              },
            }}
          />
        ))}

        {/* Hero position pin */}
        <Marker
          position={[avatarCoord.lat, avatarCoord.lng]}
          icon={L.divIcon({
            className: '',
            html: '<div style="font-size:18px;filter:drop-shadow(0 2px 0 rgba(0,0,0,0.4))">🧍</div>',
            iconSize: [24, 24],
            iconAnchor: [12, 24],
          })}
        />

        <MapPinListener active={!!pinTarget} onPin={handlePin} />
      </MapContainer>

      {pinTarget && (
        <div className="absolute top-12 left-2 right-2 z-[500] retro-panel retro-panel--blue pointer-events-auto">
          <p className="font-pixel text-[0.5rem] text-ink mb-1">PIN {pinTarget.toUpperCase()}</p>
          <p className="font-body text-sm text-ink/80">Tap the map to drop a pin</p>
          <button
            type="button"
            onClick={() => setPinTarget(null)}
            className="mt-2 font-pixel text-[0.45rem] px-2 py-1 bg-[#8a5a2b] text-[#fff7e0]"
          >
            CANCEL
          </button>
        </div>
      )}

      {/* CRT scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-[400] opacity-[0.07]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 3px)',
        }}
      />

      {/* Corner avatar portrait (always visible; map pin shows position) */}
      <div className="absolute bottom-2 left-2 z-[450] pointer-events-none bg-[#d8f0ff] shadow-[0_0_0_2px_#3a2410] p-0.5">
        <Avatar config={avatar} size={36} bob />
      </div>

      {unpinned.length > 0 && !pinTarget && (
        <div className="absolute top-2 left-2 z-[450] max-w-[160px] pointer-events-auto">
          <div className="retro-panel retro-panel--blue !p-2">
            <p className="font-pixel text-[0.42rem] text-ink mb-1">UNPINNED</p>
            {unpinned.slice(0, 3).map((b) => (
              <button
                key={b.location}
                type="button"
                onClick={() => setPinTarget(b.location)}
                className="block w-full text-left font-body text-sm text-ink/80 hover:text-ink py-0.5"
              >
                📍 {b.location}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
