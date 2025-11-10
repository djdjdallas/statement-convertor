import { createClient } from '@/lib/supabase/server'

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://statementconverter.com'
  
  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/auth/signin`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/auth/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },

    // Blog posts (high search volume)
    {
      url: `${baseUrl}/blog/how-to-convert-pdf-bank-statement-to-excel`,
      lastModified: new Date('2025-01-15'),
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/blog/best-bank-statement-converter-tools`,
      lastModified: new Date('2025-01-15'),
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/blog/import-bank-statements-quickbooks`,
      lastModified: new Date('2025-01-15'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/bank-statement-ocr-software`,
      lastModified: new Date('2025-01-15'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/bank-statement-to-csv-converter`,
      lastModified: new Date('2025-01-15'),
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/blog/import-bank-statements-xero`,
      lastModified: new Date('2025-01-15'),
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/blog/docuclipper-alternative`,
      lastModified: new Date('2025-01-15'),
      changeFrequency: 'monthly',
      priority: 0.75,
    },

    // Comparison pages
    {
      url: `${baseUrl}/compare/statement-desk-vs-docuclipper`,
      lastModified: new Date('2025-01-15'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/compare/statement-desk-vs-nanonets`,
      lastModified: new Date('2025-01-15'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },

    // Tool pages (high conversion)
    {
      url: `${baseUrl}/tools/free-pdf-to-excel-converter`,
      lastModified: new Date('2025-01-15'),
      changeFrequency: 'weekly',
      priority: 0.85,
    },

    // Landing pages (high conversion)
    {
      url: `${baseUrl}/for/accountants`,
      lastModified: new Date('2025-01-15'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/for/small-business`,
      lastModified: new Date('2025-01-15'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
  ]

  // Fetch blog posts
  const supabase = await createClient()
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, updated_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  const blogPosts = posts?.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updated_at),
    changeFrequency: 'weekly',
    priority: 0.7,
  })) || []

  return [...staticPages, ...blogPosts]
}