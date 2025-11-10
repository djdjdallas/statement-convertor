import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CalendarDays, Clock, ArrowRight, ChevronLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { notFound } from 'next/navigation'

export const metadata = {
  title: 'Blog Category - Statement Desk',
  description: 'Browse blog posts by category',
}

// Map blog post slugs to categories
const POST_CATEGORIES = {
  'how-to-convert-pdf-bank-statement-to-excel': 'how-to-guides',
  'bank-statement-to-csv-converter': 'how-to-guides',
  'best-bank-statement-converter-tools': 'tool-comparisons',
  'import-bank-statements-quickbooks': 'integrations',
  'import-bank-statements-xero': 'integrations',
  'docuclipper-alternative': 'alternatives',
  'bank-statement-ocr-software': 'ocr-technology',
}

// Category definitions
const CATEGORIES = {
  'how-to-guides': {
    name: 'How-To Guides',
    description: 'Step-by-step guides to help you convert and manage your bank statements'
  },
  'tool-comparisons': {
    name: 'Tool Comparisons',
    description: 'Compare different bank statement conversion tools and find the best fit'
  },
  'integrations': {
    name: 'Software Integrations',
    description: 'Learn how to integrate with QuickBooks, Xero, and other accounting software'
  },
  'alternatives': {
    name: 'Product Alternatives',
    description: 'Discover alternatives to popular bank statement processing tools'
  },
  'ocr-technology': {
    name: 'OCR & Technology',
    description: 'Understand the technology behind bank statement OCR and conversion'
  }
}

// Hardcoded blog posts (matching your file structure)
const BLOG_POSTS = [
  {
    slug: 'how-to-convert-pdf-bank-statement-to-excel',
    title: 'How to Convert PDF Bank Statement to Excel (5 Easy Methods - 2025)',
    excerpt: 'Learn 5 methods to convert PDF bank statements to Excel, from free tools to AI-powered converters. Save 4-8 hours monthly with our step-by-step guide.',
    published_at: '2025-01-15',
    reading_time: 12
  },
  {
    slug: 'bank-statement-to-csv-converter',
    title: 'Bank Statement to CSV Converter: Complete Guide (2025)',
    excerpt: 'Convert bank statements to CSV format for easy import into QuickBooks, Xero, and Excel. Step-by-step guide with free and paid options.',
    published_at: '2025-01-14',
    reading_time: 10
  },
  {
    slug: 'best-bank-statement-converter-tools',
    title: '8 Best Bank Statement Converter Tools in 2025 (Tested & Compared)',
    excerpt: 'Compare the 8 best bank statement converter tools in 2025. We tested accuracy, speed, and features to help you choose the right PDF to Excel converter.',
    published_at: '2025-01-10',
    reading_time: 15
  },
  {
    slug: 'import-bank-statements-quickbooks',
    title: 'How to Import Bank Statements into QuickBooks (3 Easy Methods - 2025)',
    excerpt: 'Step-by-step guide to import bank statements into QuickBooks. Learn 3 methods including CSV import, direct connection, and automated conversion.',
    published_at: '2025-01-16',
    reading_time: 11
  },
  {
    slug: 'import-bank-statements-xero',
    title: 'How to Import Bank Statements into Xero (3 Easy Methods - 2025)',
    excerpt: 'Import bank statements into Xero in 3 easy steps. Complete guide with CSV formatting, bank feeds, and automated conversion options.',
    published_at: '2025-01-15',
    reading_time: 10
  },
  {
    slug: 'docuclipper-alternative',
    title: 'Best DocuClipper Alternatives in 2025 (Free & Paid Options)',
    excerpt: 'Looking for a DocuClipper alternative? Compare the best bank statement converters with better pricing, accuracy, and features.',
    published_at: '2025-01-12',
    reading_time: 9
  },
  {
    slug: 'bank-statement-ocr-software',
    title: 'Best Bank Statement OCR Software in 2025 (Tested & Ranked)',
    excerpt: 'Compare the top 8 bank statement OCR software tools. We tested accuracy, speed, and pricing to help you choose the right solution.',
    published_at: '2025-01-18',
    reading_time: 14
  }
]

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function getPostsByCategory(categorySlug) {
  return BLOG_POSTS.filter(post => POST_CATEGORIES[post.slug] === categorySlug)
}

export async function generateStaticParams() {
  return Object.keys(CATEGORIES).map(slug => ({
    slug
  }))
}

export async function generateMetadata({ params }) {
  const { slug } = params
  const category = CATEGORIES[slug]

  if (!category) {
    return {
      title: 'Category Not Found',
    }
  }

  return {
    title: `${category.name} - Statement Desk Blog`,
    description: category.description,
  }
}

export default async function CategoryPage({ params }) {
  const { slug } = params
  const category = CATEGORIES[slug]

  if (!category) {
    notFound()
  }

  const posts = getPostsByCategory(slug)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-blue-600 text-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/blog"
            className="inline-flex items-center text-blue-100 hover:text-white mb-4 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Blog
          </Link>
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              {category.name}
            </h1>
            <p className="mt-4 text-xl text-blue-100">
              {category.description}
            </p>
            <div className="mt-4 text-blue-200">
              {posts.length} {posts.length === 1 ? 'article' : 'articles'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Blog Posts */}
          <div className="lg:col-span-3">
            <div className="grid gap-8">
              {posts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                  <p className="text-gray-500 mb-4">No blog posts found in this category yet.</p>
                  <Link
                    href="/blog"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Browse all posts
                  </Link>
                </div>
              ) : (
                posts.map((post) => (
                  <article key={post.slug} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-4 w-4" />
                          {formatDate(post.published_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {post.reading_time} min read
                        </span>
                        <Badge variant="secondary">
                          {category.name}
                        </Badge>
                      </div>

                      <h2 className="text-2xl font-bold text-gray-900 mb-3">
                        <Link
                          href={`/blog/${post.slug}`}
                          className="hover:text-blue-600 transition-colors"
                        >
                          {post.title}
                        </Link>
                      </h2>

                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>

                      <Link
                        href={`/blog/${post.slug}`}
                        className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Read more
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            {/* All Categories */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">All Categories</h3>
              <ul className="space-y-2">
                {Object.entries(CATEGORIES).map(([categorySlug, categoryData]) => (
                  <li key={categorySlug}>
                    <Link
                      href={`/blog/category/${categorySlug}`}
                      className={`block px-3 py-2 rounded transition-colors ${
                        categorySlug === slug
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                      }`}
                    >
                      {categoryData.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Ready to Convert Your Statements?
              </h3>
              <p className="text-gray-600 mb-4">
                Start converting your bank statements from PDF to Excel in seconds.
              </p>
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
