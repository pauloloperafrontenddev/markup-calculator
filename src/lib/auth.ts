import { supabase } from './supabase'
import { useAuthStore } from '../store/authStore'

// ── Sign up ───────────────────────────────────────────────────────────────────

export async function signUp(email: string, password: string, displayName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  })
  if (error) throw error
  return data
}

// ── Sign in ───────────────────────────────────────────────────────────────────

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  // onAuthStateChange in useAuthListener will update Zustand automatically
  return data
}

// ── Sign out ──────────────────────────────────────────────────────────────────

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
  // onAuthStateChange will call clearAuth() in the store
}

// ── Get current access token (with auto-refresh) ──────────────────────────────

/**
 * Returns a valid access token, refreshing it if expired.
 * Use this when making manual fetch() calls to your Supabase edge functions
 * or any other authenticated endpoints.
 */
export async function getAccessToken(): Promise<string | null> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()
  if (error || !session) return null
  return session.access_token
}

// ── Refresh token manually ────────────────────────────────────────────────────

/**
 * Forces an immediate token refresh. Normally not needed since Supabase
 * auto-refreshes ~60 s before expiry, but useful as a fallback.
 */
export async function refreshSession() {
  const { data, error } = await supabase.auth.refreshSession()
  if (error) throw error
  return data.session
}

// ── Role helpers ──────────────────────────────────────────────────────────────

export function isSuperUser() {
  return useAuthStore.getState().profile?.role === 'super_user'
}

export function requireSuperUser() {
  if (!isSuperUser()) {
    throw new Error('Insufficient permissions. Super user role required.')
  }
}
