'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientSupabase } from '@/lib/supabase'

export default function DashboardRedirect() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientSupabase()

  useEffect(() => {
    const redirectUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()

        if (!authUser) {
          router.push('/auth/login')
          return
        }

        // Get role from auth metadata
        const roleFromMeta = authUser.user_metadata?.role as string || 'student_org'

        if (roleFromMeta === 'student_org') {
          router.push('/dashboard/org')
        } else if (roleFromMeta === 'brand') {
          router.push('/dashboard/brand')
        } else if (roleFromMeta === 'admin') {
          router.push('/dashboard/admin')
        } else {
          router.push('/dashboard/org')
        }
      } finally {
        setLoading(false)
      }
    }

    redirectUser()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Redirecting...</p>
        </div>
      </div>
    )
  }

  return null
}