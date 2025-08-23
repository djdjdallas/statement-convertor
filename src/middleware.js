import { updateSession } from '@/utils/supabase/middleware'
import { securityMiddleware } from '@/lib/security/middleware'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  // Apply security middleware first
  const securityResponse = await securityMiddleware(request)
  if (securityResponse.status !== 200) {
    return securityResponse
  }

  // Then apply session middleware
  const response = await updateSession(request)

  // Copy security headers from security response
  securityResponse.headers.forEach((value, key) => {
    if (!response.headers.has(key)) {
      response.headers.set(key, value)
    }
  })

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (to ensure API routes get proper auth handling)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}