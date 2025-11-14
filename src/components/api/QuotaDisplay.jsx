/**
 * Quota Display Component
 *
 * Shows current quota usage and limits
 */

'use client';

import { useState, useEffect } from 'react';
import { Zap, TrendingUp, Calendar } from 'lucide-react';

export default function QuotaDisplay({ userId }) {
  const [quota, setQuota] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuota();
  }, [userId]);

  async function fetchQuota() {
    try {
      const response = await fetch('/api/v1/usage', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('api_key')}`
        }
      });

      const data = await response.json();

      if (data.success && data.quota) {
        setQuota(data.quota);
      }
    } catch (error) {
      console.error('Error fetching quota:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!quota) {
    return null;
  }

  const usagePercentage = quota.limit === -1
    ? 0
    : (quota.used / quota.limit) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Plan Tier */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Current Plan</p>
            <p className="mt-1 text-3xl font-semibold text-gray-900 capitalize">
              {quota.plan_tier}
            </p>
          </div>
          <Zap className="h-12 w-12 text-indigo-600" />
        </div>
      </div>

      {/* Usage This Month */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">Usage This Month</p>
            <div className="mt-1 flex items-baseline">
              <p className="text-3xl font-semibold text-gray-900">
                {quota.used}
              </p>
              {quota.limit !== -1 && (
                <p className="ml-2 text-sm text-gray-600">
                  / {quota.limit}
                </p>
              )}
            </div>
            {quota.limit !== -1 && (
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      usagePercentage > 90
                        ? 'bg-red-600'
                        : usagePercentage > 70
                          ? 'bg-yellow-600'
                          : 'bg-green-600'
                    }`}
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  ></div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {usagePercentage.toFixed(1)}% used
                </p>
              </div>
            )}
          </div>
          <TrendingUp className={`h-12 w-12 ml-4 ${
            usagePercentage > 90 ? 'text-red-600' : 'text-green-600'
          }`} />
        </div>
      </div>

      {/* Remaining / Reset */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">
              {quota.limit === -1 ? 'Unlimited' : 'Remaining'}
            </p>
            <p className="mt-1 text-3xl font-semibold text-gray-900">
              {quota.limit === -1 ? '∞' : quota.remaining}
            </p>
            {quota.period?.days_remaining && (
              <p className="mt-2 text-sm text-gray-600">
                Resets in {quota.period.days_remaining} days
              </p>
            )}
          </div>
          <Calendar className="h-12 w-12 text-indigo-600" />
        </div>
      </div>
    </div>
  );
}
