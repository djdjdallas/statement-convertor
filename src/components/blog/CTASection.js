'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { analyticsService } from '@/lib/analytics/analytics-service';

/**
 * CTASection Component
 *
 * Conversion-focused call-to-action blocks with multiple variants
 *
 * @param {Object} props
 * @param {'primary' | 'inline' | 'sidebar' | 'footer'} props.variant - CTA style variant
 * @param {string} props.title - Main headline
 * @param {string} props.description - Description text
 * @param {string} props.buttonText - CTA button text (default: "Try Statement Desk Free")
 * @param {string} props.buttonLink - CTA button URL (default: "/signup")
 * @param {boolean} props.showTrustSignals - Show social proof (default: true)
 * @param {string} props.badge - Optional badge text (e.g., "Limited Time Offer")
 *
 * Variants:
 * - primary: Large hero-style with gradient, big button, prominent social proof
 * - inline: Compact inline within content, blue border, fits in article flow
 * - sidebar: Compact card for sidebar, sticky positioning
 * - footer: Full-width end-of-article with features list
 *
 * @example
 * // Primary hero CTA
 * <CTASection
 *   variant="primary"
 *   title="Transform Your Bank Statements in Seconds"
 *   description="Join 10,000+ users who trust Statement Desk for accurate PDF to Excel conversion"
 * />
 *
 * // Inline CTA within article
 * <CTASection
 *   variant="inline"
 *   title="Ready to save hours of manual work?"
 *   description="Start converting statements with AI-powered accuracy"
 *   showTrustSignals={false}
 * />
 */
export default function CTASection({
  variant = 'primary',
  title,
  description,
  buttonText = 'Try Statement Desk Free',
  buttonLink = '/signup',
  showTrustSignals = true,
  badge = null
}) {
  // Track CTA clicks
  const handleClick = () => {
    analyticsService.trackEvent('cta_clicked', 'blog', variant);
  };

  // Primary: Large hero-style CTA
  if (variant === 'primary') {
    return (
      <div className="my-12 relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-8 md:p-12 text-white shadow-2xl">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full opacity-20 blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400 rounded-full opacity-20 blur-2xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          {badge && (
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium mb-6">
              {badge}
            </div>
          )}

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            {title || 'Ready to Convert Bank Statements with AI?'}
          </h2>

          <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            {description ||
              'Join thousands of accountants, bookkeepers, and businesses who save hours every week with Statement Desk\'s AI-powered conversion.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button
              asChild
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg text-lg px-8 py-6 h-auto"
              onClick={handleClick}
            >
              <Link href={buttonLink}>{buttonText}</Link>
            </Button>
            <p className="text-sm text-blue-100">
              No credit card required • Free 14-day trial
            </p>
          </div>

          {showTrustSignals && (
            <div className="flex flex-wrap justify-center gap-6 md:gap-8 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⭐</span>
                <span>
                  <strong className="font-semibold">4.9/5</strong> rating
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">👥</span>
                <span>
                  <strong className="font-semibold">10,000+</strong> users
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔒</span>
                <span>
                  <strong className="font-semibold">Bank-level</strong> security
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Inline: Compact CTA within article content
  if (variant === 'inline') {
    return (
      <Card className="my-8 p-6 md:p-8 border-2 border-blue-600 bg-gradient-to-br from-blue-50 to-white">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            {badge && (
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium mb-3">
                {badge}
              </div>
            )}
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {title || 'Ready to save hours of manual work?'}
            </h3>
            <p className="text-gray-700">
              {description ||
                'Start converting PDF bank statements to Excel with AI-powered accuracy in seconds.'}
            </p>
          </div>
          <div className="flex-shrink-0">
            <Button
              asChild
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
              onClick={handleClick}
            >
              <Link href={buttonLink}>{buttonText}</Link>
            </Button>
            {showTrustSignals && (
              <p className="text-xs text-gray-600 text-center mt-2">
                No credit card required
              </p>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // Sidebar: Compact card for sidebar (sticky)
  if (variant === 'sidebar') {
    return (
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 sticky top-20">
        {badge && (
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-medium mb-3">
            {badge}
          </div>
        )}

        <h3 className="font-bold text-lg mb-2 text-gray-900">
          {title || 'Convert Statements in Seconds'}
        </h3>

        <p className="text-sm text-gray-700 mb-4">
          {description ||
            'Transform PDF bank statements to Excel with AI-powered accuracy. No credit card required.'}
        </p>

        <Button
          asChild
          className="w-full bg-blue-600 hover:bg-blue-700 mb-3"
          onClick={handleClick}
        >
          <Link href={buttonLink}>{buttonText}</Link>
        </Button>

        {showTrustSignals && (
          <div className="space-y-2 text-xs text-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-yellow-500">⭐⭐⭐⭐⭐</span>
              <span>4.9/5 rating</span>
            </div>
            <div className="flex items-center gap-2">
              <span>✓</span>
              <span>10,000+ happy users</span>
            </div>
            <div className="flex items-center gap-2">
              <span>✓</span>
              <span>Bank-level security</span>
            </div>
          </div>
        )}
      </Card>
    );
  }

  // Footer: Full-width end-of-article CTA with features
  if (variant === 'footer') {
    return (
      <div className="my-12 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-8 md:p-12 border border-gray-200">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            {badge && (
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-600 text-white text-sm font-medium mb-4">
                {badge}
              </div>
            )}

            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {title || 'Start Converting Bank Statements with AI'}
            </h2>

            <p className="text-lg text-gray-700 mb-6 max-w-2xl mx-auto">
              {description ||
                'Join thousands of professionals who trust Statement Desk to transform their PDF bank statements into organized Excel files in seconds.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button
                asChild
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6 h-auto"
                onClick={handleClick}
              >
                <Link href={buttonLink}>{buttonText}</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-2 border-gray-300 hover:border-blue-600 hover:bg-blue-50 text-lg px-8 py-6 h-auto"
              >
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>

            {showTrustSignals && (
              <p className="text-sm text-gray-600 mb-8">
                No credit card required • Free 14-day trial • Cancel anytime
              </p>
            )}
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-8 border-t border-gray-200">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">⚡</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">
                Lightning Fast
              </h4>
              <p className="text-sm text-gray-600">
                Convert statements in under 30 seconds
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🎯</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">95-98% Accuracy in Testing</h4>
              <p className="text-sm text-gray-600">
                AI-powered extraction with exceptional precision
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🔒</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">
                Bank-Level Security
              </h4>
              <p className="text-sm text-gray-600">
                Your data is encrypted and never stored
              </p>
            </div>
          </div>

          {showTrustSignals && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex flex-wrap justify-center gap-6 md:gap-8 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-500">⭐⭐⭐⭐⭐</span>
                  <span>4.9/5 from 10,000+ users</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">✓</span>
                  <span>200+ supported banks</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">✓</span>
                  <span>24/7 customer support</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default: Same as primary
  return null;
}

/**
 * Pre-built CTA variants for common use cases
 */

// Quick conversion CTA
export function QuickConversionCTA() {
  return (
    <CTASection
      variant="inline"
      title="Try Statement Desk Risk-Free"
      description="Upload your first PDF and see the magic happen in 30 seconds. No signup required to test."
      buttonText="Convert Your First Statement"
      buttonLink="/try"
    />
  );
}

// Feature comparison CTA
export function ComparisonCTA() {
  return (
    <CTASection
      variant="footer"
      title="See Why 10,000+ Users Choose Statement Desk"
      description="Stop wasting hours on manual data entry. Let AI do the heavy lifting while you focus on what matters."
      badge="Most Accurate"
    />
  );
}

// Pricing page CTA
export function PricingCTA() {
  return (
    <CTASection
      variant="primary"
      title="Start Your Free Trial Today"
      description="No credit card required. Upgrade, downgrade, or cancel anytime."
      buttonText="Start Free Trial"
      badge="14-Day Free Trial"
    />
  );
}

// Blog sidebar CTA
export function SidebarCTA() {
  return (
    <CTASection
      variant="sidebar"
      title="Convert Statements in Seconds"
      description="AI-powered PDF to Excel conversion. Try it free."
      buttonText="Get Started Free"
    />
  );
}
