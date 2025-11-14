/**
 * API Pricing Cards Component
 *
 * Displays API pricing tiers
 */

'use client';

import { Check } from 'lucide-react';
import { API_PLAN_CONFIGS } from '@/lib/stripe/metered-billing';

export default function PricingCards({ currentPlan = null }) {
  const plans = [
    {
      tier: 'starter',
      highlighted: false
    },
    {
      tier: 'growth',
      highlighted: true
    },
    {
      tier: 'scale',
      highlighted: false
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Upgrade Plan</h3>
      <div className="space-y-3">
        {plans.map(({ tier, highlighted }) => {
          const config = API_PLAN_CONFIGS[tier];
          const isCurrent = currentPlan === tier;

          return (
            <div
              key={tier}
              className={`p-4 rounded-lg border-2 transition-all ${
                highlighted
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${isCurrent ? 'ring-2 ring-green-500' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-gray-900 capitalize">{config.name}</h4>
                {isCurrent && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                    Current
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-2">
                ${config.price}
                <span className="text-sm font-normal text-gray-600">/month</span>
              </p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-center text-sm text-gray-600">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  {config.included_conversions} conversions/month
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  ${config.overage_rate}/conversion overage
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  {config.rate_limit} requests/minute
                </li>
              </ul>
              {!isCurrent && (
                <button className={`w-full py-2 rounded font-medium transition-colors ${
                  highlighted
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}>
                  Upgrade
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
