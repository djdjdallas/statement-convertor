'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import QuickBooksConnectionStatus from '@/components/quickbooks/QuickBooksConnectionStatus';
import MappingDashboard from '@/components/quickbooks/MappingDashboard';
import SyncHistory from '@/components/quickbooks/SyncHistory';
import { useAuth } from '@/contexts/AuthContext';
import { hasQuickBooksAccess } from '@/lib/subscription-tiers';
import { supabase } from '@/lib/supabase';

export default function QuickBooksPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('connection');

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert>
            <AlertDescription>
              Please sign in to access QuickBooks integration.
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => router.push('/auth/signin')}
            className="w-full mt-4"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // Check if user has QB access
  if (!hasQuickBooksAccess(profile?.subscription_tier || 'free')) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Button
            variant="ghost"
            onClick={() => router.push('/settings')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Settings
          </Button>

          <Alert>
            <Building2 className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-2">QuickBooks integration requires a Professional plan or higher.</p>
              <Button
                onClick={() => router.push('/pricing')}
                className="mt-2 bg-blue-600 hover:bg-blue-700"
              >
                Upgrade to Professional
              </Button>
            </AlertDescription>
          </Alert>
        </div>
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
            onClick={() => router.push('/settings')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Settings
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Building2 className="h-6 w-6 text-green-700" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">QuickBooks Integration</h1>
              <p className="text-gray-600">Manage your QuickBooks Online connection and settings</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="connection">Connection</TabsTrigger>
            <TabsTrigger value="mappings">Account Mappings</TabsTrigger>
            <TabsTrigger value="history">Sync History</TabsTrigger>
          </TabsList>

          {/* Connection Tab */}
          <TabsContent value="connection">
            <QuickBooksConnectionStatus />
          </TabsContent>

          {/* Mappings Tab */}
          <TabsContent value="mappings">
            <MappingDashboard />
          </TabsContent>

          {/* Sync History Tab */}
          <TabsContent value="history">
            <SyncHistory />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
