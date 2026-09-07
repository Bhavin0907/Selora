import { useCallback, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from './supabase'
import { useAuthStore } from '../store/useAuthStore'
import { useStore } from '../store/useStore'
import { getTotalSavings } from './stats'
import { fetchTopLeaderboard, fetchUserRank } from './leaderboardApi'

export interface UiLeaderboardRow {
  id: string
  name: string
  totalSavings: number
  isUser: boolean
}

export interface LeaderboardResult {
  entries: UiLeaderboardRow[]
  userRank: number | null
  /** True when the user sits inside the fetched top slice. */
  userInTop: boolean
  status: 'loading' | 'cloud' | 'local'
}

const TOP_N = 20

/**
 * Live shared leaderboard. Reads the real Supabase table when a cloud player
 * is active, subscribes to realtime changes, and refetches on focus. Falls
 * back gracefully to a local single-row board (just the user) when offline,
 * unconfigured, empty, or on any error — never throws.
 */
export function useLeaderboard(): LeaderboardResult {
  const player = useAuthStore((s) => s.player)
  const mode = useAuthStore((s) => s.mode)
  const savings = useStore((s) => s.savings)
  const userName = useStore((s) => s.userName)
  const userTotal = getTotalSavings(savings)

  const cloudy = isSupabaseConfigured && mode === 'cloud' && !!player

  const [entries, setEntries] = useState<UiLeaderboardRow[]>([])
  const [userRank, setUserRank] = useState<number | null>(null)
  const [userInTop, setUserInTop] = useState(true)
  const [status, setStatus] = useState<'loading' | 'cloud' | 'local'>(
    cloudy ? 'loading' : 'local',
  )

  const load = useCallback(async () => {
    const uid = player?.id ?? 'you'
    const name = userName || player?.displayName || 'You'
    const localRow: UiLeaderboardRow = {
      id: uid,
      name,
      totalSavings: userTotal,
      isUser: true,
    }

    if (!isSupabaseConfigured || mode !== 'cloud' || !player) {
      setEntries([localRow])
      setUserRank(null)
      setUserInTop(true)
      setStatus('local')
      return
    }

    const rows = await fetchTopLeaderboard(TOP_N)
    if (!rows) {
      // Backend error — graceful local fallback.
      setEntries([localRow])
      setUserRank(null)
      setUserInTop(true)
      setStatus('local')
      return
    }

    // Build UI rows; use the live local total for the current user so their
    // own number is always instant (ahead of the debounced cloud write).
    let sawUser = false
    const uiRows: UiLeaderboardRow[] = rows.map((r) => {
      const isUser = r.userId === player.id
      if (isUser) sawUser = true
      return {
        id: r.userId,
        name: isUser ? name : r.displayName,
        totalSavings: isUser ? Math.max(r.totalSavings, userTotal) : r.totalSavings,
        isUser,
      }
    })
    uiRows.sort((a, b) => b.totalSavings - a.totalSavings)

    if (sawUser) {
      setEntries(uiRows)
      setUserRank(uiRows.findIndex((r) => r.isUser) + 1)
      setUserInTop(true)
    } else {
      const rank = await fetchUserRank(userTotal)
      setEntries([...uiRows, localRow])
      setUserRank(rank)
      setUserInTop(false)
    }
    setStatus('cloud')
  }, [mode, player, userTotal, userName])

  useEffect(() => {
    void load()
  }, [load])

  // Realtime updates from other players.
  useEffect(() => {
    if (!supabase || mode !== 'cloud') return
    const channel = supabase
      .channel('selora-leaderboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leaderboard' },
        () => void load(),
      )
      .subscribe()
    return () => {
      void supabase?.removeChannel(channel)
    }
  }, [load, mode])

  // Refetch when the tab regains focus.
  useEffect(() => {
    const onFocus = () => void load()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [load])

  return { entries, userRank, userInTop, status }
}
