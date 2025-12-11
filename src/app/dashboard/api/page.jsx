/**
 * API Dashboard Page
 *
 * This page shows the API management interface but is GREYED OUT
 * until the API_ACCESS feature flag is enabled.
 *
 * Features:
 * - API key management
 * - Usage statistics
 * - Quota display
 * - Documentation links
 */

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Lock, Key, BarChart3, FileText, Zap } from 'lucide-react';
import { isFeatureEnabled } from '@/lib/features/flags';
import APIKeyManager from '@/components/api/APIKeyManager';
import UsageMetrics from '@/components/api/UsageMetrics';
import QuotaDisplay from '@/components/api/QuotaDisplay';
import PricingCards from '@/components/api/PricingCards';

export default function APIPage() {
  const [user, setUser] = useState(null);
  const [canAccessAPI, setCanAccessAPI] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      // supabase is imported from @/lib/supabase
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setUser(user);

        // Check if user has API access
        const hasAccess = await isFeatureEnabled('API_ACCESS', { id: user.id });
        setCanAccessAPI(hasAccess);
      }

      setLoading(false);
    }

    checkAccess();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // If user doesn't have access, show greyed-out version with overlay
  if (!canAccessAPI) {
    return (
      <div className="relative min-h-screen bg-gray-50">
        {/* Greyed out content */}
        <div className="opacity-50 pointer-events-none blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900">API Access</h1>
              <p className="mt-2 text-lg text-gray-600">
                Integrate Statement Desk directly into your application
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">API Keys</p>
                    <p className="mt-1 text-3xl font-semibold text-gray-900">0</p>
                  </div>
                  <Key className="h-12 w-12 text-indigo-600" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">This Month</p>
                    <p className="mt-1 text-3xl font-semibold text-gray-900">0</p>
                  </div>
                  <BarChart3 className="h-12 w-12 text-green-600" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Remaining</p>
                    <p className="mt-1 text-3xl font-semibold text-gray-900">100</p>
                  </div>
                  <Zap className="h-12 w-12 text-yellow-600" />
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* API Keys Section */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4">API Keys</h2>
                <p className="text-gray-600 mb-6">
                  Manage your API keys to integrate with Statement Desk
                </p>
                <button className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold">
                  Create New API Key
                </button>
              </div>

              {/* Documentation Section */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4">Documentation</h2>
                <p className="text-gray-600 mb-6">
                  Learn how to integrate our API into your application
                </p>
                <div className="space-y-3">
                  <a href="#" className="flex items-center p-3 bg-gray-100 rounded-lg hover:bg-gray-200">
                    <FileText className="h-5 w-5 mr-3 text-indigo-600" />
                    <span className="font-medium">Quick Start Guide</span>
                  </a>
                  <a href="#" className="flex items-center p-3 bg-gray-100 rounded-lg hover:bg-gray-200">
                    <FileText className="h-5 w-5 mr-3 text-indigo-600" />
                    <span className="font-medium">API Reference</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Usage Chart Placeholder */}
            <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Usage Analytics</h2>
              <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
                <BarChart3 className="h-16 w-16 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Coming Soon Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="text-center p-12 bg-white rounded-2xl shadow-2xl border-4 border-indigo-500 max-w-2xl mx-4">
            <Lock className="w-24 h-24 mx-auto mb-6 text-indigo-600" />
            <h2 className="text-4xl font-bold mb-4 text-gray-900">
              API Access - Coming Soon
            </h2>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              We're building powerful B2B API access for Statement Desk!
              Integrate bank statement processing directly into your application
              with our RESTful API.
            </p>

            {/* Features List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-left">
              <div className="flex items-start">
                <Zap className="h-6 w-6 text-indigo-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-semibold">Lightning Fast</h3>
                  <p className="text-sm text-gray-600">Process statements in seconds</p>
                </div>
              </div>
              <div className="flex items-start">
                <Key className="h-6 w-6 text-indigo-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-semibold">Secure Authentication</h3>
                  <p className="text-sm text-gray-600">API key-based auth system</p>
                </div>
              </div>
              <div className="flex items-start">
                <BarChart3 className="h-6 w-6 text-indigo-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-semibold">Usage Analytics</h3>
                  <p className="text-sm text-gray-600">Track your API consumption</p>
                </div>
              </div>
              <div className="flex items-start">
                <FileText className="h-6 w-6 text-indigo-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-semibold">Full Documentation</h3>
                  <p className="text-sm text-gray-600">Comprehensive API docs</p>
                </div>
              </div>
            </div>

            {/* Waitlist Button */}
            <button
              onClick={async () => {
                // Join waitlist functionality
                // supabase is imported from @/lib/supabase
                const { error } = await supabase
                  .from('user_api_access')
                  .upsert({
                    user_id: user.id,
                    waitlist_joined_at: new Date().toISOString()
                  }, {
                    onConflict: 'user_id'
                  });

                if (!error) {
                  alert('You\'ve been added to the API waitlist! We\'ll notify you when it\'s ready.');
                }
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors shadow-lg hover:shadow-xl"
            >
              Join Waitlist - Get Early Access
            </button>

            <p className="mt-4 text-sm text-gray-500">
              Launching Q2 2025 • Be among the first to integrate
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Full access version (when feature flag is enabled)
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">API Access</h1>
          <p className="mt-2 text-lg text-gray-600">
            Manage your API keys, monitor usage, and integrate Statement Desk into your application
          </p>
        </div>

        {/* Quick Stats */}
        <QuotaDisplay userId={user.id} />

        {/* Main Content Grid */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* API Keys Management */}
          <div className="lg:col-span-2">
            <APIKeyManager userId={user.id} />
          </div>

          {/* Sidebar - Documentation & Quick Links */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-indigo-600" />
                Documentation
              </h3>
              <div className="space-y-2">
                <a
                  href="/docs/api"
                  className="block p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                >
                  Quick Start Guide
                </a>
                <a
                  href="/docs/api/authentication"
                  className="block p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                >
                  Authentication
                </a>
                <a
                  href="/docs/api/endpoints"
                  className="block p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                >
                  API Reference
                </a>
              </div>
            </div>

            <PricingCards currentPlan="starter" />
          </div>
        </div>

        {/* Usage Analytics */}
        <div className="mt-8">
          <UsageMetrics userId={user.id} />
        </div>
      </div>
    </div>
  );
}
