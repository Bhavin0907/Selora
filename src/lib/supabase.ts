import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase client — reads VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY from .env.
 *
 * Accepted URL forms:
 *   - full URL   https://<project-ref>.supabase.co
 *   - host only  <project-ref>.supabase.co
 *   - project ref  abcdefghijklmnop
 *
 * Accepted key forms (from Project Settings → API):
 *   - sb_publishable_…  (new publishable key)
 *   - eyJ…              (legacy anon JWT)
 *
 * If env is missing/invalid the app stays in local-only mode and never crashes.
 */

const envUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? ''
const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ?? ''

const PROJECT_REF_RE = /^[a-z0-9]{16,32}$/i

/** Turn a ref / host / URL from .env into https://<ref>.supabase.co */
export function resolveSupabaseUrl(raw: string): string | null {
  const value = raw.trim().replace(/\/+$/, '')
  if (!value) return null

  if (PROJECT_REF_RE.test(value)) {
    return `https://${value.toLowerCase()}.supabase.co`
  }

  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`
  try {
    const parsed = new URL(withProtocol)
    const host = parsed.hostname.toLowerCase()
    if (host.endsWith('.supabase.co') && host !== 'supabase.co') {
      return `https://${host}`
    }
  } catch {
    return null
  }
  return null
}

function isUsableKey(key: string): boolean {
  if (!key || key.length < 20) return false
  if (key.startsWith('sb_publishable_')) return true
  if (key.startsWith('sb_secret_') || key.startsWith('sb_service_')) return false
  if (key.startsWith('eyJ') && key.includes('.')) return true
  return false
}

const url = resolveSupabaseUrl(envUrl)
const anonKey = isUsableKey(envKey) ? envKey : null

/** True when a usable Supabase client was created from .env. */
export let isSupabaseConfigured = false

/** The client, or null in local-only mode. Always guard usage with a null-check. */
export const supabase: SupabaseClient | null = (() => {
  if (!url || !anonKey) {
    if (import.meta.env.DEV) {
      console.info(
        '[Selora] Supabase .env not valid — LOCAL-ONLY mode.',
        !url ? 'VITE_SUPABASE_URL must be a project URL or project ref.' : '',
        !anonKey ? 'VITE_SUPABASE_ANON_KEY must be the sb_publishable_ or anon JWT key.' : '',
      )
    }
    return null
  }
  try {
    const client = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
    isSupabaseConfigured = true
    if (import.meta.env.DEV) {
      console.info('[Selora] Supabase connected via .env:', url)
    }
    return client
  } catch (err) {
    console.error('[Selora] Failed to create Supabase client — LOCAL-ONLY mode:', err)
    return null
  }
})()

export function getSupabase(): SupabaseClient | null {
  return supabase
}
