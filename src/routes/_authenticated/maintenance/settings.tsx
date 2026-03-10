import { createFileRoute } from '@tanstack/react-router'
import { useAuthStore, selectIsSuperUser } from '../../../store/authStore'

export const Route = createFileRoute('/_authenticated/maintenance/settings')({
  component: SettingsPageGuard,
})

function SettingsPageGuard() {
  const isSuperUser = useAuthStore(selectIsSuperUser)

  if (!isSuperUser) {
    return (
      <div className="p-6">
        <p className="text-destructive font-medium">Access denied. Super user role required.</p>
      </div>
    )
  }

  return <SettingsPage />
}

function SettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="text-muted-foreground mt-1">Global settings management goes here.</p>
    </div>
  )
}
