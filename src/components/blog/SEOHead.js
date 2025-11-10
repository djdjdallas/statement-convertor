/**
 * SEOHead - Blog SEO Metadata Generator
 *
 * Generates Next.js 15 metadata object for optimal SEO
 * Use this in your blog post page.js file's generateMetadata() function
 *
 * @param {Object} params
 * @param {string} params.title - Page title (will be suffixed with " | Statement Desk Blog")
 * @param {string} params.description - Meta description (150-160 chars recommended)
 * @param {string[]} params.keywords - Array of SEO keywords
 * @param {string} params.canonicalUrl - Canonical URL (e.g., https://statementdesk.com/blog/post-slug)
 * @param {string} params.publishedTime - ISO 8601 date string (e.g., "2025-01-15T10:00:00Z")
 * @param {string} params.modifiedTime - ISO 8601 date string for last modification
 * @param {Object} params.author - Author object with name and url
 * @param {Object} params.image - OG image object with url, width, height, alt
 * @returns {Object} Next.js 15 metadata object
 *
 * @example
 * // In your app/blog/[slug]/page.js:
 * export async function generateMetadata({ params }) {
 *   const post = await getPost(params.slug);
 *   return generateBlogMetadata({
 *     title: post.title,
 *     description: post.excerpt,
 *     keywords: post.tags,
 *     canonicalUrl: `https://statementdesk.com/blog/${params.slug}`,
 *     publishedTime: post.publishedDate,
 *     modifiedTime: post.updatedDate,
 *     image: {
 *       url: post.featuredImage || '/og-image.jpg',
 *       width: 1200,
 *       height: 630,
 *       alt: post.title
 *     }
 *   });
 * }
 */
export function generateBlogMetadata({
  title,
  description,
  keywords = [],
  canonicalUrl,
  publishedTime,
  modifiedTime,
  author = {
    name: 'Statement Desk Team',
    url: 'https://statementdesk.com'
  },
  image = {
    url: '/og-image.jpg',
    width: 1200,
    height: 630,
    alt: 'Statement Desk Blog'
  }
}) {
  // Ensure image URL is absolute
  const imageUrl = image.url.startsWith('http')
    ? image.url
    : `https://statementdesk.com${image.url}`;

  // Format title with site name
  const fullTitle = `${title} | Statement Desk Blog`;

  // Base metadata object
  const metadata = {
    // Basic Meta Tags
    title: fullTitle,
    description: description,

    // Keywords (deprecated but some crawlers still use it)
    keywords: keywords.join(', '),

    // Open Graph (Facebook, LinkedIn, etc.)
    openGraph: {
      type: 'article',
      title: title, // Don't include "| Statement Desk Blog" for OG
      description: description,
      url: canonicalUrl,
      siteName: 'Statement Desk',
      images: [
        {
          url: imageUrl,
          width: image.width,
          height: image.height,
          alt: image.alt
        }
      ],
      locale: 'en_US'
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [imageUrl],
      creator: '@statementdesk' // Update with your actual Twitter handle
    },

    // Canonical URL
    alternates: {
      canonical: canonicalUrl
    },

    // Robots (allow indexing by default)
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1
      }
    }
  };

  // Add article-specific Open Graph tags
  if (publishedTime) {
    metadata.openGraph.publishedTime = publishedTime;
  }

  if (modifiedTime) {
    metadata.openGraph.modifiedTime = modifiedTime;
  }

  if (author) {
    metadata.openGraph.authors = [author.name];
  }

  // Add article tags from keywords
  if (keywords.length > 0) {
    metadata.openGraph.tags = keywords;
  }

  // Additional meta tags for article schema
  metadata.other = {};

  if (publishedTime) {
    metadata.other['article:published_time'] = publishedTime;
  }

  if (modifiedTime) {
    metadata.other['article:modified_time'] = modifiedTime;
  }

  if (author) {
    metadata.other['article:author'] = author.url || author.name;
  }

  // Add publisher info
  metadata.other['article:publisher'] = 'https://statementdesk.com';

  return metadata;
}

/**
 * Generate JSON-LD structured data for blog posts
 * This helps search engines understand your content better
 *
 * @param {Object} params - Same params as generateBlogMetadata
 * @returns {Object} JSON-LD script object for Next.js
 *
 * @example
 * // In your blog post page.js:
 * export default function BlogPost({ post }) {
 *   const jsonLd = generateBlogJsonLd({
 *     title: post.title,
 *     description: post.excerpt,
 *     canonicalUrl: `https://statementdesk.com/blog/${post.slug}`,
 *     publishedTime: post.publishedDate,
 *     modifiedTime: post.updatedDate,
 *     author: { name: post.author.name, url: post.author.url },
 *     image: { url: post.featuredImage, alt: post.title }
 *   });
 *
 *   return (
 *     <>
 *       <script
 *         type="application/ld+json"
 *         dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
 *       />
 *       <BlogLayout {...post}>
 *         {post.content}
 *       </BlogLayout>
 *     </>
 *   );
 * }
 */
export function generateBlogJsonLd({
  title,
  description,
  canonicalUrl,
  publishedTime,
  modifiedTime,
  author = {
    name: 'Statement Desk Team',
    url: 'https://statementdesk.com'
  },
  image = {
    url: '/og-image.jpg',
    alt: 'Statement Desk Blog'
  }
}) {
  const imageUrl = image.url.startsWith('http')
    ? image.url
    : `https://statementdesk.com${image.url}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description: description,
    image: imageUrl,
    url: canonicalUrl,
    datePublished: publishedTime,
    dateModified: modifiedTime || publishedTime,
    author: {
      '@type': 'Person',
      name: author.name,
      url: author.url
    },
    publisher: {
      '@type': 'Organization',
      name: 'Statement Desk',
      logo: {
        '@type': 'ImageObject',
        url: 'https://statementdesk.com/logo.png'
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl
    }
  };
}

/**
 * Generate FAQ JSON-LD structured data
 * Use this if your blog post has a FAQ section
 *
 * @param {Array} faqs - Array of {question, answer} objects
 * @returns {Object} JSON-LD script object
 *
 * @example
 * const faqJsonLd = generateFAQJsonLd([
 *   {
 *     question: "How do I convert PDF bank statements?",
 *     answer: "Upload your PDF to Statement Desk and it will automatically extract..."
 *   },
 *   {
 *     question: "Is my data secure?",
 *     answer: "Yes, we use bank-level encryption and never store your PDFs..."
 *   }
 * ]);
 */
export function generateFAQJsonLd(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
}

/**
 * Generate BreadcrumbList JSON-LD structured data
 * Helps search engines understand your site structure
 *
 * @param {Array} breadcrumbs - Array of {name, url} objects
 * @returns {Object} JSON-LD script object
 *
 * @example
 * const breadcrumbJsonLd = generateBreadcrumbJsonLd([
 *   { name: 'Home', url: 'https://statementdesk.com' },
 *   { name: 'Blog', url: 'https://statementdesk.com/blog' },
 *   { name: 'How to Convert Bank Statements', url: 'https://statementdesk.com/blog/how-to-convert' }
 * ]);
 */
export function generateBreadcrumbJsonLd(breadcrumbs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url
    }))
  };
}
