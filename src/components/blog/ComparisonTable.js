'use client';

import { useState } from 'react';

/**
 * ComparisonTable Component
 *
 * Styled comparison tables for tool/product reviews with mobile optimization
 *
 * @param {Object} props
 * @param {string[]} props.headers - Array of column headers (e.g., ['Feature', 'Statement Desk', 'Competitor A'])
 * @param {Array<Array>} props.rows - Array of row arrays (e.g., [['Feature 1', true, false, true]])
 * @param {number} props.highlightColumn - Column index to highlight (typically Statement Desk column)
 * @param {boolean} props.mobileOptimized - Convert to card layout on mobile (default: true)
 * @param {string} props.caption - Optional table caption for accessibility
 *
 * Value types supported:
 * - boolean: Renders ✓ (green) or ✗ (red)
 * - number (0-5): Renders star rating (⭐⭐⭐⭐⭐)
 * - string: Renders as-is
 *
 * @example
 * <ComparisonTable
 *   headers={['Feature', 'Statement Desk', 'Competitor A', 'Competitor B']}
 *   rows={[
 *     ['AI-Powered Processing', true, false, false],
 *     ['Accuracy Rate', '95-98%', '85%', '80%'],
 *     ['User Rating', 5, 4, 3],
 *     ['Price', '$29/mo', '$49/mo', '$39/mo'],
 *     ['API Access', true, true, false]
 *   ]}
 *   highlightColumn={1}
 *   caption="Comparison of bank statement conversion tools"
 * />
 */
export default function ComparisonTable({
  headers = [],
  rows = [],
  highlightColumn = null,
  mobileOptimized = true,
  caption = ''
}) {
  const [stickyHeader, setStickyHeader] = useState(false);

  // Handle sticky header on scroll (only for desktop)
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', () => {
      const table = document.querySelector('.comparison-table');
      if (table) {
        const rect = table.getBoundingClientRect();
        setStickyHeader(rect.top < 60 && rect.bottom > 100);
      }
    });
  }

  // Format cell value based on type
  const formatCellValue = (value) => {
    // Boolean: Check/X
    if (typeof value === 'boolean') {
      return value ? (
        <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-600 rounded-full font-bold">
          ✓
        </span>
      ) : (
        <span className="inline-flex items-center justify-center w-6 h-6 bg-red-100 text-red-600 rounded-full font-bold">
          ✗
        </span>
      );
    }

    // Number (0-5): Star rating
    if (typeof value === 'number' && value >= 0 && value <= 5) {
      const fullStars = Math.floor(value);
      const halfStar = value % 1 >= 0.5;
      return (
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <span
              key={i}
              className={i < fullStars ? 'text-yellow-500' : 'text-gray-300'}
            >
              ⭐
            </span>
          ))}
          <span className="ml-1 text-sm text-gray-600">({value})</span>
        </div>
      );
    }

    // String or other: Return as-is
    return value;
  };

  // Desktop table view
  const DesktopTable = () => (
    <div className="hidden sm:block overflow-x-auto">
      <table className="comparison-table w-full border-collapse">
        {caption && <caption className="sr-only">{caption}</caption>}

        <thead>
          <tr
            className={`${
              stickyHeader ? 'sticky top-16 z-20 shadow-md' : ''
            } bg-gray-50 border-b-2 border-gray-200`}
          >
            {headers.map((header, index) => (
              <th
                key={index}
                className={`px-6 py-4 text-left text-sm font-semibold ${
                  index === highlightColumn
                    ? 'bg-blue-50 text-blue-900'
                    : 'text-gray-900'
                } ${index === 0 ? 'w-1/4' : ''}`}
              >
                {header}
                {index === highlightColumn && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-600 text-white">
                    Recommended
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={`border-b border-gray-200 ${
                rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
              } hover:bg-blue-50/50 transition`}
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className={`px-6 py-4 text-sm ${
                    cellIndex === 0
                      ? 'font-medium text-gray-900'
                      : 'text-gray-700'
                  } ${
                    cellIndex === highlightColumn
                      ? 'bg-blue-50/50 border-l-4 border-blue-600'
                      : ''
                  }`}
                >
                  {formatCellValue(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Mobile card view
  const MobileCards = () => (
    <div className="sm:hidden space-y-4">
      {rows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm"
        >
          {/* Feature name header */}
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">{row[0]}</h3>
          </div>

          {/* Comparison values */}
          <div className="divide-y divide-gray-200">
            {headers.slice(1).map((header, headerIndex) => {
              const cellIndex = headerIndex + 1;
              const isHighlighted = cellIndex === highlightColumn;

              return (
                <div
                  key={cellIndex}
                  className={`px-4 py-3 flex items-center justify-between ${
                    isHighlighted ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                  }`}
                >
                  <span className="text-sm font-medium text-gray-700">
                    {header}
                    {isHighlighted && (
                      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-600 text-white">
                        Best
                      </span>
                    )}
                  </span>
                  <span className="text-sm text-gray-900">
                    {formatCellValue(row[cellIndex])}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  if (!mobileOptimized) {
    return <DesktopTable />;
  }

  return (
    <div className="my-8">
      <DesktopTable />
      <MobileCards />
    </div>
  );
}

/**
 * Pre-built comparison table for common Statement Desk comparisons
 *
 * @example
 * <StatementDeskComparison />
 */
export function StatementDeskComparison() {
  return (
    <ComparisonTable
      headers={['Feature', 'Statement Desk', 'Manual Excel', 'Other Tools']}
      rows={[
        ['AI-Powered Extraction', true, false, false],
        ['Accuracy Rate', '95-98%', '70%', '85%'],
        ['Processing Time', '30 seconds', '2-3 hours', '5-10 minutes'],
        ['Categorization', 'Automatic', 'Manual', 'Semi-automatic'],
        ['Multi-Bank Support', true, false, true],
        ['Export Formats', 'Excel, CSV, JSON', 'Excel only', 'Excel, CSV'],
        ['API Access', true, false, false],
        ['User Rating', 5, 3, 4],
        ['Price per Month', '$29', 'Free', '$49'],
        ['Customer Support', '24/7 Chat', 'None', 'Email only']
      ]}
      highlightColumn={1}
      caption="Comparison of Statement Desk with alternatives"
    />
  );
}
