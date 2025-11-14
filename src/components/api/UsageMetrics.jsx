/**
 * Usage Metrics Component
 *
 * Displays API usage statistics and charts
 */

'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Activity } from 'lucide-react';

export default function UsageMetrics({ userId }) {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
  }, [userId]);

  async function fetchUsage() {
    try {
      const response = await fetch('/api/v1/usage', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('api_key')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setUsage(data);
      }
    } catch (error) {
      console.error('Error fetching usage:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="bg-white rounded-lg shadow p-6 animate-pulse">
      <div className="h-64 bg-gray-200 rounded"></div>
    </div>;
  }

  if (!usage) {
    return <div className="bg-white rounded-lg shadow p-6 text-center text-gray-600">
      No usage data available
    </div>;
  }

  const { quota, usage: usageData } = usage;

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <BarChart3 className="h-6 w-6 mr-2 text-indigo-600" />
          Usage Analytics
        </h2>
      </div>

      <div className="p-6">
        {/* Current Period Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Total Requests</p>
            <p className="text-3xl font-bold text-gray-900">
              {usageData.current_period.total_requests}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Successful</p>
            <p className="text-3xl font-bold text-green-600">
              {usageData.current_period.successful_requests}
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Failed</p>
            <p className="text-3xl font-bold text-red-600">
              {usageData.current_period.failed_requests}
            </p>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Success Rate</p>
            <p className="text-3xl font-bold text-indigo-600">
              {usageData.current_period.success_rate}%
            </p>
          </div>
        </div>

        {/* Daily Breakdown Chart */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Daily Usage (Last 30 Days)</h3>
          <div className="h-64 flex items-end space-x-1">
            {usageData.daily_breakdown.map((day, index) => {
              const maxCount = Math.max(...usageData.daily_breakdown.map(d => d.count), 1);
              const height = (day.count / maxCount) * 100;

              return (
                <div
                  key={index}
                  className="flex-1 relative group"
                  title={`${day.date}: ${day.count} requests`}
                >
                  <div
                    className="bg-indigo-500 hover:bg-indigo-600 transition-colors rounded-t"
                    style={{ height: `${height}%` }}
                  ></div>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                    {day.date}<br />
                    {day.count} requests
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between text-xs text-gray-500">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </div>
      </div>
    </div>
  );
}
