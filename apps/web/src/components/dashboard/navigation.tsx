'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClientSupabase } from '@/lib/supabase'
import { UserRole } from '@/types'

interface NavigationProps {
  userRole: UserRole
}

export function Navigation({ userRole }: NavigationProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClientSupabase()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const orgNavItems = [
    { href: '/dashboard/org', label: 'Dashboard' },
    { href: '/dashboard/org/profile', label: 'Profile' },
    { href: '/dashboard/org/events', label: 'Events' },
    { href: '/dashboard/org/messages', label: 'Messages' },
  ]

  const brandNavItems = [
    { href: '/dashboard/brand', label: 'Dashboard' },
    { href: '/dashboard/brand/profile', label: 'Profile' },
    { href: '/dashboard/brand/discover', label: 'Discover' },
    { href: '/dashboard/brand/matches', label: 'Matches' },
    { href: '/dashboard/brand/messages', label: 'Messages' },
  ]

  const navItems = userRole === 'student_org' ? orgNavItems : brandNavItems

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-blue-600">
              PlugCU
            </Link>
            
            <div className="flex space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                    pathname === item.href
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  )
}