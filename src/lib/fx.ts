/**
 * Tiny typed pub/sub for "juice" effects (coin arcs, soul bursts, level-ups).
 * Decouples the components that TRIGGER feedback (log form, HUD, soul) from
 * the global <FxLayer/> that RENDERS it. No deps; presentation-only.
 */

import type { SoulMood } from '../types'

export interface Anchor {
  x: number
  y: number
}

export interface FxEvents {
  coins: { kind: 'save' | 'spend'; amount: number; anchor?: Anchor }
  soulBurst: { anchor?: Anchor }
  levelUp: { level: number }
  companionThought: {
    kind: 'save' | 'spend'
    mood: SoulMood
    amount: number
    reason?: string
  }
}

type Handler<T> = (payload: T) => void

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const registry = new Map<keyof FxEvents, Set<Handler<any>>>()

export const fx = {
  on<K extends keyof FxEvents>(key: K, handler: Handler<FxEvents[K]>): () => void {
    let set = registry.get(key)
    if (!set) {
      set = new Set()
      registry.set(key, set)
    }
    set.add(handler)
    return () => {
      set!.delete(handler)
    }
  },
  emit<K extends keyof FxEvents>(key: K, payload: FxEvents[K]): void {
    registry.get(key)?.forEach((h) => h(payload))
  },
}

/** Center of an element in viewport pixels (for anchoring bursts). */
export function anchorOf(el: Element | null): Anchor | undefined {
  if (!el) return undefined
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}
