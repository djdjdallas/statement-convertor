import Link from 'next/link'
import { 
  EnvelopeIcon, 
  QuestionMarkCircleIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

export const metadata = {
  title: 'Support Center - Statement Desk',
  description: 'Get help with Statement Desk - support resources, documentation, and contact options',
  robots: {
    index: true,
    follow: true,
  }
}

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Support Center
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're here to help you get the most out of Statement Desk. 
            Find answers to common questions, access documentation, or contact our support team.
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Link
            href="/docs"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center mb-4">
              <BookOpenIcon className="h-8 w-8 text-blue-600 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">Documentation</h3>
            </div>
            <p className="text-gray-600">
              Comprehensive guides and tutorials for all features
            </p>
          </Link>

          <Link
            href="/docs/faq"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center mb-4">
              <QuestionMarkCircleIcon className="h-8 w-8 text-blue-600 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">FAQ</h3>
            </div>
            <p className="text-gray-600">
              Quick answers to frequently asked questions
            </p>
          </Link>

          <a
            href="https://community.statementdesk.com"
            target="_blank"
            rel="noopener noreferrer"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center mb-4">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-600 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">Community</h3>
            </div>
            <p className="text-gray-600">
              Connect with other users and share best practices
            </p>
          </a>
        </div>

        {/* Contact Options */}
        <div className="bg-white rounded-lg shadow p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Support</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Email Support */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Email Support</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-gray-500 mr-2" />
                  <a href="mailto:support@statementdesk.com" className="text-blue-600 hover:text-blue-800">
                    support@statementdesk.com
                  </a>
                </div>
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="text-gray-600">Response time: 1-2 business days</span>
                </div>
              </div>
              
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Priority Support (Premium)</h4>
                <div className="flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-gray-500 mr-2" />
                  <a href="mailto:priority@statementdesk.com" className="text-blue-600 hover:text-blue-800">
                    priority@statementdesk.com
                  </a>
                </div>
                <div className="flex items-center mt-1">
                  <ClockIcon className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="text-gray-600">Response time: 4-8 hours</span>
                </div>
              </div>
            </div>

            {/* Support Hours */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Support Hours</h3>
              <div className="space-y-2 text-gray-600">
                <p><span className="font-medium">Monday - Friday:</span> 9:00 AM - 6:00 PM PST</p>
                <p><span className="font-medium">Saturday:</span> 10:00 AM - 4:00 PM PST</p>
                <p><span className="font-medium">Sunday:</span> Closed</p>
                <p className="text-sm mt-3">
                  * Priority support available 24/7 for Enterprise customers
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Compliance */}
        <div className="bg-gray-900 text-white rounded-lg p-8">
          <div className="flex items-center mb-4">
            <ShieldCheckIcon className="h-8 w-8 mr-3" />
            <h2 className="text-2xl font-bold">Security & Compliance</h2>
          </div>
          <p className="mb-6">
            Your security is our top priority. Statement Desk is built with enterprise-grade security 
            and compliance standards.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Data Protection</h3>
              <ul className="space-y-1 text-gray-300">
                <li>• 256-bit encryption</li>
                <li>• GDPR compliant</li>
                <li>• No data retention</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Certifications</h3>
              <ul className="space-y-1 text-gray-300">
                <li>• SOC 2 Type II</li>
                <li>• ISO 27001</li>
                <li>• Google Security Assessment</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Report Issues</h3>
              <p className="text-gray-300">
                Found a security issue? Email us at{' '}
                <a href="mailto:security@statementdesk.com" className="text-blue-400 hover:text-blue-300">
                  security@statementdesk.com
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Additional Resources */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Additional Resources</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/docs/google-workspace-setup"
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Google Workspace Setup Guide
            </Link>
            <Link
              href="/docs/api"
              className="px-6 py-3 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition"
            >
              API Documentation
            </Link>
            <Link
              href="/changelog"
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
            >
              Changelog
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}