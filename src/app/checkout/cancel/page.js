'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { XCircle, ArrowLeft, MessageCircle } from 'lucide-react'
import Link from 'next/link'

export default function CheckoutCancelPage() {
  const router = useRouter()

  useEffect(() => {
    // Track checkout cancellation event if needed
    console.log('Checkout cancelled')
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full border-orange-200 bg-orange-50">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <XCircle className="h-6 w-6 text-orange-600" />
            <CardTitle className="text-orange-900">Checkout Cancelled</CardTitle>
          </div>
          <CardDescription className="text-orange-800">
            Your checkout session has been cancelled. No charges were made to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-lg border border-orange-200">
              <h3 className="font-medium text-gray-900 mb-2">Still interested?</h3>
              <p className="text-sm text-gray-600 mb-3">
                We'd love to have you as a customer. Here are some options:
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Review our pricing plans and features</li>
                <li>• Start with a 7-day free trial</li>
                <li>• Contact support if you have questions</li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <Link href="/pricing" className="w-full">
                <Button className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Pricing
                </Button>
              </Link>
              
              <Link href="/dashboard" className="w-full">
                <Button variant="outline" className="w-full">
                  Go to Dashboard
                </Button>
              </Link>
              
              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => window.open('mailto:support@statementdesk.com', '_blank')}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Contact Support
              </Button>
            </div>

            <div className="text-center text-sm text-gray-500 mt-6">
              <p>Questions? Email us at support@statementdesk.com</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}