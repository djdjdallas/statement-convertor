/**
 * Extract Headings Utility
 *
 * Extracts H2 and H3 headings from HTML/JSX content for use with TableOfContents component
 */

/**
 * Extracts headings from HTML content string
 *
 * @param {string} htmlContent - HTML string containing heading elements
 * @returns {Array<{id: string, text: string, level: number}>} Array of heading objects
 *
 * @example
 * const html = `
 *   <h2 id="intro">Introduction</h2>
 *   <p>Some content...</p>
 *   <h3 id="feature-1">Feature One</h3>
 * `;
 *
 * const headings = extractHeadings(html);
 * // Returns: [
 * //   { id: 'intro', text: 'Introduction', level: 2 },
 * //   { id: 'feature-1', text: 'Feature One', level: 3 }
 * // ]
 */
export function extractHeadings(htmlContent) {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return [];
  }

  const headings = [];

  // Match H2 and H3 tags with their IDs and content
  const headingRegex = /<h([23])[^>]*id=["']([^"']+)["'][^>]*>(.*?)<\/h\1>/gi;

  let match;
  while ((match = headingRegex.exec(htmlContent)) !== null) {
    const level = parseInt(match[1], 10);
    const id = match[2];
    const text = match[3].replace(/<[^>]*>/g, '').trim(); // Remove any HTML tags from heading text

    headings.push({
      id,
      text,
      level
    });
  }

  return headings;
}

/**
 * Extracts headings from DOM (client-side only)
 * Use this in a useEffect hook on the client
 *
 * @param {string} containerSelector - CSS selector for container element (default: 'main')
 * @returns {Array<{id: string, text: string, level: number}>} Array of heading objects
 *
 * @example
 * useEffect(() => {
 *   const headings = extractHeadingsFromDOM('.blog-content');
 *   setHeadings(headings);
 * }, []);
 */
export function extractHeadingsFromDOM(containerSelector = 'main') {
  if (typeof window === 'undefined') {
    console.warn('extractHeadingsFromDOM can only be used in the browser');
    return [];
  }

  const container = document.querySelector(containerSelector);
  if (!container) {
    console.warn(`Container "${containerSelector}" not found`);
    return [];
  }

  const headingElements = container.querySelectorAll('h2[id], h3[id]');

  return Array.from(headingElements).map(heading => ({
    id: heading.id,
    text: heading.textContent.trim(),
    level: parseInt(heading.tagName.substring(1), 10)
  }));
}

/**
 * Auto-generates IDs for headings that don't have them
 * Useful for markdown content that doesn't include IDs
 *
 * @param {string} text - Heading text
 * @returns {string} URL-safe ID
 *
 * @example
 * generateHeadingId('How to Use Statement Desk'); // 'how-to-use-statement-desk'
 * generateHeadingId('FAQ: Common Questions');     // 'faq-common-questions'
 */
export function generateHeadingId(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '')       // Remove leading/trailing hyphens
    .substring(0, 50);              // Limit length
}

/**
 * Enhances HTML content by adding IDs to headings that don't have them
 *
 * @param {string} htmlContent - HTML string
 * @returns {string} Enhanced HTML with IDs on all H2 and H3 elements
 *
 * @example
 * const html = '<h2>Introduction</h2><h3>Getting Started</h3>';
 * const enhanced = addHeadingIds(html);
 * // Returns: '<h2 id="introduction">Introduction</h2><h3 id="getting-started">Getting Started</h3>'
 */
export function addHeadingIds(htmlContent) {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return htmlContent;
  }

  const usedIds = new Set();

  return htmlContent.replace(/<h([23])([^>]*)>(.*?)<\/h\1>/gi, (match, level, attributes, text) => {
    // Check if heading already has an ID
    if (/id=["'][^"']*["']/.test(attributes)) {
      return match;
    }

    // Generate unique ID from heading text
    let id = generateHeadingId(text);

    // Ensure ID is unique
    let counter = 1;
    let uniqueId = id;
    while (usedIds.has(uniqueId)) {
      uniqueId = `${id}-${counter}`;
      counter++;
    }
    usedIds.add(uniqueId);

    // Add ID to heading
    return `<h${level}${attributes} id="${uniqueId}">${text}</h${level}>`;
  });
}
