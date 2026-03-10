import { Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { BarChart3, ChevronDown, FileText, Layers, Package, Settings, Users } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { LogoutButton } from './LogoutButton'
import { useAuthStore, selectIsSuperUser } from '../store/authStore'

const mainNav = [{ to: '/quotes' as const, label: 'Quotes', icon: FileText }]

const maintenanceNav = [
  { to: '/maintenance' as const, label: 'Items & Prices', icon: Package },
  { to: '/maintenance/item-sets' as const, label: 'Item Sets', icon: Layers },
  { to: '/maintenance/volume-tiers' as const, label: 'Volume Tiers', icon: BarChart3 },
]

const adminNav = [
  { to: '/maintenance/users' as const, label: 'Users', icon: Users },
  { to: '/maintenance/settings' as const, label: 'Settings', icon: Settings },
]

const navLinkClass =
  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors [&.active]:text-foreground [&.active]:bg-accent'

export function TopBar() {
  const isSuperUser = useAuthStore(selectIsSuperUser)
  const [maintenanceOpen, setMaintenanceOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMaintenanceOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <header className="h-14 shrink-0 border-b bg-background flex items-center px-4 gap-2">
      {/* Brand */}
      <span className="font-semibold text-sm tracking-tight mr-3">Quote Manager</span>

      {/* Nav links */}
      <nav className="flex items-center gap-1 flex-1">
        {mainNav.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className={navLinkClass}>
            <Icon className="size-4" />
            {label}
          </Link>
        ))}

        {/* Maintenance dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setMaintenanceOpen((o) => !o)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            Maintenance
            <ChevronDown
              className={`size-4 transition-transform ${maintenanceOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {maintenanceOpen && (
            <div className="absolute top-full left-0 mt-1 w-52 rounded-md border bg-popover shadow-md z-50 py-1">
              {maintenanceNav.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMaintenanceOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors [&.active]:bg-accent [&.active]:text-accent-foreground"
                >
                  <Icon className="size-4" />
                  {label}
                </Link>
              ))}

              {isSuperUser && (
                <>
                  <div className="my-1 border-t" />
                  {adminNav.map(({ to, label, icon: Icon }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setMaintenanceOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors [&.active]:bg-accent [&.active]:text-accent-foreground"
                    >
                      <Icon className="size-4" />
                      {label}
                    </Link>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <LogoutButton />
      </div>
    </header>
  )
}
