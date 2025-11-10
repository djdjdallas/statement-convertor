'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * FAQSection Component
 *
 * Expandable FAQ accordion with schema markup for SEO
 *
 * @param {Object} props
 * @param {Array<{id: string, question: string, answer: string}>} props.faqs - Array of FAQ objects
 * @param {string} [props.title='Frequently Asked Questions'] - Section title
 * @param {boolean} [props.allowMultiple=false] - Allow multiple FAQs to be open at once
 *
 * @example
 * <FAQSection
 *   faqs={[
 *     {
 *       id: 'q1',
 *       question: 'How does Statement Desk work?',
 *       answer: 'Simply upload your PDF bank statement and we convert it to Excel/CSV format.'
 *     },
 *     {
 *       id: 'q2',
 *       question: 'Is my data secure?',
 *       answer: 'Yes, we use bank-level encryption and never store your statements permanently.'
 *     }
 *   ]}
 *   allowMultiple={false}
 * />
 */
export default function FAQSection({
  faqs = [],
  title = 'Frequently Asked Questions',
  allowMultiple = false
}) {
  const [openItems, setOpenItems] = useState(new Set());

  // Toggle FAQ item open/closed
  const toggleItem = (id) => {
    setOpenItems(prev => {
      const newSet = new Set(prev);

      if (allowMultiple) {
        // Multiple items can be open
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
      } else {
        // Only one item can be open (radio style)
        if (newSet.has(id)) {
          newSet.clear();
        } else {
          newSet.clear();
          newSet.add(id);
        }
      }

      return newSet;
    });
  };

  // Generate FAQ Schema for SEO
  const generateSchema = () => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      }))
    };

    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    );
  };

  if (faqs.length === 0) {
    return null;
  }

  return (
    <section className="my-12" aria-labelledby="faq-heading">
      {/* Inject FAQ Schema into page */}
      {generateSchema()}

      {/* Section title */}
      <h2 id="faq-heading" className="text-3xl font-bold text-gray-900 mb-8">
        {title}
      </h2>

      {/* FAQ accordion */}
      <div className="divide-y divide-gray-200 border border-gray-200 rounded-lg">
        {faqs.map((faq, index) => {
          const isOpen = openItems.has(faq.id);

          return (
            <div key={faq.id} className="bg-white">
              {/* Question button */}
              <button
                onClick={() => toggleItem(faq.id)}
                className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-inset"
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${faq.id}`}
                id={`faq-question-${faq.id}`}
              >
                <span className="text-lg font-semibold text-gray-900 pr-8">
                  {faq.question}
                </span>

                <ChevronDown
                  className={`h-5 w-5 text-blue-600 flex-shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              {/* Answer content */}
              <div
                id={`faq-answer-${faq.id}`}
                role="region"
                aria-labelledby={`faq-question-${faq.id}`}
                className={`overflow-hidden transition-all duration-200 ease-in-out ${
                  isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-6 pb-5 text-gray-700 leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
