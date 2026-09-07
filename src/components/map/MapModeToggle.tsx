import { sfx } from '../../lib/sfx'
import { useUiStore, type MapMode } from '../../store/useUiStore'

const MODES: { id: MapMode; icon: string; label: string; title: string }[] = [
  { id: 'gps', icon: '🗺️', label: 'GPS', title: 'Real GPS Map' },
  { id: '2d', icon: '🏝️', label: '2D', title: '2D Island Map' },
  { id: '3d', icon: '🌍', label: '3D', title: '3D Island World' },
]

interface MapModeToggleProps {
  effectiveMode: MapMode
  webgl: boolean
  onModeChange: (mode: MapMode) => void
  onRecenter?: () => void
}

export function MapModeToggle({
  effectiveMode,
  webgl,
  onModeChange,
  onRecenter,
}: MapModeToggleProps) {
  const setMapMode = useUiStore((s) => s.setMapMode)

  const pick = (mode: MapMode) => {
    setMapMode(mode)
    onModeChange(mode)
    sfx.blip()
  }

  return (
    <div className="flex items-center justify-between gap-2 mb-2">
      {/* Arcade-style 3-way toggle */}
      <div className="flex shadow-[0_0_0_2px_#3a2410,0_4px_0_#3a2410]">
        {MODES.map(({ id, icon, label, title }) => {
          const disabled = id === '3d' && !webgl
          const active = effectiveMode === id
          return (
            <button
              key={id}
              type="button"
              disabled={disabled}
              onClick={() => pick(id)}
              title={disabled ? 'WebGL unavailable' : title}
              className={`font-pixel text-[0.45rem] px-2.5 py-2 flex items-center gap-1 active:translate-y-[1px] transition-colors ${
                active
                  ? 'bg-[#8a5a2b] text-[#fff7e0] font-bold'
                  : 'bg-[#fffaf0] text-wood-dark hover:bg-[#ecd39b]'
              } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <span className="text-sm leading-none">{icon}</span>
              {label}
            </button>
          )
        })}
      </div>

      {webgl && effectiveMode === '3d' && onRecenter && (
        <button
          type="button"
          onClick={() => {
            onRecenter()
            sfx.blip()
          }}
          className="font-pixel text-[0.45rem] px-2 py-1.5 bg-[#fffaf0] text-wood-dark shadow-[0_0_0_2px_#3a2410] active:translate-y-[1px] shrink-0"
          title="Recenter camera"
        >
          ⟳
        </button>
      )}
    </div>
  )
}
