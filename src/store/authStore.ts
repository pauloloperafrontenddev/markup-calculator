import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Session, User } from '@supabase/supabase-js'
import type { Database } from '../types/database'

type UserProfile = Database['public']['Tables']['user_profiles']['Row']

// ── Types ─────────────────────────────────────────────────────────────────────

type AuthState = {
  // Supabase session — contains access_token, refresh_token, expires_at
  session: Session | null
  // Convenience accessor for the authenticated user
  user: User | null
  // Fetched from user_profiles table (includes role)
  profile: UserProfile | null
  // True while the initial session is being resolved on mount
  isLoading: boolean
}

type AuthActions = {
  setSession: (session: Session | null) => void
  setProfile: (profile: UserProfile | null) => void
  setLoading: (loading: boolean) => void
  clearAuth: () => void
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      session: null,
      user: null,
      profile: null,
      isLoading: true,

      setSession: (session) =>
        set({
          session,
          user: session?.user ?? null,
        }),

      setProfile: (profile) => set({ profile }),

      setLoading: (isLoading) => set({ isLoading }),

      clearAuth: () =>
        set({
          session: null,
          user: null,
          profile: null,
          isLoading: false,
        }),
    }),
    {
      name: 'markup-auth',
      storage: createJSONStorage(() => localStorage),
      // Only persist what matters — Supabase re-validates the session on mount
      partialize: (state) => ({
        session: state.session,
        user: state.user,
        profile: state.profile,
      }),
    },
  ),
)

// ── Selectors ─────────────────────────────────────────────────────────────────

export const selectIsAuthenticated = (s: AuthState) => s.session !== null
export const selectIsSuperUser = (s: AuthState) => s.profile?.role === 'super_user'
export const selectAccessToken = (s: AuthState) => s.session?.access_token ?? null
export const selectRefreshToken = (s: AuthState) => s.session?.refresh_token ?? null
