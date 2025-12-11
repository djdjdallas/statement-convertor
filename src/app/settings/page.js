'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Link, CreditCard, Shield, Loader2, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import GoogleDriveIntegration from '@/components/GoogleDriveIntegration';
import XeroConnectionStatus from '@/components/xero/XeroConnectionStatus';
import QuickBooksConnectionStatus from '@/components/quickbooks/QuickBooksConnectionStatus';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { hasXeroAccess, hasQuickBooksAccess, SUBSCRIPTION_TIERS } from '@/lib/subscription-tiers';
import { toast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('integrations');
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data: profileData, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      }

      setProfile(profileData);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCustomerPortal = async () => {
    try {
      setPortalLoading(true);
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to open billing portal');
      }

      const { portalUrl } = await response.json();
      window.location.href = portalUrl;
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: 'Error',
        description: error.message || 'Unable to open billing portal. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const getTierInfo = (tierName) => {
    return SUBSCRIPTION_TIERS[tierName] || SUBSCRIPTION_TIERS.free;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Alert>
              <AlertDescription>
                Please sign in to access settings.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => router.push('/auth/signin')}
              className="w-full mt-4"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account settings and integrations</p>
        </div>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Link className="w-4 h-4" />
              <span className="hidden sm:inline">Integrations</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Billing</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-gray-600">{user.email}</p>
                </div>
                {profile && (
                  <>
                    <div>
                      <label className="text-sm font-medium">User ID</label>
                      <p className="text-gray-600 font-mono text-sm">{user.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Account Created</label>
                      <p className="text-gray-600">
                        {new Date(profile.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations">
            <div className="space-y-6">
              {/* Xero Integration */}
              {hasXeroAccess(profile?.subscription_tier || 'free') ? (
                <XeroConnectionStatus />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="#13B5EA">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 1.97-1.97-1.97a.75.75 0 10-1.06 1.06l1.97 1.97-1.97 1.97a.75.75 0 101.06 1.06l1.97-1.97 1.97 1.97a.75.75 0 101.06-1.06l-1.97-1.97 1.97-1.97a.75.75 0 10-1.06-1.06zm-11.788 0a.75.75 0 100 1.5h3a.75.75 0 100-1.5h-3zm0 3.5a.75.75 0 100 1.5h3a.75.75 0 100-1.5h-3z"/>
                      </svg>
                      Xero Integration
                    </CardTitle>
                    <CardDescription>
                      Connect Statement Desk to Xero for seamless accounting workflow
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <p className="text-gray-600 mb-4">
                        Xero integration is available on Professional plans and above
                      </p>
                      <Button 
                        onClick={() => router.push('/pricing')}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Upgrade to Professional
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* QuickBooks Integration */}
              {hasQuickBooksAccess(profile?.subscription_tier || 'free') ? (
                <QuickBooksConnectionStatus />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <svg className="h-6 w-6" viewBox="0 0 32 32" fill="#2CA01C">
                        <circle cx="16" cy="16" r="16" fill="#2CA01C"/>
                        <path d="M22 11h-3V8h-6v3H10v10h3v3h6v-3h3V11zm-8 9h-2v-6h2v6zm6 0h-2v-6h2v6z" fill="white"/>
                      </svg>
                      QuickBooks Online Integration
                    </CardTitle>
                    <CardDescription>
                      Automatically sync bank statement transactions to QuickBooks
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <p className="text-gray-600 mb-4">
                        QuickBooks integration is available on Professional plans and above
                      </p>
                      <Button
                        onClick={() => router.push('/pricing')}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Upgrade to Professional
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Google Drive Integration */}
              <GoogleDriveIntegration />

              {/* Future integrations */}
              <Card>
                <CardHeader>
                  <CardTitle>More Integrations Coming Soon</CardTitle>
                  <CardDescription>
                    We're working on adding more integrations to enhance your experience
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="p-4 border rounded-lg opacity-50">
                      <h4 className="font-medium mb-2">Dropbox</h4>
                      <p className="text-sm text-gray-600">
                        Import and export files from Dropbox
                      </p>
                      <p className="text-xs text-gray-500 mt-2">Coming soon</p>
                    </div>
                    <div className="p-4 border rounded-lg opacity-50">
                      <h4 className="font-medium mb-2">OneDrive</h4>
                      <p className="text-sm text-gray-600">
                        Connect your Microsoft OneDrive account
                      </p>
                      <p className="text-xs text-gray-500 mt-2">Coming soon</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing">
            <div className="space-y-6">
              {/* Current Subscription */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Subscription</CardTitle>
                  <CardDescription>
                    Your current plan and subscription status
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {(() => {
                    const tier = profile?.subscription_tier || 'free';
                    const tierInfo = getTierInfo(tier);
                    const limits = tierInfo.limits || {};
                    const hasActiveSubscription = profile?.stripe_customer_id && tier !== 'free';
                    const isCanceling = profile?.subscription_status === 'canceling';

                    return (
                      <>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full ${tier === 'free' ? 'bg-gray-200' : 'bg-blue-100'}`}>
                              <CreditCard className={`h-6 w-6 ${tier === 'free' ? 'text-gray-600' : 'text-blue-600'}`} />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg capitalize">{tier} Plan</h3>
                              <p className="text-sm text-gray-600">
                                {limits.monthlyConversions === -1
                                  ? 'Unlimited conversions'
                                  : `${limits.monthlyConversions} conversions per month`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            {hasActiveSubscription ? (
                              <Badge variant={isCanceling ? 'secondary' : 'default'} className={isCanceling ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}>
                                {isCanceling ? (
                                  <>
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Canceling
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Active
                                  </>
                                )}
                              </Badge>
                            ) : (
                              <Badge variant="outline">Free Tier</Badge>
                            )}
                          </div>
                        </div>

                        {/* Features List */}
                        <div>
                          <h4 className="font-medium mb-3">Plan Features</h4>
                          <ul className="space-y-2">
                            <li className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              {limits.monthlyConversions === -1 ? 'Unlimited' : limits.monthlyConversions} conversions/month
                            </li>
                            <li className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              {limits.exportFormats?.map(f => f.toUpperCase()).join(', ') || 'CSV'} export
                            </li>
                            {limits.xeroAccess && (
                              <li className="flex items-center gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                Xero integration
                              </li>
                            )}
                            {limits.quickbooksAccess && (
                              <li className="flex items-center gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                QuickBooks integration
                              </li>
                            )}
                            {limits.bulkXeroExport && (
                              <li className="flex items-center gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                Bulk export to Xero
                              </li>
                            )}
                          </ul>
                        </div>

                        <Separator />

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-3">
                          {hasActiveSubscription ? (
                            <Button
                              onClick={openCustomerPortal}
                              disabled={portalLoading}
                              className="flex-1"
                            >
                              {portalLoading ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Loading...
                                </>
                              ) : (
                                <>
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Manage Subscription
                                </>
                              )}
                            </Button>
                          ) : (
                            <Button
                              onClick={() => router.push('/pricing')}
                              className="flex-1 bg-blue-600 hover:bg-blue-700"
                            >
                              Upgrade Plan
                            </Button>
                          )}
                        </div>

                        {hasActiveSubscription && (
                          <Alert>
                            <AlertDescription className="text-sm">
                              Use the Manage Subscription button to update your payment method,
                              change your plan, view invoices, or cancel your subscription.
                            </AlertDescription>
                          </Alert>
                        )}
                      </>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Billing History Info */}
              {profile?.stripe_customer_id && (
                <Card>
                  <CardHeader>
                    <CardTitle>Billing History</CardTitle>
                    <CardDescription>
                      View your invoices and payment history
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Access your complete billing history, download invoices, and view all past payments through the Stripe Customer Portal.
                    </p>
                    <Button
                      variant="outline"
                      onClick={openCustomerPortal}
                      disabled={portalLoading}
                    >
                      {portalLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Billing History
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your account security and privacy settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Authentication Method</h4>
                  <p className="text-sm text-gray-600">
                    {user.app_metadata?.provider === 'google' 
                      ? 'Signed in with Google' 
                      : 'Email and password'}
                  </p>
                </div>
                <Alert>
                  <AlertDescription>
                    Additional security features like two-factor authentication coming soon.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}