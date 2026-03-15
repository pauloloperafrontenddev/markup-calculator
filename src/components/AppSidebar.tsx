import { Link, useRouterState } from '@tanstack/react-router'
import { useState } from 'react'
import {
  BarChart3,
  ChevronDown,
  FileText,
  Layers,
  Package,
  Settings,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from './ThemeToggle'
import { LogoutButton } from './LogoutButton'
import { useAuthStore, selectIsSuperUser } from '../store/authStore'

interface NavItem {
  to: string
  label: string
  icon: React.ElementType
}

const mainNav: NavItem[] = [
  { to: '/quotes', label: 'Quotes', icon: FileText },
]

const maintenanceNav: NavItem[] = [
  { to: '/maintenance', label: 'Items & Prices', icon: Package },
  { to: '/maintenance/item-sets', label: 'Item Sets', icon: Layers },
  { to: '/maintenance/volume-tiers', label: 'Volume Tiers', icon: BarChart3 },
]

const adminNav: NavItem[] = [
  { to: '/maintenance/users', label: 'Users', icon: Users },
  { to: '/maintenance/settings', label: 'Settings', icon: Settings },
]

function NavLink({ to, label, icon: Icon }: NavItem) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isActive = pathname === to || (to !== '/quotes' && pathname.startsWith(to))

  return (
    <Link
      to={to as any}
      className={cn(
        'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
      )}
    >
      <span
        className={cn(
          'flex size-5 items-center justify-center',
          isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
        )}
      >
        <Icon className="size-4" />
      </span>
      {label}
      {isActive && (
        <span className="ml-auto block size-1.5 rounded-full bg-primary" />
      )}
    </Link>
  )
}

export function AppSidebar() {
  const isSuperUser = useAuthStore(selectIsSuperUser)
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const maintenanceActive = pathname.startsWith('/maintenance')
  const [maintenanceOpen, setMaintenanceOpen] = useState(maintenanceActive)

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r bg-sidebar">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2.5 border-b px-4">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary">
          <span className="font-serif text-sm font-bold text-primary-foreground leading-none">M</span>
        </div>
        <span className="font-semibold text-[0.9375rem] tracking-tight text-foreground">
          Markup
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {/* Main nav */}
        {mainNav.map((item) => (
          <NavLink key={item.to} {...item} />
        ))}

        {/* Maintenance group */}
        <div className="pt-3">
          <button
            onClick={() => setMaintenanceOpen((o) => !o)}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <span className="flex size-5 items-center justify-center">
              <Package className="size-4" />
            </span>
            <span className="flex-1 text-left">Maintenance</span>
            <ChevronDown
              className={cn('size-4 transition-transform duration-200', maintenanceOpen && 'rotate-180')}
            />
          </button>

          {maintenanceOpen && (
            <div className="mt-1 ml-4 pl-3 border-l border-border space-y-0.5">
              {maintenanceNav.map((item) => (
                <NavLink key={item.to} {...item} />
              ))}
              {isSuperUser && (
                <>
                  <div className="my-2 border-t border-border" />
                  {adminNav.map((item) => (
                    <NavLink key={item.to} {...item} />
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Bottom bar */}
      <div className="flex items-center justify-between border-t px-3 py-3">
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>
    </aside>
  )
}
