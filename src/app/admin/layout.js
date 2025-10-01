/**
 * Admin Layout
 *
 * Protects all /admin routes by checking if the user is an admin.
 * Only users with specific email addresses or user IDs can access admin pages.
 *
 * To configure admin access:
 * 1. Add admin user IDs to the ADMIN_USER_IDS array
 * 2. OR add admin email addresses to the ADMIN_EMAILS array
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { RefreshCw, ShieldAlert } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

// ============================================
// ADMIN CONFIGURATION
// ============================================
// Add your admin user IDs here (from Supabase auth.users table)
const ADMIN_USER_IDS = [
  // Example: '12345678-1234-1234-1234-123456789012'
  // Add your user ID here to grant admin access
]

// OR add admin email addresses here
const ADMIN_EMAILS = [
  'admin@statementdesk.com',
  // Add your email addresses here
]

export default function AdminLayout({ children }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdminAccess()
  }, [user])

  /**
   * Check if the current user has admin access
   * Verifies user ID or email against configured admin lists
   */
  async function checkAdminAccess() {
    try {
      // If no user, redirect to sign in
      if (!user) {
        router.push('/auth/signin?redirect=/admin/analytics')
        return
      }

      // Get user details
      const { data: { user: currentUser }, error } = await supabase.auth.getUser()

      if (error || !currentUser) {
        console.error('Error fetching user:', error)
        router.push('/dashboard')
        return
      }

      const email = currentUser.email
      const userId = currentUser.id

      setUserEmail(email)

      // Check if user is admin by ID or email
      const isAdminUser =
        ADMIN_USER_IDS.includes(userId) ||
        ADMIN_EMAILS.includes(email)

      if (isAdminUser) {
        setIsAdmin(true)
      } else {
        // Not an admin - redirect to dashboard after a brief delay
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      }

    } catch (error) {
      console.error('Admin access check error:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  // Not an admin - show access denied message
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="p-4 bg-red-100 rounded-full">
                <ShieldAlert className="h-12 w-12 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl">Access Denied</CardTitle>
            <CardDescription className="text-center text-base">
              You don't have permission to access the admin dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Logged in as:</p>
              <p className="font-mono text-sm font-medium text-gray-900">{userEmail}</p>
            </div>

            <p className="text-sm text-gray-600 text-center">
              If you believe you should have access, please contact the system administrator.
            </p>

            <div className="flex gap-2">
              <Link href="/dashboard" className="flex-1">
                <Button className="w-full" variant="default">
                  Go to Dashboard
                </Button>
              </Link>
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => {
                  supabase.auth.signOut()
                  router.push('/auth/signin')
                }}
              >
                Sign Out
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              Redirecting to dashboard in a moment...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // User is admin - render the admin pages
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {children}
    </div>
  )
}
