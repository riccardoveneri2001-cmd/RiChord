import { supabase } from './supabase'

const KEEPALIVE_KEY = 'richord_last_ping'
const INTERVAL_MS = 5 * 24 * 60 * 60 * 1000 // 5 days

export async function pingSupabase(): Promise<void> {
  try {
    await supabase.from('user_profiles').select('id').limit(1)
    localStorage.setItem(KEEPALIVE_KEY, Date.now().toString())
  } catch {
    // Silent fail — ping is best-effort
  }
}

export function startKeepalive(): () => void {
  const last = parseInt(localStorage.getItem(KEEPALIVE_KEY) ?? '0', 10)
  if (Date.now() - last > INTERVAL_MS) {
    pingSupabase()
  }

  const id = setInterval(pingSupabase, INTERVAL_MS)
  return () => clearInterval(id)
}
