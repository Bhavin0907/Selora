import { formatINR } from '../lib/stats'

export interface TooltipPayloadEntry {
  name?: string
  value?: number | string
  color?: string
  payload?: Record<string, unknown>
}

export interface RetroTooltipProps {
  active?: boolean
  payload?: readonly TooltipPayloadEntry[]
  label?: string
  formatter?: (value: number | string | undefined, name?: string) => [string, string]
  valuePrefix?: string
  valueSuffix?: string
}

/**
 * Pixel-themed Recharts tooltip matching Selora's parchment retro HUD aesthetic.
 */
export function RetroTooltip({
  active,
  payload,
  label,
  formatter,
  valuePrefix = '',
  valueSuffix = '',
}: RetroTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="bg-[#f7e6bd] border-2 border-[#8a5a2b] shadow-[0_0_0_2px_#3a2410] p-2 min-w-[120px] select-none pointer-events-none">
      {label && (
        <p className="font-pixel text-[0.52rem] text-wood-dark border-b border-[#8a5a2b]/30 pb-1 mb-1.5 uppercase">
          {label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry, i) => {
          const rawVal = entry.value
          const name = entry.name ?? ''
          const color = entry.color ?? '#43301a'
          let displayVal =
            typeof rawVal === 'number'
              ? formatINR(rawVal)
              : typeof rawVal === 'string'
                ? rawVal
                : '—'
          let displayName = name

          if (formatter) {
            const formatted = formatter(rawVal, name)
            displayVal = formatted[0]
            displayName = formatted[1]
          } else if (valuePrefix || valueSuffix) {
            displayVal = `${valuePrefix}${displayVal}${valueSuffix}`
          }

          return (
            <div key={i} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 font-body text-ink/85 text-sm leading-none">
                <span
                  className="inline-block w-2 h-2 shrink-0 shadow-[0_0_0_1px_#3a2410]"
                  style={{ background: color }}
                />
                {displayName}
              </span>
              <span className="font-pixel text-[0.52rem] font-bold" style={{ color }}>
                {displayVal}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
