import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { supabase } from '../lib/supabase'
import { AppSidebar } from '../components/AppSidebar'

// ── Route guard ───────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }

    return { session }
  },

  component: AuthenticatedLayout,
})

// ── Layout ────────────────────────────────────────────────────────────────────

function AuthenticatedLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
