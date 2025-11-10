'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { analyticsService } from '@/lib/analytics/analytics-service';

/**
 * BlogLayout Component
 *
 * Comprehensive blog post layout with header, sidebar, TOC, CTAs, and footer
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Main blog content
 * @param {string} props.title - Blog post title
 * @param {string} props.description - Blog post description
 * @param {Array} props.relatedArticles - Array of {title, slug, excerpt} objects
 * @param {string} props.author - Author name (default: 'Statement Desk Team')
 * @param {string} props.publishedDate - Publication date string
 * @param {number} props.readingTime - Reading time in minutes
 */
export default function BlogLayout({
  children,
  title,
  description,
  relatedArticles = [],
  author = 'Statement Desk Team',
  publishedDate,
  readingTime
}) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeHeading, setActiveHeading] = useState('');
  const [headings, setHeadings] = useState([]);
  const [email, setEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState('idle'); // idle, loading, success, error

  // Calculate reading progress
  useEffect(() => {
    const updateScrollProgress = () => {
      const winScroll = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = (winScroll / height) * 100;
      setScrollProgress(scrolled);
    };

    window.addEventListener('scroll', updateScrollProgress);
    return () => window.removeEventListener('scroll', updateScrollProgress);
  }, []);

  // Extract H2 headings for TOC
  useEffect(() => {
    const articleContent = document.querySelector('.blog-content');
    if (!articleContent) return;

    const h2Elements = articleContent.querySelectorAll('h2');
    const headingData = Array.from(h2Elements).map((heading) => ({
      id: heading.id || heading.textContent.toLowerCase().replace(/\s+/g, '-'),
      text: heading.textContent
    }));

    // Add IDs to headings if they don't have them
    h2Elements.forEach((heading, index) => {
      if (!heading.id) {
        heading.id = headingData[index].id;
      }
    });

    setHeadings(headingData);
  }, [children]);

  // Track active heading on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id);
          }
        });
      },
      { rootMargin: '-100px 0px -80% 0px' }
    );

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  // Handle CTA click tracking
  const handleCTAClick = () => {
    analyticsService.trackEvent('cta_clicked', 'blog', 'sidebar_try_free');
  };

  // Handle share clicks
  const handleShare = (platform) => {
    const url = window.location.href;
    const text = title;

    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    };

    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    analyticsService.trackEvent('share_clicked', 'blog', platform);
  };

  // Handle newsletter signup
  const handleNewsletterSignup = async (e) => {
    e.preventDefault();
    setNewsletterStatus('loading');

    try {
      // Replace with your actual newsletter API endpoint
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        setNewsletterStatus('success');
        setEmail('');
        analyticsService.trackEvent('newsletter_signup', 'blog', 'sidebar');
      } else {
        setNewsletterStatus('error');
      }
    } catch (error) {
      setNewsletterStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-100 z-50">
        <div
          className="h-full bg-blue-600 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-200 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="font-semibold text-xl">Statement Desk</span>
            </Link>

            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-gray-700 hover:text-blue-600 transition">
                Home
              </Link>
              <Link href="/blog" className="text-gray-700 hover:text-blue-600 transition">
                Blog
              </Link>
              <Link href="/pricing" className="text-gray-700 hover:text-blue-600 transition">
                Pricing
              </Link>
            </nav>

            <div className="flex items-center space-x-4">
              <Link
                href="/signin"
                className="text-gray-700 hover:text-blue-600 transition hidden sm:block"
              >
                Sign In
              </Link>
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <Link href="/signup">Try Free</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-600 transition">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/blog" className="hover:text-blue-600 transition">
              Blog
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 truncate">{title}</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Article Content */}
          <article className="lg:col-span-8">
            {/* Article Header */}
            <header className="mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {title}
              </h1>
              <p className="text-xl text-gray-600 mb-6">{description}</p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  {author}
                </span>
                {publishedDate && (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    {publishedDate}
                  </span>
                )}
                {readingTime && (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    {readingTime} min read
                  </span>
                )}
              </div>
            </header>

            {/* Share Buttons - Desktop Floating */}
            <div className="hidden lg:block fixed left-8 top-1/2 -translate-y-1/2 z-30">
              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => handleShare('twitter')}
                  className="w-10 h-10 bg-gray-100 hover:bg-blue-400 hover:text-white rounded-full flex items-center justify-center transition"
                  aria-label="Share on Twitter"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleShare('linkedin')}
                  className="w-10 h-10 bg-gray-100 hover:bg-blue-700 hover:text-white rounded-full flex items-center justify-center transition"
                  aria-label="Share on LinkedIn"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                </button>
                <button
                  onClick={() => handleShare('facebook')}
                  className="w-10 h-10 bg-gray-100 hover:bg-blue-600 hover:text-white rounded-full flex items-center justify-center transition"
                  aria-label="Share on Facebook"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Blog Content */}
            <div className="blog-content prose prose-lg max-w-none">
              {children}
            </div>

            {/* Share Buttons - Mobile */}
            <div className="lg:hidden mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-3">Share this article:</p>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleShare('twitter')}
                  className="flex-1 py-2 px-4 bg-gray-100 hover:bg-blue-400 hover:text-white rounded-lg transition text-sm font-medium"
                >
                  Twitter
                </button>
                <button
                  onClick={() => handleShare('linkedin')}
                  className="flex-1 py-2 px-4 bg-gray-100 hover:bg-blue-700 hover:text-white rounded-lg transition text-sm font-medium"
                >
                  LinkedIn
                </button>
                <button
                  onClick={() => handleShare('facebook')}
                  className="flex-1 py-2 px-4 bg-gray-100 hover:bg-blue-600 hover:text-white rounded-lg transition text-sm font-medium"
                >
                  Facebook
                </button>
              </div>
            </div>
          </article>

          {/* Sidebar - Desktop Sticky, Mobile Below Content */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="lg:sticky lg:top-20 space-y-6">
              {/* Try Free CTA Card */}
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <h3 className="font-bold text-lg mb-2 text-gray-900">
                  Convert Bank Statements in Seconds
                </h3>
                <p className="text-sm text-gray-700 mb-4">
                  Transform PDF bank statements to Excel with AI-powered accuracy. No credit card required.
                </p>
                <Button
                  asChild
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={handleCTAClick}
                >
                  <Link href="/signup">Try Statement Desk Free</Link>
                </Button>
                <p className="text-xs text-gray-600 text-center mt-2">
                  ⭐ 4.9/5 from 10,000+ users
                </p>
              </Card>

              {/* Table of Contents */}
              {headings.length > 0 && (
                <Card className="p-6">
                  <h3 className="font-bold text-lg mb-4 text-gray-900">Table of Contents</h3>
                  <nav className="space-y-2">
                    {headings.map((heading) => (
                      <a
                        key={heading.id}
                        href={`#${heading.id}`}
                        className={`block text-sm transition ${
                          activeHeading === heading.id
                            ? 'text-blue-600 font-medium'
                            : 'text-gray-600 hover:text-blue-600'
                        }`}
                      >
                        {heading.text}
                      </a>
                    ))}
                  </nav>
                </Card>
              )}

              {/* Newsletter Signup */}
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-2 text-gray-900">
                  Stay Updated
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Get the latest tips on statement processing and financial automation.
                </p>

                {newsletterStatus === 'success' ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                    ✓ Thanks for subscribing! Check your email.
                  </div>
                ) : (
                  <form onSubmit={handleNewsletterSignup} className="space-y-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                    <Button
                      type="submit"
                      disabled={newsletterStatus === 'loading'}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {newsletterStatus === 'loading' ? 'Subscribing...' : 'Subscribe'}
                    </Button>
                    {newsletterStatus === 'error' && (
                      <p className="text-sm text-red-600">
                        Something went wrong. Please try again.
                      </p>
                    )}
                  </form>
                )}
              </Card>

              {/* Related Articles */}
              {relatedArticles.length > 0 && (
                <Card className="p-6">
                  <h3 className="font-bold text-lg mb-4 text-gray-900">Related Articles</h3>
                  <div className="space-y-4">
                    {relatedArticles.map((article, index) => (
                      <Link
                        key={index}
                        href={`/blog/${article.slug}`}
                        className="block group"
                      >
                        <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition mb-1">
                          {article.title}
                        </h4>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {article.excerpt}
                        </p>
                      </Link>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <span className="font-semibold text-xl text-white">Statement Desk</span>
              </div>
              <p className="text-sm text-gray-400">
                Convert PDF bank statements to Excel with AI-powered accuracy.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/features" className="hover:text-white transition">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition">Pricing</Link></li>
                <li><Link href="/security" className="hover:text-white transition">Security</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/blog" className="hover:text-white transition">Blog</Link></li>
                <li><Link href="/help" className="hover:text-white transition">Help Center</Link></li>
                <li><Link href="/api-docs" className="hover:text-white transition">API Docs</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white transition">About</Link></li>
                <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition">Terms</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Statement Desk. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
