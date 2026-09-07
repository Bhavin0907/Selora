import { supabase } from './supabase'

/** A row from the shared leaderboard table. */
export interface RealLeaderboardRow {
  userId: string
  displayName: string
  totalSavings: number
}

/** Top N players by verified savings. Returns null on failure / no backend. */
export async function fetchTopLeaderboard(limit = 20): Promise<RealLeaderboardRow[] | null> {
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('user_id, display_name, total_savings')
      .order('total_savings', { ascending: false })
      .limit(limit)
    if (error) throw error
    return (data ?? []).map((r) => ({
      userId: r.user_id as string,
      displayName: (r.display_name as string) || 'Player',
      totalSavings: Number(r.total_savings) || 0,
    }))
  } catch (err) {
    console.error('[Selora] leaderboard fetch failed:', err)
    return null
  }
}

/** 1-based rank of a user given their savings (count of players strictly above + 1). */
export async function fetchUserRank(userTotal: number): Promise<number | null> {
  if (!supabase) return null
  try {
    const { count, error } = await supabase
      .from('leaderboard')
      .select('user_id', { count: 'exact', head: true })
      .gt('total_savings', userTotal)
    if (error) throw error
    return (count ?? 0) + 1
  } catch (err) {
    console.error('[Selora] rank fetch failed:', err)
    return null
  }
}
