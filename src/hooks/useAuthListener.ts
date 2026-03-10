import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

/**
 * Initializes auth state by:
 * 1. Reading the existing Supabase session from localStorage on mount
 * 2. Fetching the user_profile (role) for the authenticated user
 * 3. Subscribing to Supabase's onAuthStateChange to keep Zustand in sync
 *    whenever tokens are refreshed, the user signs in, or signs out
 *
 * Call this hook ONCE in the root layout component.
 */
export function useAuthListener() {
  const setSession = useAuthStore((s) => s.setSession)
  const setProfile = useAuthStore((s) => s.setProfile)
  const setLoading = useAuthStore((s) => s.setLoading)
  const clearAuth = useAuthStore((s) => s.clearAuth)

  useEffect(() => {
    // Step 1: Restore session from Supabase's own localStorage on initial mount.
    // This also refreshes the access token if it has expired.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Step 2: Subscribe to auth changes (sign-in, sign-out, token refresh).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)

      if (session) {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          await fetchProfile(session.user.id)
        }
      } else {
        clearAuth()
      }
    })

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!error && data) {
      setProfile(data)
    }
    setLoading(false)
  }
}
