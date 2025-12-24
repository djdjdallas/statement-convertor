'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Separator } from '@/components/ui/separator'
import { Loader2, Eye, EyeOff, Check } from 'lucide-react'
import GoogleSignInButton from '@/components/GoogleSignInButton'
import analyticsService from '@/lib/analytics/analytics-service'
import posthog from 'posthog-js'

const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
})

function SignUpContent() {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const { signUp } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get plan details from URL parameters
  const plan = searchParams.get('plan') || 'free'
  const trial = searchParams.get('trial') === 'true'
  const intendedTier = searchParams.get('tier') || null

  const form = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const onSubmit = async (values) => {
    try {
      setLoading(true)
      setError('')

      // Calculate trial dates if this is a trial signup
      const trialData = trial ? {
        signup_intent: 'trial',
        intended_tier: intendedTier,
        trial_start_date: new Date().toISOString(),
        trial_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      } : {
        signup_intent: 'free'
      }

      const { error } = await signUp(values.email, values.password, {
        data: trialData
      })

      if (error) {
        setError(error.message)
        return
      }

      // Track signup conversion event
      analyticsService.trackConversion('user_signup', {
        plan: plan,
        trial: trial,
        intended_tier: intendedTier,
        signup_method: 'email'
      })

      // PostHog: Identify user and capture signup event
      posthog.identify(values.email, {
        email: values.email,
        signup_plan: plan,
        signup_trial: trial,
        intended_tier: intendedTier,
      })
      posthog.capture('user_signed_up', {
        signup_method: 'email',
        plan: plan,
        trial: trial,
        intended_tier: intendedTier,
      })

      // Redirect directly to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('Sign up error:', error)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            {trial ? 'Start your free trial' : 'Create your free account'}
          </h2>
          <p className="mt-2 text-gray-600">
            Join 200+ professionals saving hours on bank statement processing
          </p>
        </div>

        <Card className="shadow-xl border-0">
          <CardContent className="pt-6">
            {/* Google Sign-in - Most Prominent */}
            <GoogleSignInButton mode="signup" className="w-full h-12 text-base font-medium" />

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">or continue with email</span>
              </div>
            </div>

            {/* Simplified Form - Just Email & Password */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {error}
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="you@company.com"
                          autoComplete="email"
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="8+ characters"
                            autoComplete="new-password"
                            className="h-11 pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full h-11 text-base font-medium bg-blue-600 hover:bg-blue-700" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {trial ? 'Start 7-day free trial' : 'Create free account'}
                </Button>
              </form>
            </Form>

            {/* Benefits List */}
            <div className="mt-6 pt-6 border-t">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center text-gray-600">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>10 free conversions</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>No credit card</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>AI-powered accuracy</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Bank-level security</span>
                </div>
              </div>
            </div>

            {/* Sign in link */}
            <p className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/signin" className="font-semibold text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>

        {/* Social Proof */}
        <div className="text-center">
          <div className="flex justify-center -space-x-2 mb-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-1 mb-1">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <p className="text-sm text-gray-500">Trusted by accountants, bookkeepers & finance teams</p>
        </div>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-600 mx-auto" />
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SignUpContent />
    </Suspense>
  )
}