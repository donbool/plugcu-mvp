import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/supabase'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    await supabase.auth.exchangeCodeForSession(code)
    
    // Get user profile to determine redirect
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role === 'student_org') {
        return NextResponse.redirect(new URL('/dashboard/org', requestUrl.origin))
      } else if (profile?.role === 'brand') {
        return NextResponse.redirect(new URL('/dashboard/brand', requestUrl.origin))
      }
    }
  }

  return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
}