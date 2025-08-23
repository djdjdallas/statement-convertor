'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Upload, Eye, Settings, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function CheckoutSuccessPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [redirectCountdown, setRedirectCountdown] = useState(5)

  useEffect(() => {
    // Simulate verification of successful payment
    setTimeout(() => {
      setLoading(false)
    }, 1500)
  }, [])

  useEffect(() => {
    if (!loading && redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown(redirectCountdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (redirectCountdown === 0) {
      router.push('/dashboard')
    }
  }, [loading, redirectCountdown, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Loader2 className="h-12 w-12 animate-spin text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Processing your subscription...</h3>
              <p className="text-sm text-gray-500 mt-2">Please wait while we activate your plan</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-green-200 bg-green-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <CardTitle className="text-green-900">Payment Successful!</CardTitle>
                <CardDescription className="text-green-800">
                  Your subscription has been activated
                </CardDescription>
              </div>
            </div>
            <Badge variant="success" className="bg-green-600">Active</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-white rounded-lg border border-green-200">
            <h3 className="font-medium text-gray-900 mb-2">What's included in your plan:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✓ All features unlocked for your subscription tier</li>
              <li>✓ 14-day free trial period (cancel anytime)</li>
              <li>✓ Access to priority support</li>
              <li>✓ Monthly usage limits based on your plan</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-lg border border-green-200">
              <Upload className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 mb-1">Start Converting</h3>
              <p className="text-sm text-gray-600 mb-3">Upload your first statement</p>
              <Link href="/upload">
                <Button size="sm" className="w-full">
                  Upload File
                </Button>
              </Link>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg border border-green-200">
              <Eye className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 mb-1">View Dashboard</h3>
              <p className="text-sm text-gray-600 mb-3">See your subscription details</p>
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="w-full">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg border border-green-200">
              <Settings className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 mb-1">Manage Billing</h3>
              <p className="text-sm text-gray-600 mb-3">Update payment & invoices</p>
              <Link href="/dashboard#subscription">
                <Button variant="outline" size="sm" className="w-full">
                  Billing Settings
                </Button>
              </Link>
            </div>
          </div>

          <div className="p-4 bg-green-100 rounded-lg text-center">
            <p className="text-sm text-green-800">
              Redirecting to dashboard in {redirectCountdown} seconds...
            </p>
            <Button 
              variant="link" 
              size="sm" 
              className="text-green-700"
              onClick={() => router.push('/dashboard')}
            >
              Go now →
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>Need help? Contact us at support@statementdesk.com</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}