import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    // For now, just redirect to dashboard - auth will be handled client-side
    return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
  }

  return NextResponse.redirect(new URL('/auth/login', requestUrl.origin))
}