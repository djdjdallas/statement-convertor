import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  
  // Get all cookies
  const allCookies = cookieStore.getAll()
  
  // Clear all Supabase auth cookies from other projects
  const supabaseCookies = allCookies.filter(c => c.name.includes('sb-') && c.name.includes('auth'))
  
  supabaseCookies.forEach(cookie => {
    cookieStore.delete(cookie.name)
  })
  
  return NextResponse.json({ 
    message: 'Cleared auth cookies',
    clearedCookies: supabaseCookies.map(c => c.name)
  })
}