# Blog Components Usage Guide

Complete examples for using the Statement Desk blog components.

## Table of Contents
1. [BlogLayout](#bloglayout)
2. [SEOHead](#seohead)
3. [ComparisonTable](#comparisontable)
4. [CTASection](#ctasection)
5. [Complete Blog Post Example](#complete-blog-post-example)

---

## BlogLayout

### Basic Usage

```jsx
import BlogLayout from '@/components/blog/BlogLayout';

export default function BlogPost() {
  return (
    <BlogLayout
      title="How to Convert Bank Statements to Excel in 2025"
      description="Complete guide to converting PDF bank statements to Excel using AI-powered tools"
      author="Sarah Johnson"
      publishedDate="January 15, 2025"
      readingTime={8}
      relatedArticles={[
        {
          title: "Top 10 Bank Statement Converters Compared",
          slug: "bank-statement-converters-comparison",
          excerpt: "We tested 10 popular tools to find the best PDF to Excel converter..."
        },
        {
          title: "Automate Your Bookkeeping Workflow",
          slug: "automate-bookkeeping-workflow",
          excerpt: "Learn how to save 20+ hours per month with automation..."
        }
      ]}
    >
      <h2>Introduction</h2>
      <p>Converting bank statements from PDF to Excel is a common task...</p>

      <h2>Method 1: Using AI-Powered Tools</h2>
      <p>The fastest and most accurate method...</p>
    </BlogLayout>
  );
}
```

### Props Reference

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| children | ReactNode | Yes | Main blog content |
| title | string | Yes | Blog post title |
| description | string | Yes | Meta description |
| relatedArticles | array | No | Array of {title, slug, excerpt} |
| author | string | No | Author name (default: "Statement Desk Team") |
| publishedDate | string | No | Publication date |
| readingTime | number | No | Reading time in minutes |

---

## SEOHead

### Next.js 15 Metadata Generation

```jsx
// app/blog/[slug]/page.js
import { generateBlogMetadata, generateBlogJsonLd } from '@/components/blog/SEOHead';

// Generate metadata for SEO
export async function generateMetadata({ params }) {
  const post = await getPost(params.slug);

  return generateBlogMetadata({
    title: post.title,
    description: post.excerpt,
    keywords: ['bank statements', 'PDF to Excel', 'accounting automation'],
    canonicalUrl: `https://statementdesk.com/blog/${params.slug}`,
    publishedTime: '2025-01-15T10:00:00Z',
    modifiedTime: '2025-01-16T14:30:00Z',
    author: {
      name: 'Sarah Johnson',
      url: 'https://statementdesk.com/authors/sarah-johnson'
    },
    image: {
      url: '/blog/bank-statement-conversion-guide.jpg',
      width: 1200,
      height: 630,
      alt: 'Guide to converting bank statements to Excel'
    }
  });
}

// Page component with JSON-LD structured data
export default async function BlogPostPage({ params }) {
  const post = await getPost(params.slug);

  const jsonLd = generateBlogJsonLd({
    title: post.title,
    description: post.excerpt,
    canonicalUrl: `https://statementdesk.com/blog/${params.slug}`,
    publishedTime: post.publishedDate,
    modifiedTime: post.updatedDate,
    author: { name: post.author, url: post.authorUrl },
    image: { url: post.featuredImage, alt: post.title }
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogLayout {...post}>
        {post.content}
      </BlogLayout>
    </>
  );
}
```

### FAQ Schema for Posts with FAQs

```jsx
import { generateFAQJsonLd } from '@/components/blog/SEOHead';

const faqJsonLd = generateFAQJsonLd([
  {
    question: "How accurate is Statement Desk's PDF conversion?",
    answer: "Statement Desk uses AI-powered extraction achieving 95-98% accuracy in our testing, significantly better than manual data entry or traditional OCR tools."
  },
  {
    question: "Which banks are supported?",
    answer: "Statement Desk supports 200+ banks worldwide, including Chase, Bank of America, Wells Fargo, and most regional banks."
  },
  {
    question: "Is my financial data secure?",
    answer: "Yes, we use bank-level encryption (AES-256) and never store your PDFs after processing. All data is processed securely and deleted immediately."
  }
]);

// Add to page
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
/>
```

### Breadcrumb Schema

```jsx
import { generateBreadcrumbJsonLd } from '@/components/blog/SEOHead';

const breadcrumbJsonLd = generateBreadcrumbJsonLd([
  { name: 'Home', url: 'https://statementdesk.com' },
  { name: 'Blog', url: 'https://statementdesk.com/blog' },
  { name: 'Guides', url: 'https://statementdesk.com/blog/guides' },
  { name: 'How to Convert Bank Statements', url: 'https://statementdesk.com/blog/how-to-convert-bank-statements' }
]);
```

---

## ComparisonTable

### Basic Comparison

```jsx
import ComparisonTable from '@/components/blog/ComparisonTable';

<ComparisonTable
  headers={['Feature', 'Statement Desk', 'Manual Excel', 'Competitor A']}
  rows={[
    ['Processing Speed', '30 seconds', '2-3 hours', '5 minutes'],
    ['AI-Powered', true, false, false],
    ['Accuracy', '95-98%', '70%', '85%'],
    ['User Rating', 5, 3, 4],
    ['Monthly Price', '$29', 'Free', '$49']
  ]}
  highlightColumn={1}
  caption="Comparison of bank statement conversion methods"
/>
```

### Tool Review Comparison

```jsx
<ComparisonTable
  headers={['Feature', 'Statement Desk', 'Tool A', 'Tool B', 'Tool C']}
  rows={[
    ['AI-Powered Extraction', true, false, true, false],
    ['Multi-Bank Support', true, true, false, true],
    ['API Access', true, false, true, false],
    ['Batch Processing', true, true, false, true],
    ['Export Formats', 'Excel, CSV, JSON', 'Excel only', 'Excel, CSV', 'Excel, PDF'],
    ['Customer Support', '24/7 Chat', 'Email', '9-5 Phone', 'Email'],
    ['Overall Rating', 5, 3.5, 4, 3],
    ['Price/Month', '$29', '$19', '$49', '$39'],
    ['Free Trial', true, false, true, false]
  ]}
  highlightColumn={1}
  mobileOptimized={true}
/>
```

### Pre-built Statement Desk Comparison

```jsx
import { StatementDeskComparison } from '@/components/blog/ComparisonTable';

// Use the pre-configured comparison
<StatementDeskComparison />
```

### Props Reference

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| headers | string[] | Yes | Column headers |
| rows | Array<Array> | Yes | Row data (supports boolean, number 0-5, string) |
| highlightColumn | number | No | Column index to highlight (0-based) |
| mobileOptimized | boolean | No | Convert to cards on mobile (default: true) |
| caption | string | No | Table caption for accessibility |

---

## CTASection

### Primary Hero CTA

```jsx
import CTASection from '@/components/blog/CTASection';

<CTASection
  variant="primary"
  title="Ready to Convert Bank Statements with AI?"
  description="Join 10,000+ users who save hours every week with Statement Desk"
  buttonText="Start Free Trial"
  buttonLink="/signup"
  badge="Limited Time: 20% Off"
  showTrustSignals={true}
/>
```

### Inline Article CTA

```jsx
<CTASection
  variant="inline"
  title="See it in action"
  description="Upload a sample statement and watch AI extract every transaction in seconds"
  buttonText="Try Demo"
  buttonLink="/demo"
  showTrustSignals={false}
/>
```

### Sidebar CTA (in BlogLayout)

```jsx
// Already included in BlogLayout sidebar, but can be used standalone:
<CTASection
  variant="sidebar"
  title="Convert Statements Fast"
  description="AI-powered PDF to Excel in 30 seconds"
  buttonText="Get Started"
/>
```

### Footer CTA

```jsx
<CTASection
  variant="footer"
  title="Start Converting Bank Statements Today"
  description="No credit card required. Free 14-day trial with full access to all features."
  buttonText="Try Statement Desk Free"
  badge="Most Popular"
  showTrustSignals={true}
/>
```

### Pre-built CTA Variants

```jsx
import {
  QuickConversionCTA,
  ComparisonCTA,
  PricingCTA,
  SidebarCTA
} from '@/components/blog/CTASection';

// Quick test CTA
<QuickConversionCTA />

// After comparison tables
<ComparisonCTA />

// Pricing-focused
<PricingCTA />

// Sidebar
<SidebarCTA />
```

### Props Reference

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| variant | string | Yes | 'primary', 'inline', 'sidebar', or 'footer' |
| title | string | No | Headline (has defaults per variant) |
| description | string | No | Description text (has defaults) |
| buttonText | string | No | CTA button text (default: "Try Statement Desk Free") |
| buttonLink | string | No | Button URL (default: "/signup") |
| showTrustSignals | boolean | No | Show social proof (default: true) |
| badge | string | No | Badge text (e.g., "Limited Time") |

---

## Complete Blog Post Example

Here's a full example of a blog post using all components:

```jsx
// app/blog/best-bank-statement-converters-2025/page.js
import BlogLayout from '@/components/blog/BlogLayout';
import ComparisonTable from '@/components/blog/ComparisonTable';
import CTASection from '@/components/blog/CTASection';
import {
  generateBlogMetadata,
  generateBlogJsonLd,
  generateFAQJsonLd
} from '@/components/blog/SEOHead';

// SEO Metadata
export async function generateMetadata() {
  return generateBlogMetadata({
    title: 'Best Bank Statement Converters in 2025: Complete Comparison',
    description: 'We tested 10 PDF bank statement converters to find the best tool for accuracy, speed, and value. See our detailed comparison and recommendations.',
    keywords: [
      'bank statement converter',
      'PDF to Excel',
      'statement conversion software',
      'accounting automation',
      'bookkeeping tools'
    ],
    canonicalUrl: 'https://statementdesk.com/blog/best-bank-statement-converters-2025',
    publishedTime: '2025-01-15T10:00:00Z',
    modifiedTime: '2025-01-20T14:30:00Z',
    author: {
      name: 'Sarah Johnson',
      url: 'https://statementdesk.com/authors/sarah-johnson'
    },
    image: {
      url: '/blog/bank-statement-converters-comparison.jpg',
      width: 1200,
      height: 630,
      alt: 'Comparison of top bank statement conversion tools'
    }
  });
}

export default function BlogPost() {
  // JSON-LD structured data
  const articleJsonLd = generateBlogJsonLd({
    title: 'Best Bank Statement Converters in 2025: Complete Comparison',
    description: 'We tested 10 PDF bank statement converters...',
    canonicalUrl: 'https://statementdesk.com/blog/best-bank-statement-converters-2025',
    publishedTime: '2025-01-15T10:00:00Z',
    modifiedTime: '2025-01-20T14:30:00Z',
    author: {
      name: 'Sarah Johnson',
      url: 'https://statementdesk.com/authors/sarah-johnson'
    },
    image: {
      url: '/blog/bank-statement-converters-comparison.jpg',
      alt: 'Comparison chart'
    }
  });

  const faqJsonLd = generateFAQJsonLd([
    {
      question: "What is the most accurate bank statement converter?",
      answer: "Statement Desk offers 95-98% accuracy in our testing using AI-powered extraction, making it the most accurate option we tested."
    },
    {
      question: "Can I convert bank statements for free?",
      answer: "Most tools offer free trials. Statement Desk provides a 14-day free trial with full access to all features."
    },
    {
      question: "How long does it take to convert a bank statement?",
      answer: "With Statement Desk, conversion takes about 30 seconds per statement. Manual methods can take 2-3 hours."
    }
  ]);

  const relatedArticles = [
    {
      title: "How to Automate Your Bookkeeping Workflow",
      slug: "automate-bookkeeping-workflow",
      excerpt: "Save 20+ hours per month by automating repetitive accounting tasks..."
    },
    {
      title: "Chase Bank Statement to Excel: Complete Guide",
      slug: "chase-bank-statement-to-excel",
      excerpt: "Step-by-step guide for converting Chase bank statements..."
    },
    {
      title: "Best Accounting Software for Small Businesses",
      slug: "best-accounting-software-small-business",
      excerpt: "Compare QuickBooks, Xero, FreshBooks and more..."
    }
  ];

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <BlogLayout
        title="Best Bank Statement Converters in 2025: Complete Comparison"
        description="We tested 10 PDF bank statement converters to find the best tool for accuracy, speed, and value. See our detailed comparison."
        author="Sarah Johnson"
        publishedDate="January 15, 2025"
        readingTime={12}
        relatedArticles={relatedArticles}
      >
        {/* Article Content */}
        <p className="lead">
          If you're tired of manually copying data from PDF bank statements into Excel,
          you're not alone. We tested 10 popular conversion tools to find the best solution
          for accountants, bookkeepers, and business owners.
        </p>

        <h2>Our Testing Methodology</h2>
        <p>
          We evaluated each tool based on five key criteria:
        </p>
        <ul>
          <li><strong>Accuracy:</strong> How many transactions were correctly extracted?</li>
          <li><strong>Speed:</strong> How long did conversion take?</li>
          <li><strong>Features:</strong> Categorization, multi-bank support, API access</li>
          <li><strong>Ease of Use:</strong> User interface and learning curve</li>
          <li><strong>Value:</strong> Pricing relative to features and accuracy</li>
        </ul>

        <h2>Top 5 Bank Statement Converters Compared</h2>

        <ComparisonTable
          headers={['Feature', 'Statement Desk', 'Tool A', 'Tool B', 'Tool C', 'Tool D']}
          rows={[
            ['AI-Powered Extraction', true, false, true, false, false],
            ['Accuracy Rate', '95-98%', '85%', '90%', '75%', '80%'],
            ['Processing Speed', '30 sec', '5 min', '2 min', '10 min', '3 min'],
            ['Multi-Bank Support', true, true, false, true, false],
            ['Auto Categorization', true, false, true, false, false],
            ['API Access', true, false, true, false, false],
            ['Export Formats', 'Excel, CSV, JSON', 'Excel', 'Excel, CSV', 'Excel', 'Excel, PDF'],
            ['Customer Support', '24/7 Chat', 'Email', '9-5 Phone', 'Email', 'Email'],
            ['User Rating', 5, 3.5, 4, 3, 3.5],
            ['Monthly Price', '$29', '$19', '$49', '$15', '$39'],
            ['Free Trial', true, false, true, true, false]
          ]}
          highlightColumn={1}
          caption="Detailed comparison of top 5 bank statement conversion tools"
        />

        <h2>Detailed Reviews</h2>

        <h3>1. Statement Desk - Best Overall</h3>
        <p>
          Statement Desk is our top pick for most users, offering the perfect balance
          of accuracy, speed, and features. The AI-powered extraction correctly identified
          95-98% of transactions in our tests, significantly better than competitors.
        </p>

        <p><strong>Pros:</strong></p>
        <ul>
          <li>95-98% accuracy with AI-powered extraction in our testing</li>
          <li>Lightning-fast processing (30 seconds average)</li>
          <li>Automatic transaction categorization</li>
          <li>200+ banks supported</li>
          <li>API access for automation</li>
          <li>Excellent 24/7 customer support</li>
        </ul>

        <p><strong>Cons:</strong></p>
        <ul>
          <li>Slightly higher price than basic alternatives</li>
          <li>May be overkill for very simple one-time conversions</li>
        </ul>

        <p><strong>Best For:</strong> Accountants, bookkeepers, and businesses that need
        reliable, accurate conversions on a regular basis.</p>

        {/* Inline CTA after first recommendation */}
        <CTASection
          variant="inline"
          title="Try Statement Desk Risk-Free"
          description="See why 10,000+ users trust Statement Desk for their bank statement conversions"
          buttonText="Start Free Trial"
          showTrustSignals={false}
        />

        <h3>2. Tool B - Best for Large Enterprises</h3>
        <p>
          Tool B offers good accuracy and includes API access, making it suitable for
          larger organizations with custom integration needs...
        </p>

        <h3>3. Tool A - Budget Option</h3>
        <p>
          At just $19/month, Tool A is the most affordable option. However, the 85%
          accuracy rate means you'll likely spend time correcting errors...
        </p>

        <h2>How We Tested</h2>
        <p>
          We used the same set of 50 bank statements from 10 different banks to test
          each tool. Each statement contained between 20-100 transactions...
        </p>

        <h2>Frequently Asked Questions</h2>

        <h3>What is the most accurate bank statement converter?</h3>
        <p>
          Statement Desk achieved 95-98% accuracy in our tests, the highest of any tool
          we evaluated. The AI-powered extraction correctly identified transaction dates,
          descriptions, and amounts with minimal errors.
        </p>

        <h3>Can I convert bank statements for free?</h3>
        <p>
          While manual conversion is free (just time-consuming), most automated tools
          require a subscription. Statement Desk offers a 14-day free trial with full
          access to all features, allowing you to test it risk-free.
        </p>

        <h3>How long does it take to convert a bank statement?</h3>
        <p>
          Manual conversion typically takes 2-3 hours per statement. Statement Desk
          completes the process in about 30 seconds. Over a year, this can save hundreds
          of hours.
        </p>

        <h2>Final Recommendation</h2>
        <p>
          For most users, <strong>Statement Desk</strong> is the clear winner. The
          combination of 95-98% accuracy in our testing, fast processing, automatic categorization, and
          excellent support justifies the $29/month price tag. If you process even just
          2-3 statements per month, the time savings alone make it worthwhile.
        </p>

        <p>
          For budget-conscious users with simple needs, Tool A offers decent value at
          $19/month, though you'll need to accept lower accuracy. Large enterprises
          should consider Tool B for its robust API and enterprise features.
        </p>

        {/* Footer CTA */}
        <CTASection
          variant="footer"
          title="Ready to Stop Manual Data Entry?"
          description="Join 10,000+ professionals who save hours every week with Statement Desk's AI-powered conversion. Start your free trial today."
          buttonText="Try Statement Desk Free"
          badge="14-Day Free Trial"
          showTrustSignals={true}
        />
      </BlogLayout>
    </>
  );
}
```

---

## Best Practices

### 1. SEO Optimization
- Always use `generateBlogMetadata()` for proper meta tags
- Include relevant keywords naturally in title and description
- Add JSON-LD structured data for better search visibility
- Use descriptive, keyword-rich URLs

### 2. Content Structure
- Start with a compelling intro paragraph
- Use H2 headings for main sections (auto-generates TOC)
- Break up long content with comparison tables and CTAs
- End with a strong conclusion and footer CTA

### 3. Conversion Optimization
- Place inline CTAs after valuable content sections
- Use primary CTA for hero sections above the fold
- Include footer CTA at the end of every post
- Show trust signals (ratings, user counts) prominently

### 4. Mobile Experience
- ComparisonTable automatically converts to cards on mobile
- BlogLayout sidebar moves below content on small screens
- All CTAs are fully responsive
- Reading progress bar works on all devices

### 5. Performance
- All components use 'use client' only when needed
- Analytics tracking is non-blocking
- Images should be optimized before use
- Consider lazy-loading comparison tables for long posts

---

## Component File Locations

```
src/components/blog/
├── BlogLayout.js          - Main blog layout wrapper
├── SEOHead.js            - SEO metadata generators
├── ComparisonTable.js    - Comparison tables
├── CTASection.js         - Call-to-action blocks
└── USAGE_EXAMPLES.md     - This file
```

## Questions?

For more information or support:
- Check the inline JSDoc comments in each component
- Review the example blog post above
- Contact the development team
