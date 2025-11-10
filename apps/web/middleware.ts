import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // If user is not logged in and trying to access protected routes
  if (!user && isProtectedRoute(pathname)) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // If user is logged in and trying to access auth routes
  if (user && isAuthRoute(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Role-based access control
  if (user) {
    const userRole = user.user_metadata?.role as string

    // Organization routes - only student_org users can access
    if (isOrgRoute(pathname) && userRole !== 'student_org') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Brand routes - only brand users can access
    if (isBrandRoute(pathname) && userRole !== 'brand') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Admin routes - only admin users can access
    if (isAdminRoute(pathname) && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

function isProtectedRoute(pathname: string): boolean {
  const protectedRoutes = ['/dashboard', '/api/protected']
  return protectedRoutes.some(route => pathname.startsWith(route))
}

function isAuthRoute(pathname: string): boolean {
  return pathname.startsWith('/auth/')
}

function isOrgRoute(pathname: string): boolean {
  return pathname.startsWith('/dashboard/org')
}

function isBrandRoute(pathname: string): boolean {
  return pathname.startsWith('/dashboard/brand')
}

function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith('/dashboard/admin')
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg).*)',
  ],
}
