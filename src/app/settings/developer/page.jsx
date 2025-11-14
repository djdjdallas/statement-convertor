/**
 * Developer Settings Page
 *
 * Allows developers to enable/disable API access and manage developer features.
 * Only visible to users with is_developer flag set to true.
 */

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Code, Key, Database, Zap, AlertCircle } from 'lucide-react';
import { enableApiAccessForUser, disableApiAccessForUser } from '@/lib/features/flags';

export default function DeveloperSettingsPage() {
  const [user, setUser] = useState(null);
  const [apiAccess, setApiAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setUser(user);

        // Fetch API access settings
        const { data } = await supabase
          .from('user_api_access')
          .select('*')
          .eq('user_id', user.id)
          .single();

        setApiAccess(data);
      }

      setLoading(false);
    }

    loadSettings();
  }, []);

  async function toggleApiAccess() {
    if (!user) return;

    setUpdating(true);

    try {
      const supabase = createClient();

      if (apiAccess?.api_enabled) {
        // Disable API access
        await disableApiAccessForUser(user.id);
        setApiAccess({ ...apiAccess, api_enabled: false });
        alert('API access disabled. You will need to refresh the page.');
      } else {
        // Enable API access
        await enableApiAccessForUser(user.id, {
          isDeveloper: true,
          betaTester: true
        });
        setApiAccess({ ...apiAccess, api_enabled: true, is_developer: true, beta_tester: true });
        alert('API access enabled! You can now access the API dashboard.');
      }
    } catch (error) {
      console.error('Error toggling API access:', error);
      alert('Failed to update API access');
    } finally {
      setUpdating(false);
    }
  }

  async function createInitialQuota() {
    if (!user) return;

    setUpdating(true);

    try {
      const supabase = createClient();

      // Create initial quota for testing
      const now = new Date();
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const { error } = await supabase
        .from('api_quotas')
        .insert({
          user_id: user.id,
          plan_tier: 'growth', // Default to growth for developers
          monthly_limit: 500,
          current_usage: 0,
          period_start: now.toISOString(),
          period_end: nextMonth.toISOString(),
          overage_allowed: true,
          overage_rate: 0.15,
          is_active: true
        });

      if (error) throw error;

      alert('Initial quota created successfully!');
    } catch (error) {
      console.error('Error creating quota:', error);
      alert('Failed to create quota: ' + error.message);
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800">Please log in to access developer settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 flex items-center">
          <Code className="h-10 w-10 mr-3 text-indigo-600" />
          Developer Settings
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Manage API access and developer features
        </p>
      </div>

      {/* Warning Banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
        <div className="flex items-start">
          <AlertCircle className="h-6 w-6 text-yellow-600 mr-3 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-900 mb-1">Developer Mode</h3>
            <p className="text-sm text-yellow-800">
              These settings are only available to developers. Enabling API access will bypass
              the feature flag system and grant you full access to API features.
            </p>
          </div>
        </div>
      </div>

      {/* API Access Toggle */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center mb-2">
              <Key className="h-6 w-6 mr-2 text-indigo-600" />
              API Access
            </h2>
            <p className="text-gray-600">
              Enable or disable API access for your account
            </p>
            <div className="mt-4">
              <p className="text-sm text-gray-500">
                Status: <span className={`font-semibold ${apiAccess?.api_enabled ? 'text-green-600' : 'text-red-600'}`}>
                  {apiAccess?.api_enabled ? 'Enabled' : 'Disabled'}
                </span>
              </p>
              {apiAccess?.is_developer && (
                <p className="text-sm text-gray-500">
                  Developer Mode: <span className="font-semibold text-indigo-600">Active</span>
                </p>
              )}
            </div>
          </div>
          <button
            onClick={toggleApiAccess}
            disabled={updating}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              apiAccess?.api_enabled
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {updating ? 'Updating...' : apiAccess?.api_enabled ? 'Disable API' : 'Enable API'}
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
          <Zap className="h-6 w-6 mr-2 text-indigo-600" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={createInitialQuota}
            disabled={updating}
            className="p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Database className="h-6 w-6 text-indigo-600 mb-2" />
            <h3 className="font-semibold text-gray-900">Create Initial Quota</h3>
            <p className="text-sm text-gray-600 mt-1">
              Set up a default quota for testing
            </p>
          </button>

          <a
            href="/dashboard/api"
            className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors block"
          >
            <Key className="h-6 w-6 text-green-600 mb-2" />
            <h3 className="font-semibold text-gray-900">Go to API Dashboard</h3>
            <p className="text-sm text-gray-600 mt-1">
              Manage keys and view usage
            </p>
          </a>
        </div>
      </div>

      {/* Developer Info */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Current Configuration</h2>
        <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(
              {
                user_id: user.id,
                email: user.email,
                api_enabled: apiAccess?.api_enabled || false,
                is_developer: apiAccess?.is_developer || false,
                beta_tester: apiAccess?.beta_tester || false,
                waitlist_joined: apiAccess?.waitlist_joined_at || null,
                access_granted: apiAccess?.access_granted_at || null
              },
              null,
              2
            )}
          </pre>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">Testing Instructions</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
          <li>Enable API access using the toggle above</li>
          <li>Create an initial quota if needed</li>
          <li>Go to the API Dashboard and create an API key</li>
          <li>Test the API endpoints using your key</li>
          <li>Monitor usage and quota in the dashboard</li>
        </ol>
      </div>
    </div>
  );
}
