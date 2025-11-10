# Statement Desk Blog Components

Production-ready React components for the Statement Desk blog system, built with Next.js 15, JavaScript, and Tailwind CSS.

## Components Overview

### 1. BlogLayout.js
Comprehensive blog post layout with everything you need:
- Responsive header with navigation
- Reading progress bar
- Auto-generated Table of Contents from H2 headings
- Sticky sidebar (desktop) / bottom section (mobile)
- Newsletter signup form
- Share buttons (Twitter, LinkedIn, Facebook)
- Related articles section
- "Try Free" CTA card
- Professional footer

**Props:**
- `children` - Blog post content
- `title` - Post title
- `description` - Meta description
- `relatedArticles` - Array of related posts
- `author` - Author name
- `publishedDate` - Publication date
- `readingTime` - Reading time in minutes

### 2. SEOHead.js
SEO metadata generators for Next.js 15 (not a component, exports functions):
- `generateBlogMetadata()` - Creates Next.js metadata object
- `generateBlogJsonLd()` - Article structured data
- `generateFAQJsonLd()` - FAQ schema
- `generateBreadcrumbJsonLd()` - Breadcrumb navigation

**Features:**
- Complete Open Graph tags
- Twitter Card support
- Article schema markup
- Canonical URLs
- Keywords and meta tags

### 3. ComparisonTable.js
Beautiful comparison tables for product reviews:
- Boolean values render as ✓/✗
- Number ratings (0-5) render as ⭐⭐⭐⭐⭐
- Highlight Statement Desk column
- Sticky header on scroll
- Mobile-optimized card layout
- Responsive with horizontal scroll backup

**Props:**
- `headers` - Column headers array
- `rows` - Row data (supports boolean, number, string)
- `highlightColumn` - Column index to highlight
- `mobileOptimized` - Enable mobile card view (default: true)
- `caption` - Accessibility caption

**Includes:** Pre-built `StatementDeskComparison` component

### 4. CTASection.js
Conversion-optimized call-to-action blocks with 4 variants:
- **primary** - Large hero-style with gradient
- **inline** - Compact inline within content
- **sidebar** - Sticky card for sidebar
- **footer** - Full-width end-of-article

**Props:**
- `variant` - CTA style ('primary', 'inline', 'sidebar', 'footer')
- `title` - Headline
- `description` - Description text
- `buttonText` - CTA button text
- `buttonLink` - Button URL
- `showTrustSignals` - Show social proof
- `badge` - Optional badge text

**Includes pre-built CTAs:**
- `QuickConversionCTA`
- `ComparisonCTA`
- `PricingCTA`
- `SidebarCTA`

## Quick Start

### 1. Basic Blog Post

```jsx
import BlogLayout from '@/components/blog/BlogLayout';

export default function Post() {
  return (
    <BlogLayout
      title="How to Convert Bank Statements"
      description="Complete guide to PDF to Excel conversion"
      readingTime={5}
    >
      <h2>Introduction</h2>
      <p>Converting bank statements is easy...</p>
    </BlogLayout>
  );
}
```

### 2. Add SEO

```jsx
import { generateBlogMetadata } from '@/components/blog/SEOHead';

export async function generateMetadata() {
  return generateBlogMetadata({
    title: 'How to Convert Bank Statements',
    description: 'Complete guide...',
    canonicalUrl: 'https://statementdesk.com/blog/how-to-convert',
    keywords: ['bank statements', 'PDF to Excel']
  });
}
```

### 3. Add Comparison Table

```jsx
import ComparisonTable from '@/components/blog/ComparisonTable';

<ComparisonTable
  headers={['Feature', 'Statement Desk', 'Competitor']}
  rows={[
    ['AI-Powered', true, false],
    ['Accuracy', '99%', '85%'],
    ['Rating', 5, 3]
  ]}
  highlightColumn={1}
/>
```

### 4. Add CTAs

```jsx
import CTASection from '@/components/blog/CTASection';

// Inline CTA
<CTASection
  variant="inline"
  title="Try it free"
  description="Convert your first statement in 30 seconds"
/>

// Footer CTA
<CTASection
  variant="footer"
  title="Start Converting Today"
/>
```

## Complete Example

See `USAGE_EXAMPLES.md` for a full blog post example with all components.

## Features

✅ **Next.js 15 Compatible** - Uses App Router and generateMetadata()
✅ **Pure JavaScript** - No TypeScript
✅ **Tailwind CSS** - All styling with Tailwind
✅ **shadcn/ui** - Uses Button, Card components
✅ **Mobile-First** - Fully responsive
✅ **SEO Optimized** - Complete meta tags and structured data
✅ **Analytics Ready** - Tracks CTA clicks and events
✅ **Accessible** - Proper ARIA labels and semantic HTML
✅ **Performance** - Client components only where needed

## Dependencies

Required packages (already in your project):
- Next.js 15
- React 18+
- Tailwind CSS
- @/components/ui/button (shadcn)
- @/components/ui/card (shadcn)
- @/lib/analytics/analytics-service

## File Structure

```
src/components/blog/
├── BlogLayout.js          - Main layout wrapper
├── SEOHead.js            - SEO metadata functions
├── ComparisonTable.js    - Comparison tables
├── CTASection.js         - CTA blocks
├── README.md             - This file
└── USAGE_EXAMPLES.md     - Detailed usage guide
```

## Customization

### Brand Colors
All components use `blue-600` (#2563eb) as primary color. To change:
- Find: `bg-blue-600`, `text-blue-600`, `border-blue-600`
- Replace with your brand color (e.g., `bg-purple-600`)

### Analytics
CTAs track clicks using:
```javascript
analyticsService.trackEvent('cta_clicked', 'blog', variant);
```

### Newsletter API
BlogLayout includes newsletter signup. Update the endpoint in:
```javascript
// BlogLayout.js line ~80
const response = await fetch('/api/newsletter/subscribe', {
  method: 'POST',
  body: JSON.stringify({ email })
});
```

## Best Practices

1. **Always use BlogLayout** - Provides consistent structure
2. **Add SEO metadata** - Use generateBlogMetadata() in every post
3. **Include structured data** - Add JSON-LD for better search visibility
4. **Use comparison tables** - Great for review posts and comparisons
5. **Add CTAs strategically** - Inline after value, footer at end
6. **Optimize images** - Use Next.js Image component for blog images
7. **Keep headings semantic** - Use H2 for main sections (auto-TOC)

## Support

For questions or issues:
- Check USAGE_EXAMPLES.md for detailed examples
- Review inline JSDoc comments in each component
- Contact development team

## License

Copyright 2025 Statement Desk. All rights reserved.
