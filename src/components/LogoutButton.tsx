import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'
import { Button } from './ui/button'
import { signOut } from '../lib/auth'

export function LogoutButton() {
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)

  async function handleSignOut() {
    setIsSigningOut(true)
    try {
      await signOut()
      await router.navigate({ to: '/login' })
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleSignOut}
      disabled={isSigningOut}
      aria-label="Sign out"
    >
      <LogOut className="size-4" />
    </Button>
  )
}
