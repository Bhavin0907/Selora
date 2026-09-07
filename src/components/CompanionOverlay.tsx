import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, animate, motion, useMotionValue } from 'framer-motion'
import { Avatar } from './Avatar'
import { useStore } from '../store/useStore'
import { computeSoulState } from '../lib/soul'
import { fx } from '../lib/fx'
import { sfx } from '../lib/sfx'
import { usePrefersReducedMotion } from '../lib/useReducedMotion'
import { getCompanionLine, type CompanionLine } from '../lib/companionLines'
import type { SoulMood } from '../types'

const MOOD_BORDER_COLORS: Record<SoulMood, string> = {
  thriving: '#2e9e4f',
  content: '#7a5bd0',
  worried: '#b5860b',
  distressed: '#d64545',
}

const BUBBLE_WIDTH = 220
// 50% bigger than the original 32px
const SPRITE_SIZE = 48

/**
 * Persistent roaming Soul companion that wanders along the navigation ledge across all routes,
 * with organic semi-random waypoints, pauses, and mood-tailored thought bubbles.
 */
export function CompanionOverlay() {
  const reduced = usePrefersReducedMotion()
  const spends = useStore((s) => s.spends)
  const savings = useStore((s) => s.savings)
  const avatar = useStore((s) => s.avatar)

  // Current mood from live store
  const soul = useMemo(() => computeSoulState(spends, savings), [spends, savings])
  const currentMood = soul.mood

  const containerRef = useRef<HTMLDivElement>(null)
  const [trackWidth, setTrackWidth] = useState(380)

  // Motion value for horizontal position
  const x = useMotionValue(24)
  const [facing, setFacing] = useState<'right' | 'left'>('right')
  const [isWalking, setIsWalking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [activeThought, setActiveThought] = useState<CompanionLine | null>(null)

  // Refs for tracking mutable animation loop state
  const facingRef = useRef<'right' | 'left'>('right')
  const isPausedRef = useRef(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const animRef = useRef<any>(null)
  const pauseTimerRef = useRef<number | null>(null)
  const lookTimerRef = useRef<number | null>(null)
  const dismissTimerRef = useRef<number | null>(null)

  useEffect(() => {
    facingRef.current = facing
  }, [facing])

  useEffect(() => {
    isPausedRef.current = isPaused
  }, [isPaused])

  // Measure container width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth
        setTrackWidth(Math.max(140, w))
      }
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  // Clear all pending timers
  const clearTimers = () => {
    if (pauseTimerRef.current) {
      window.clearTimeout(pauseTimerRef.current)
      pauseTimerRef.current = null
    }
    if (lookTimerRef.current) {
      window.clearTimeout(lookTimerRef.current)
      lookTimerRef.current = null
    }
    if (dismissTimerRef.current) {
      window.clearTimeout(dismissTimerRef.current)
      dismissTimerRef.current = null
    }
  }

  // Organic random wandering logic
  const wander = useCallback(
    function planNextMove() {
      if (reduced || isPausedRef.current) return

      clearTimers()
      const minX = 8
      const maxX = Math.max(minX + 40, trackWidth - SPRITE_SIZE - 8)
      const currentX = x.get()

      // Determine next waypoint with varied movement patterns
      let targetX: number
      const roll = Math.random()

      if (roll < 0.25) {
        // 25% chance: Long stroll towards an outer edge
        targetX = currentX < (minX + maxX) / 2 ? maxX : minX
      } else if (roll < 0.65) {
        // 40% chance: Medium exploration step (60px - 140px)
        const step = 60 + Math.random() * 80
        const dir = currentX <= minX + 35 ? 1 : currentX >= maxX - 35 ? -1 : Math.random() > 0.45 ? 1 : -1
        targetX = Math.max(minX, Math.min(maxX, currentX + dir * step))
      } else {
        // 35% chance: Short curious wander (30px - 60px)
        const step = 30 + Math.random() * 30
        const dir = currentX <= minX + 25 ? 1 : currentX >= maxX - 25 ? -1 : Math.random() > 0.5 ? 1 : -1
        targetX = Math.max(minX, Math.min(maxX, currentX + dir * step))
      }

      const dist = Math.abs(targetX - currentX)
      if (dist < 8) {
        // Too close to target, pick opposite direction
        targetX = currentX > (minX + maxX) / 2 ? minX + 15 : maxX - 15
      }

      const newFacing: 'right' | 'left' = targetX >= currentX ? 'right' : 'left'
      setFacing(newFacing)
      facingRef.current = newFacing
      setIsWalking(true)

      // Random speed between 26 and 42 px/second (slow curious stroll vs brisk trot)
      const speed = 26 + Math.random() * 16
      const actualDist = Math.abs(targetX - currentX)
      const duration = actualDist / speed

      animRef.current?.stop()
      animRef.current = animate(x, targetX, {
        duration,
        ease: 'linear',
        onComplete: () => {
          setIsWalking(false)
          if (isPausedRef.current) return

          // After arriving, randomly pause and look around
          const shouldPause = Math.random() < 0.75
          if (shouldPause) {
            // Idle pause between 1.0s and 2.6s
            const pauseDuration = 1000 + Math.random() * 1600

            // 45% chance to turn around and look behind during the pause
            if (Math.random() < 0.45) {
              lookTimerRef.current = window.setTimeout(() => {
                if (!isPausedRef.current) {
                  setFacing((f) => (f === 'right' ? 'left' : 'right'))
                }
              }, pauseDuration * 0.45)
            }

            pauseTimerRef.current = window.setTimeout(() => {
              planNextMove()
            }, pauseDuration)
          } else {
            // Quick turnaround
            planNextMove()
          }
        },
      })
    },
    [reduced, trackWidth, x],
  )

  // Handle start/resume of walk when trackWidth or reduced motion changes
  useEffect(() => {
    if (reduced) {
      animRef.current?.stop()
      animRef.current = null
      clearTimers()
      x.set(Math.min(24, trackWidth - SPRITE_SIZE - 8))
      return
    }

    if (!isPausedRef.current) {
      wander()
    }

    return () => {
      animRef.current?.stop()
      clearTimers()
    }
  }, [trackWidth, reduced, wander, x])

  // Dismiss thought bubble
  const dismissThought = useCallback(() => {
    if (dismissTimerRef.current) {
      window.clearTimeout(dismissTimerRef.current)
      dismissTimerRef.current = null
    }
    setActiveThought(null)
    setIsPaused(false)
    isPausedRef.current = false

    // Resume random wandering after a moment
    if (!reduced) {
      wander()
    }
  }, [reduced, wander])

  // Trigger a thought bubble
  const showThought = useCallback(
    (thought: CompanionLine) => {
      // Stop active walk and any pending idle timers
      animRef.current?.stop()
      animRef.current = null
      clearTimers()
      setIsWalking(false)
      setIsPaused(true)
      isPausedRef.current = true
      setActiveThought(thought)
      sfx.blip()

      // Auto dismiss after 3.8s
      dismissTimerRef.current = window.setTimeout(() => {
        dismissThought()
      }, 3800)
    },
    [dismissThought],
  )

  // Subscribe to fx event bus
  useEffect(() => {
    const unsub = fx.on('companionThought', ({ kind, mood, amount, reason }) => {
      const line = getCompanionLine(mood, kind, amount, reason)
      showThought(line)
    })

    return () => {
      unsub()
      clearTimers()
    }
  }, [showThought])

  // Tap on companion directly
  const handleCompanionTap = () => {
    if (activeThought) {
      dismissThought()
      return
    }
    sfx.select()
    const line = getCompanionLine(currentMood, 'save', 0)
    showThought({
      ...line,
      headline: `${soul.mood.toUpperCase()} SOUL`,
      text: soul.factors[0] ?? line.text,
    })
  }

  // Calculate bubble and tail horizontal offsets relative to container
  const compX = x.get()
  const clampedBubbleLeft = Math.max(
    6,
    Math.min(trackWidth - BUBBLE_WIDTH - 6, compX - BUBBLE_WIDTH / 2 + SPRITE_SIZE / 2),
  )
  const tailLeft = Math.max(
    14,
    Math.min(BUBBLE_WIDTH - 24, compX + SPRITE_SIZE / 2 - clampedBubbleLeft - 6),
  )

  const moodBorderColor = activeThought ? MOOD_BORDER_COLORS[activeThought.mood] : MOOD_BORDER_COLORS.content

  return (
    <aside
      aria-label="Roaming Soul Companion"
      className="fixed bottom-[56px] left-0 right-0 z-40 pointer-events-none"
    >
      <div ref={containerRef} className="max-w-lg mx-auto relative px-3 h-[48px]">
        {/* Roaming Soul character (50% bigger: 48px) */}
        <motion.div
          style={{ x }}
          className="absolute bottom-0 pointer-events-auto cursor-pointer"
          onClick={handleCompanionTap}
          title="Your Soul companion — tap to chat"
        >
          <motion.div
            animate={{
              scaleX: facing === 'left' ? -1 : 1,
              y: isWalking && !reduced ? [0, -3, 0] : 0,
            }}
            transition={{
              scaleX: { duration: 0.15 },
              y: { duration: 0.38, repeat: Infinity, ease: 'easeInOut' },
            }}
            className="flex flex-col items-center relative"
          >
            <Avatar
              config={avatar}
              size={SPRITE_SIZE}
              auraColor={soul.auraColor}
              bob={!isWalking || reduced}
            />
            {/* Hard pixel ground shadow */}
            <div
              className="absolute left-1/2 -translate-x-1/2"
              style={{
                bottom: '1px',
                width: '64%',
                height: '5px',
                background: '#000000',
                opacity: 0.35,
              }}
            />
          </motion.div>
        </motion.div>

        {/* Thought Bubble positioned right above the 48px character */}
        <AnimatePresence>
          {activeThought && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={dismissThought}
              className="absolute bottom-[54px] pointer-events-auto cursor-pointer z-50 select-none"
              style={{
                left: clampedBubbleLeft,
                width: BUBBLE_WIDTH,
              }}
            >
              <div
                className="relative p-2.5 bg-[#f7e6bd] text-ink shadow-[0_0_0_2px_#3a2410] border-t-2"
                style={{ borderTopColor: moodBorderColor }}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span
                    className="font-pixel text-[0.52rem] pixel-shadow-sm tracking-wider uppercase"
                    style={{ color: moodBorderColor }}
                  >
                    {activeThought.headline}
                  </span>
                  <span className="text-[0.6rem] opacity-40 font-pixel hover:opacity-100">✕</span>
                </div>
                <p className="font-body text-sm leading-tight text-ink/90">
                  {activeThought.text}
                </p>

                {/* Outer shadow triangle */}
                <div
                  className="absolute -bottom-[6px] w-0 h-0"
                  style={{
                    left: tailLeft,
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderTop: '6px solid #3a2410',
                  }}
                />
                {/* Inner fill triangle */}
                <div
                  className="absolute -bottom-[4px] w-0 h-0"
                  style={{
                    left: tailLeft + 1,
                    borderLeft: '5px solid transparent',
                    borderRight: '5px solid transparent',
                    borderTop: '5px solid #f7e6bd',
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  )
}
