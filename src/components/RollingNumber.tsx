import { useEffect, useRef, useState } from 'react'

interface RollingNumberProps {
  value: number
  prefix?: string
  className?: string
  duration?: number
  format?: (n: number) => string
}

/** Ticks/rolls from the previous value to the new one when it changes. */
export function RollingNumber({
  value,
  prefix = '',
  className = '',
  duration = 450,
  format,
}: RollingNumberProps) {
  const [display, setDisplay] = useState(value)
  const fromRef = useRef(value)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const from = fromRef.current
    const to = value
    if (from === to) return
    const start = performance.now()

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      const current = Math.round(from + (to - from) * eased)
      setDisplay(current)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = to
      }
    }

    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value, duration])

  const text = format ? format(display) : display.toLocaleString('en-IN')

  return (
    <span className={className}>
      {prefix}
      {text}
    </span>
  )
}
