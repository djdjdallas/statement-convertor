import { Check, X } from 'lucide-react';

/**
 * ProConsList Component
 *
 * Displays a two-column pros and cons comparison list
 *
 * @param {Object} props
 * @param {string[]} props.pros - Array of pros/advantages
 * @param {string[]} props.cons - Array of cons/disadvantages
 * @param {string} [props.title='Pros and Cons'] - Section title
 *
 * @example
 * <ProConsList
 *   title="QuickBooks vs Xero"
 *   pros={[
 *     'Easy to use interface',
 *     'Great mobile app',
 *     'Excellent customer support'
 *   ]}
 *   cons={[
 *     'Higher pricing',
 *     'Limited integrations',
 *     'Slow report generation'
 *   ]}
 * />
 */
export default function ProConsList({
  pros = [],
  cons = [],
  title = 'Pros and Cons'
}) {
  return (
    <div className="my-8">
      {/* Title */}
      <h3 className="text-2xl font-bold text-gray-900 mb-6">{title}</h3>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pros column */}
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center">
              <Check className="h-5 w-5 text-white" strokeWidth={3} />
            </div>
            <h4 className="text-lg font-semibold text-green-900">Pros</h4>
          </div>

          <ul className="space-y-3">
            {pros.length > 0 ? (
              pros.map((pro, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{pro}</span>
                </li>
              ))
            ) : (
              <li className="text-gray-500 italic">No pros listed</li>
            )}
          </ul>
        </div>

        {/* Cons column */}
        <div className="bg-red-50 rounded-lg p-6 border border-red-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-full bg-red-600 flex items-center justify-center">
              <X className="h-5 w-5 text-white" strokeWidth={3} />
            </div>
            <h4 className="text-lg font-semibold text-red-900">Cons</h4>
          </div>

          <ul className="space-y-3">
            {cons.length > 0 ? (
              cons.map((con, index) => (
                <li key={index} className="flex items-start gap-3">
                  <X className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{con}</span>
                </li>
              ))
            ) : (
              <li className="text-gray-500 italic">No cons listed</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
