import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CalendarDays, Clock, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'Blog - Bank Statement Converter Guides & Resources',
  description: 'Learn how to convert bank statements from PDF to Excel, compare tools, and discover best practices for financial data management.',
}

async function getBlogPosts() {
  const supabase = await createClient()
  
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select(`
      *,
      category:blog_categories(name, slug),
      tags:blog_post_tags(tag:blog_tags(name, slug))
    `)
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (error) {
    console.error('Error fetching blog posts:', error)
    return []
  }

  return posts
}

function getCategories() {
  // Hardcoded categories that match actual blog content
  return [
    { name: 'How-To Guides', slug: 'how-to-guides' },
    { name: 'Tool Comparisons', slug: 'tool-comparisons' },
    { name: 'Software Integrations', slug: 'integrations' },
    { name: 'Product Alternatives', slug: 'alternatives' },
    { name: 'OCR & Technology', slug: 'ocr-technology' }
  ]
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export default async function BlogPage() {
  const posts = await getBlogPosts()
  const categories = getCategories()

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-blue-600 text-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Blog & Resources
            </h1>
            <p className="mt-4 text-xl text-blue-100">
              Guides, tutorials, and insights for better financial data management
            </p>
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
                  <p className="text-gray-500">No blog posts found.</p>
                </div>
              ) : (
                posts.map((post) => (
                  <article key={post.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                    {post.featured_image && (
                      <img 
                        src={post.featured_image} 
                        alt={post.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                    )}
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
                        {post.category && (
                          <Badge variant="secondary">
                            {post.category.name}
                          </Badge>
                        )}
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
                      
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.tags.map((tagRelation) => (
                            <Badge 
                              key={tagRelation.tag.slug} 
                              variant="outline"
                              className="text-xs"
                            >
                              {tagRelation.tag.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
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
            {/* Categories */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
              <ul className="space-y-2">
                {categories.map((category) => (
                  <li key={category.slug}>
                    <Link 
                      href={`/blog/category/${category.slug}`}
                      className="text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      {category.name}
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

            {/* Newsletter */}
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Stay Updated
              </h3>
              <p className="text-gray-600 mb-4 text-sm">
                Get the latest tips and updates delivered to your inbox.
              </p>
              <form className="space-y-3">
                <input 
                  type="email"
                  placeholder="Your email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button 
                  type="submit"
                  className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}