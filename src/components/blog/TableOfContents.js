'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, List } from 'lucide-react';

/**
 * TableOfContents Component
 *
 * Auto-generated table of contents with scroll tracking and highlighting
 *
 * @param {Object} props
 * @param {Array<{id: string, text: string, level: number}>} props.headings - Array of heading objects
 * @param {string} [props.title='Table of Contents'] - Section title
 *
 * @example
 * const headings = [
 *   { id: 'intro', text: 'Introduction', level: 2 },
 *   { id: 'features', text: 'Key Features', level: 2 },
 *   { id: 'feature-1', text: 'Feature One', level: 3 },
 *   { id: 'conclusion', text: 'Conclusion', level: 2 }
 * ];
 *
 * <TableOfContents headings={headings} />
 */
export default function TableOfContents({
  headings = [],
  title = 'Table of Contents'
}) {
  const [activeId, setActiveId] = useState('');
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    // Set up Intersection Observer to track visible headings
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-80px 0px -80% 0px', // Adjust based on header height
        threshold: 0
      }
    );

    // Observe all headings
    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [headings]);

  // Smooth scroll to heading
  const scrollToHeading = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // Account for sticky header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav
      className="bg-white border border-gray-200 rounded-lg overflow-hidden sticky top-24"
      aria-label="Table of contents"
    >
      {/* Header with toggle button (mobile) */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <List className="h-5 w-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900">{title}</h2>
        </div>

        {/* Mobile toggle button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-1 hover:bg-gray-200 rounded transition-colors"
          aria-label={isOpen ? 'Collapse table of contents' : 'Expand table of contents'}
          aria-expanded={isOpen}
        >
          <ChevronDown
            className={`h-5 w-5 text-gray-600 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {/* Table of contents list */}
      <div
        className={`
          transition-all duration-200 ease-in-out
          ${isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0 md:max-h-[600px] md:opacity-100'}
          overflow-y-auto
        `}
      >
        <ul className="py-3 space-y-1">
          {headings.map((heading) => {
            const isActive = activeId === heading.id;
            const isH3 = heading.level === 3;

            return (
              <li key={heading.id}>
                <button
                  onClick={() => scrollToHeading(heading.id)}
                  className={`
                    w-full text-left px-4 py-2 text-sm transition-colors
                    ${isH3 ? 'pl-8' : 'pl-4'}
                    ${
                      isActive
                        ? 'text-blue-600 font-semibold bg-blue-50 border-l-2 border-blue-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-l-2 border-transparent'
                    }
                  `}
                  aria-current={isActive ? 'true' : 'false'}
                >
                  {heading.text}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
