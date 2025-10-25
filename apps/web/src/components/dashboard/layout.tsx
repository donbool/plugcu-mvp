'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientSupabase } from '@/lib/supabase'
import { Navigation } from './navigation'
import type { User, UserRole } from '@/types'

interface DashboardLayoutProps {
  children: React.ReactNode
  requiredRole?: UserRole
}

export function DashboardLayout({ children, requiredRole }: DashboardLayoutProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientSupabase()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        router.push('/auth/login')
        return
      }

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (!profile) {
        router.push('/auth/login')
        return
      }

      if (requiredRole && profile.role !== requiredRole) {
        router.push('/dashboard')
        return
      }

      setUser(profile)
      setLoading(false)
    }

    getUser()
  }, [router, supabase, requiredRole])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userRole={user.role} />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}