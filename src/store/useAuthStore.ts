import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'
import { useStore } from './useStore'

/**
 * Auth / player-session store.
 *
 * - CLOUD mode: backed by Supabase Auth (anonymous guest or email). Profiles
 *   live in the `profiles` table. Session is persisted by supabase-js.
 * - LOCAL mode: no backend configured, or a cloud call failed — we mint a
 *   local player id and keep everything in localStorage. The game is fully
 *   playable either way; auth just adds accounts + cloud sync.
 *
 * Only `player` + `mode` are persisted here so returning users skip the entry
 * screen; `status` always re-derives on boot via init().
 */

export interface Player {
  /** Supabase auth user id (cloud) or a locally-minted uuid (local). */
  id: string
  displayName: string
  /** Public-ish unique tag shown in UI, e.g. "BHAVIN#4821". */
  playerId: string
}

type AuthStatus = 'loading' | 'ready'
type AuthMode = 'cloud' | 'local'

interface AuthState {
  status: AuthStatus
  mode: AuthMode
  player: Player | null
  error: string | null
  busy: boolean

  init: () => Promise<void>
  signInGuest: (displayName: string) => Promise<void>
  signInEmail: (email: string, password: string) => Promise<void>
  signUpEmail: (displayName: string, email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
}

function localId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  } catch {
    /* ignore */
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function makePlayerId(name: string): string {
  const base =
    name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 10) || 'PLAYER'
  const tag = Math.floor(1000 + Math.random() * 9000)
  return `${base}#${tag}`
}

/** Read or create this auth user's profile row. Best-effort; never throws. */
async function ensureProfile(userId: string, fallbackName?: string): Promise<Player> {
  const name = (fallbackName || '').trim() || 'Player'
  if (!supabase) {
    return { id: userId, displayName: name, playerId: makePlayerId(name) }
  }
  try {
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, player_id')
      .eq('id', userId)
      .maybeSingle()
    if (data) {
      return { id: data.id, displayName: data.display_name, playerId: data.player_id }
    }
  } catch (err) {
    console.error('[Selora] profile load failed:', err)
  }
  // Create a new profile row.
  const playerId = makePlayerId(name)
  try {
    const { data: created, error } = await supabase
      .from('profiles')
      .insert({ id: userId, display_name: name, player_id: playerId })
      .select('id, display_name, player_id')
      .single()
    if (!error && created) {
      return { id: created.id, displayName: created.display_name, playerId: created.player_id }
    }
  } catch (err) {
    console.error('[Selora] profile create failed:', err)
  }
  // Fall back to an in-memory player so the game still starts.
  return { id: userId, displayName: name, playerId }
}

function applyName(player: Player) {
  try {
    useStore.setState({ userName: player.displayName })
  } catch {
    /* store not ready — ignore */
  }
}

let authListenerBound = false

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      status: 'loading',
      mode: supabase ? 'cloud' : 'local',
      player: null,
      error: null,
      busy: false,

      clearError: () => set({ error: null }),

      init: async () => {
        set({ status: 'loading' })

        // Local-only: keep any persisted player, mark ready.
        if (!supabase) {
          const p = get().player
          if (p) applyName(p)
          set({ status: 'ready', mode: 'local' })
          return
        }

        // Cloud: verify session, then load/create profile.
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession()
          if (session?.user) {
            const player = await ensureProfile(
              session.user.id,
              get().player?.displayName ||
                (session.user.user_metadata?.display_name as string | undefined),
            )
            applyName(player)
            set({ player, mode: 'cloud' })
          } else {
            // No live session — clear any stale persisted cloud player.
            set({ player: null, mode: 'cloud' })
          }
        } catch (err) {
          console.error('[Selora] auth init failed:', err)
        } finally {
          set({ status: 'ready' })
        }

        // React to external sign-outs / token loss (bind once).
        if (!authListenerBound) {
          authListenerBound = true
          supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) set({ player: null })
          })
        }
      },

      signInGuest: async (displayName) => {
        set({ busy: true, error: null })
        const name = displayName.trim() || 'Player'
        if (supabase) {
          try {
            const { data, error } = await supabase.auth.signInAnonymously({
              options: { data: { display_name: name } },
            })
            if (error || !data.user) throw error || new Error('No user returned')
            const player = await ensureProfile(data.user.id, name)
            applyName(player)
            set({ player, mode: 'cloud', busy: false, error: null })
            return
          } catch (err) {
            const raw = err instanceof Error ? err.message : 'Guest sign-in failed'
            const msg = raw.toLowerCase().includes('anonymous')
              ? 'Enable Anonymous sign-ins: Authentication → Providers → Anonymous.'
              : raw
            console.error('[Selora] guest sign-in failed:', err)
            set({ busy: false, error: msg, mode: 'cloud' })
            return
          }
        }
        const player: Player = { id: localId(), displayName: name, playerId: makePlayerId(name) }
        applyName(player)
        set({ player, mode: 'local', busy: false })
      },

      signInEmail: async (email, password) => {
        set({ busy: true, error: null })
        if (!supabase) {
          set({ busy: false, error: 'Online accounts need a backend. Playing offline.' })
          return
        }
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          })
          if (error || !data.user) throw error || new Error('Sign-in failed')
          const player = await ensureProfile(data.user.id)
          applyName(player)
          set({ player, mode: 'cloud', busy: false })
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Sign-in failed'
          set({ busy: false, error: msg })
        }
      },

      signUpEmail: async (displayName, email, password) => {
        set({ busy: true, error: null })
        const name = displayName.trim() || 'Player'
        if (!supabase) {
          set({ busy: false, error: 'Online accounts need a backend. Playing offline.' })
          return
        }
        try {
          const { data, error } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: { data: { display_name: name } },
          })
          if (error) throw error
          if (data.session && data.user) {
            const player = await ensureProfile(data.user.id, name)
            applyName(player)
            set({ player, mode: 'cloud', busy: false })
          } else {
            // Email confirmation required before a session exists.
            set({
              busy: false,
              error: 'Check your email to confirm, then log in.',
            })
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Sign-up failed'
          set({ busy: false, error: msg })
        }
      },

      signOut: async () => {
        set({ busy: true, error: null })
        try {
          if (supabase && get().mode === 'cloud') {
            await supabase.auth.signOut()
          }
        } catch (err) {
          console.error('[Selora] sign-out error:', err)
        }
        set({ player: null, busy: false })
      },
    }),
    {
      name: 'selora-auth',
      partialize: (s) => ({ player: s.player, mode: s.mode }),
    },
  ),
)
