'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Upload, Eye, Settings } from 'lucide-react'
import Link from 'next/link'

export default function CheckoutSuccess() {
  const [showSuccess, setShowSuccess] = useState(false)
  const searchParams = useSearchParams()
  const checkoutStatus = searchParams?.get('checkout')

  useEffect(() => {
    if (checkoutStatus === 'success') {
      setShowSuccess(true)
      // Clear the URL parameter after showing success
      if (window.history.replaceState) {
        window.history.replaceState({}, '', window.location.pathname)
      }
    }
  }, [checkoutStatus])

  if (!showSuccess) {
    return null
  }

  return (
    <Card className="mb-8 border-green-200 bg-green-50">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <CardTitle className="text-green-900">Welcome to your new plan!</CardTitle>
        </div>
        <CardDescription className="text-green-800">
          Your subscription has been activated successfully. You now have access to all your plan's features.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-white rounded-lg border border-green-200">
            <Upload className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900 mb-1">Start Converting</h3>
            <p className="text-sm text-gray-600 mb-3">Upload your first bank statement</p>
            <Link href="/upload">
              <Button size="sm" className="w-full">
                Upload File
              </Button>
            </Link>
          </div>
          
          <div className="text-center p-4 bg-white rounded-lg border border-green-200">
            <Eye className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900 mb-1">View Features</h3>
            <p className="text-sm text-gray-600 mb-3">Check out your new capabilities</p>
            <Link href="#subscription">
              <Button variant="outline" size="sm" className="w-full">
                View Plan
              </Button>
            </Link>
          </div>
          
          <div className="text-center p-4 bg-white rounded-lg border border-green-200">
            <Settings className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900 mb-1">Manage Billing</h3>
            <p className="text-sm text-gray-600 mb-3">Update payment methods</p>
            <Button variant="outline" size="sm" className="w-full" disabled>
              Coming Soon
            </Button>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-white rounded-lg border border-green-200">
          <h4 className="font-medium text-gray-900 mb-2">What's Next?</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Your subscription is now active and ready to use</li>
            <li>• Upload PDF bank statements to start converting</li>
            <li>• Export your data as Excel or CSV files</li>
            <li>• Manage your subscription anytime through your dashboard</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}