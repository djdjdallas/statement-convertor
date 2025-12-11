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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Separator } from '@/components/ui/separator'
import { Loader2, Eye, EyeOff, Check, Sparkles } from 'lucide-react'
import GoogleSignInButton from '@/components/GoogleSignInButton'
import SocialAuthDivider from '@/components/SocialAuthDivider'
import { Badge } from '@/components/ui/badge'
import analyticsService from '@/lib/analytics/analytics-service'
import posthog from 'posthog-js'

const signUpSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

function SignUpContent() {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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
      fullName: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  })

  const onSubmit = async (values) => {
    try {
      setLoading(true)
      setError('')
      
      // Calculate trial dates if this is a trial signup
      // Professional plan gets 7-day trial, Business gets no trial
      const trialData = trial ? {
        signup_intent: 'trial',
        intended_tier: intendedTier,
        trial_start_date: new Date().toISOString(),
        trial_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      } : {
        signup_intent: 'free'
      }
      
      const { error } = await signUp(values.email, values.password, {
        data: {
          full_name: values.fullName,
          ...trialData
        }
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
        name: values.fullName,
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

      // Redirect directly to dashboard (email confirmation is bypassed)
      router.push('/dashboard')
    } catch (error) {
      console.error('Sign up error:', error)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const passwordStrength = (password) => {
    const checks = [
      { label: 'At least 8 characters', valid: password.length >= 8 },
      { label: 'Contains uppercase letter', valid: /[A-Z]/.test(password) },
      { label: 'Contains lowercase letter', valid: /[a-z]/.test(password) },
      { label: 'Contains number', valid: /\d/.test(password) }
    ]
    return checks
  }

  const password = form.watch('password')
  const checks = passwordStrength(password || '')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link href="/auth/signin" className="font-medium text-blue-600 hover:text-blue-500">
              sign in to your existing account
            </Link>
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {trial ? (
                'Start your 7-day free trial'
              ) : (
                'Get started for free'
              )}
            </CardTitle>
            <CardDescription>
              {trial ? (
                <>
                  Experience all {intendedTier === 'business' ? 'Business' : 'Professional'} features free for 7 days.
                  <span className="block mt-1 text-xs">
                    • {intendedTier === 'business' ? '2000' : '500'} conversions/month
                    • Advanced AI recognition
                    • Priority support
                    • {intendedTier === 'business' ? 'AI budget recommendations' : 'AI transaction categorization'}
                  </span>
                </>
              ) : (
                'Create your account to start converting bank statements with 10 free conversions per month'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GoogleSignInButton mode="signup" className="mb-4" />
            
            <SocialAuthDivider />
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {error}
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter your full name"
                          autoComplete="name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email address</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="Enter your email"
                          autoComplete="email"
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
                            placeholder="Create a strong password"
                            autoComplete="new-password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      {password && (
                        <div className="mt-2">
                          <div className="text-sm text-gray-600 mb-2">Password requirements:</div>
                          <div className="space-y-1">
                            {checks.map((check, index) => (
                              <div key={index} className="flex items-center text-sm">
                                <Check className={`h-3 w-3 mr-2 ${check.valid ? 'text-green-500' : 'text-gray-300'}`} />
                                <span className={check.valid ? 'text-green-600' : 'text-gray-500'}>
                                  {check.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Repeat your password"
                            autoComplete="new-password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {trial ? 'Start free trial' : 'Create free account'}
                </Button>
              </form>
            </Form>

            <div className="mt-6">
              <Separator className="my-4" />
              <p className="text-center text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/auth/signin" className="font-medium text-blue-600 hover:text-blue-500">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
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