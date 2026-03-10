import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { supabase } from '../lib/supabase'
import { TopBar } from '../components/TopBar'

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
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <TopBar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
