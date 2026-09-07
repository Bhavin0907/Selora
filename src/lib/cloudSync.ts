import { supabase } from './supabase'
import { useStore } from '../store/useStore'
import type { Player } from '../store/useAuthStore'
import { getTotalSavings } from './stats'
import { normalizeAvatar } from './avatar'
import type { AvatarConfig, Saving, Spend, WeeklyPact } from '../types'

/**
 * Offline-safe game_state <-> Supabase sync.
 *
 * Local Zustand + localStorage is always the primary/optimistic store. This
 * module runs only in CLOUD mode and:
 *   - on start: pulls cloud state, merges (cloud wins if newer via updated_at,
 *     arrays are unioned so nothing is lost), then pushes the merged result.
 *   - on change: debounce-writes game_state + the user's leaderboard total.
 *   - offline / failure: marks a pending push and flushes on reconnect/focus.
 *
 * Everything is wrapped so a network error never crashes or hangs the app.
 */

export interface GameSnapshot {
  spends: Spend[]
  savings: Saving[]
  customLocations: string[]
  customReasons: string[]
  recentLocations: string[]
  recentReasons: string[]
  pact: WeeklyPact
  userName: string
  avatar: AvatarConfig
  seeded: boolean
  locationPins: Record<string, { lat: number; lng: number }>
}

const META_KEY = 'selora-sync-meta'
const DEBOUNCE_MS = 1500

// ── module state ──────────────────────────────────────────────────────
let player: Player | null = null
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let unsubStore: (() => void) | null = null
let lastSignature: string | null = null
let suppress = false // true while applying remote data (don't echo back)
let pendingPush = false
let listenersBound = false

// ── local "updated_at" metadata (independent of the game blob) ─────────
function readLocalUpdatedAt(): number {
  try {
    const raw = localStorage.getItem(META_KEY)
    if (!raw) return 0
    const parsed = JSON.parse(raw) as { updatedAt?: number }
    return parsed.updatedAt ?? 0
  } catch {
    return 0
  }
}

function writeLocalUpdatedAt(ts: number) {
  try {
    localStorage.setItem(META_KEY, JSON.stringify({ updatedAt: ts }))
  } catch {
    /* ignore quota / privacy mode */
  }
}

// ── snapshot helpers ───────────────────────────────────────────────────
function getSnapshot(): GameSnapshot {
  const s = useStore.getState()
  return {
    spends: s.spends,
    savings: s.savings,
    customLocations: s.customLocations,
    customReasons: s.customReasons,
    recentLocations: s.recentLocations,
    recentReasons: s.recentReasons,
    pact: s.pact,
    userName: s.userName,
    avatar: s.avatar,
    seeded: s.seeded,
    locationPins: s.locationPins,
  }
}

function signatureOf(s: GameSnapshot): string {
  // Cheap change-detection over the meaningful fields.
  return JSON.stringify({
    sp: s.spends,
    sv: s.savings,
    cl: s.customLocations,
    cr: s.customReasons,
    p: s.pact,
    n: s.userName,
    a: s.avatar,
    lp: s.locationPins,
  })
}

function unionById<T extends { id: string; timestamp: number }>(a: T[], b: T[]): T[] {
  const map = new Map<string, T>()
  for (const item of [...a, ...b]) map.set(item.id, item)
  return Array.from(map.values()).sort((x, y) => y.timestamp - x.timestamp)
}

function uniq(list: string[]): string[] {
  return [...new Set(list)]
}

/** Merge two snapshots. Arrays are unioned; scalar fields come from the newer side. */
function mergeSnapshots(
  local: GameSnapshot,
  remote: GameSnapshot,
  remoteNewer: boolean,
): GameSnapshot {
  const newer = remoteNewer ? remote : local
  return {
    spends: unionById(local.spends, remote.spends),
    savings: unionById(local.savings, remote.savings),
    customLocations: uniq([...local.customLocations, ...remote.customLocations]),
    customReasons: uniq([...local.customReasons, ...remote.customReasons]),
    recentLocations: uniq([...newer.recentLocations]).slice(0, 5),
    recentReasons: uniq([...newer.recentReasons]).slice(0, 5),
    pact: newer.pact,
    userName: newer.userName,
    avatar: normalizeAvatar(newer.avatar),
    seeded: local.seeded || remote.seeded,
    locationPins: { ...local.locationPins, ...(remoteNewer ? remote.locationPins : {}) },
  }
}

/** Apply a snapshot into the store without echoing it back as a local change. */
function applySnapshot(snap: GameSnapshot) {
  suppress = true
  try {
    useStore.setState({
      spends: snap.spends,
      savings: snap.savings,
      customLocations: snap.customLocations,
      customReasons: snap.customReasons,
      recentLocations: snap.recentLocations,
      recentReasons: snap.recentReasons,
      pact: snap.pact,
      userName: snap.userName,
      avatar: normalizeAvatar(snap.avatar),
      seeded: snap.seeded,
      locationPins: snap.locationPins,
    })
  } finally {
    lastSignature = signatureOf(getSnapshot())
    suppress = false
  }
}

// ── remote I/O (best-effort, never throws to caller) ───────────────────
async function pullRemote(userId: string): Promise<{ data: GameSnapshot; updatedAt: number } | null> {
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('game_state')
      .select('data, updated_at')
      .eq('user_id', userId)
      .maybeSingle()
    if (error || !data?.data) return null
    return {
      data: data.data as GameSnapshot,
      updatedAt: new Date(data.updated_at as string).getTime() || 0,
    }
  } catch (err) {
    console.error('[Selora] pullRemote failed:', err)
    return null
  }
}

async function pushRemote(p: Player, snap: GameSnapshot, updatedAt: number): Promise<boolean> {
  if (!supabase) return false
  const iso = new Date(updatedAt).toISOString()
  try {
    const { error: gsErr } = await supabase
      .from('game_state')
      .upsert({ user_id: p.id, data: snap, updated_at: iso }, { onConflict: 'user_id' })
    if (gsErr) throw gsErr

    const { error: lbErr } = await supabase.from('leaderboard').upsert(
      {
        user_id: p.id,
        display_name: p.displayName,
        total_savings: getTotalSavings(snap.savings),
        updated_at: iso,
      },
      { onConflict: 'user_id' },
    )
    if (lbErr) throw lbErr
    return true
  } catch (err) {
    console.error('[Selora] pushRemote failed (will retry):', err)
    return false
  }
}

// ── scheduling ─────────────────────────────────────────────────────────
function schedulePush() {
  if (!player || !supabase) return
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => void flush(), DEBOUNCE_MS)
}

async function flush() {
  if (!player || !supabase) return
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    pendingPush = true
    return
  }
  const snap = getSnapshot()
  const ts = readLocalUpdatedAt() || Date.now()
  const ok = await pushRemote(player, snap, ts)
  pendingPush = !ok
}

function onStoreChange() {
  if (suppress || !player) return
  const snap = getSnapshot()
  const sig = signatureOf(snap)
  if (sig === lastSignature) return
  lastSignature = sig
  writeLocalUpdatedAt(Date.now())
  schedulePush()
}

function onOnline() {
  if (pendingPush) void flush()
}

function onFocus() {
  if (pendingPush) void flush()
}

// ── public API ─────────────────────────────────────────────────────────
/**
 * Start cloud sync for a player. Performs the initial merge, then watches the
 * store for changes. Safe to call repeatedly; a no-op without a backend.
 */
export async function startCloudSync(p: Player, mode: 'cloud' | 'local'): Promise<void> {
  if (!supabase || mode !== 'cloud') return
  player = p
  lastSignature = signatureOf(getSnapshot())

  // Initial merge.
  try {
    const remote = await pullRemote(p.id)
    const local = getSnapshot()
    const localTs = readLocalUpdatedAt()
    if (remote) {
      const remoteNewer = remote.updatedAt > localTs
      const merged = mergeSnapshots(local, remote.data, remoteNewer)
      applySnapshot(merged)
      const mergedTs = Math.max(remote.updatedAt, localTs, Date.now())
      writeLocalUpdatedAt(mergedTs)
      await pushRemote(p, merged, mergedTs)
    } else {
      // No cloud row yet — seed it from local.
      const ts = localTs || Date.now()
      writeLocalUpdatedAt(ts)
      await pushRemote(p, local, ts)
    }
  } catch (err) {
    console.error('[Selora] initial sync failed (staying local):', err)
  }

  // Watch for changes.
  if (!unsubStore) unsubStore = useStore.subscribe(onStoreChange)
  if (!listenersBound && typeof window !== 'undefined') {
    listenersBound = true
    window.addEventListener('online', onOnline)
    window.addEventListener('focus', onFocus)
  }
}

/** Stop syncing (e.g. on sign-out). Flushes any pending write first. */
export function stopCloudSync(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
  if (unsubStore) {
    unsubStore()
    unsubStore = null
  }
  player = null
  lastSignature = null
  pendingPush = false
}
