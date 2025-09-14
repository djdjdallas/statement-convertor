import Link from 'next/link'
import { 
  CheckCircleIcon,
  ArrowRightIcon,
  CloudIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  CogIcon
} from '@heroicons/react/24/outline'

export const metadata = {
  title: 'Google Workspace Setup Guide - Statement Desk',
  description: 'Complete guide for installing and configuring Statement Desk in your Google Workspace',
  robots: {
    index: true,
    follow: true,
  }
}

export default function GoogleWorkspaceSetupPage() {
  return (
    <div className="min-h-screen bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <Link 
            href="/docs" 
            className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center"
          >
            ← Back to Documentation
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4 mt-4">
            Google Workspace Setup Guide
          </h1>
          <p className="text-xl text-gray-600">
            Get Statement Desk up and running in your Google Workspace in just a few minutes.
          </p>
        </div>

        {/* Prerequisites */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">Prerequisites</h2>
          <ul className="list-disc list-inside space-y-1 text-blue-800">
            <li>Google Workspace admin access (for domain-wide installation)</li>
            <li>Google account with Drive and Sheets access (for individual installation)</li>
            <li>PDF bank statements ready to process</li>
          </ul>
        </div>

        {/* Installation Types */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose Your Installation Type</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Individual Installation */}
            <div className="border rounded-lg p-6 hover:shadow-lg transition">
              <UserGroupIcon className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Individual Installation</h3>
              <p className="text-gray-600 mb-4">
                Perfect for personal use or trying out Statement Desk before a company-wide rollout.
              </p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Install in minutes</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">No admin permissions needed</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Full feature access</span>
                </li>
              </ul>
              <a href="#individual-setup" className="text-blue-600 hover:text-blue-800 inline-flex items-center">
                View setup instructions <ArrowRightIcon className="h-4 w-4 ml-1" />
              </a>
            </div>

            {/* Domain Installation */}
            <div className="border rounded-lg p-6 hover:shadow-lg transition">
              <CloudIcon className="h-12 w-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Domain-wide Installation</h3>
              <p className="text-gray-600 mb-4">
                Deploy Statement Desk across your entire organization with centralized management.
              </p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Centralized billing</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">User management</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Admin controls</span>
                </li>
              </ul>
              <a href="#domain-setup" className="text-purple-600 hover:text-purple-800 inline-flex items-center">
                View setup instructions <ArrowRightIcon className="h-4 w-4 ml-1" />
              </a>
            </div>
          </div>
        </div>

        {/* Individual Setup Instructions */}
        <div id="individual-setup" className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <UserGroupIcon className="h-8 w-8 text-blue-600 mr-3" />
            Individual Installation Steps
          </h2>
          
          <div className="space-y-6">
            <div className="flex">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Visit Google Workspace Marketplace</h3>
                <p className="text-gray-600 mb-3">
                  Go to the <a href="https://workspace.google.com/marketplace" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">Google Workspace Marketplace</a> and search for "Statement Desk".
                </p>
              </div>
            </div>

            <div className="flex">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Click Install</h3>
                <p className="text-gray-600 mb-3">
                  Click the "Install" button on the Statement Desk listing page. Choose "Individual Install" when prompted.
                </p>
              </div>
            </div>

            <div className="flex">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Grant Permissions</h3>
                <p className="text-gray-600 mb-3">
                  Review and accept the permissions. Statement Desk needs access to:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4">
                  <li>Google Drive (to access PDF files)</li>
                  <li>Google Sheets (to export processed data)</li>
                  <li>Basic profile information</li>
                </ul>
              </div>
            </div>

            <div className="flex">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Start Using Statement Desk</h3>
                <p className="text-gray-600 mb-3">
                  You'll be redirected to Statement Desk. You can now:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4">
                  <li>Upload PDF bank statements</li>
                  <li>Access files from Google Drive</li>
                  <li>Export to Google Sheets</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Domain Setup Instructions */}
        <div id="domain-setup" className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <CloudIcon className="h-8 w-8 text-purple-600 mr-3" />
            Domain-wide Installation Steps
          </h2>
          
          <div className="bg-amber-50 border-l-4 border-amber-400 p-6 mb-6">
            <p className="text-amber-800">
              <strong>Note:</strong> Domain-wide installation requires Google Workspace admin privileges.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Admin Console</h3>
                <p className="text-gray-600 mb-3">
                  Sign in to your <a href="https://admin.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">Google Admin Console</a> with your admin account.
                </p>
              </div>
            </div>

            <div className="flex">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Navigate to Marketplace Apps</h3>
                <p className="text-gray-600 mb-3">
                  Go to Apps → Google Workspace Marketplace apps → Click "Add app" and search for "Statement Desk".
                </p>
              </div>
            </div>

            <div className="flex">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose Installation Scope</h3>
                <p className="text-gray-600 mb-3">
                  Select whether to install for:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4">
                  <li>Entire organization</li>
                  <li>Specific organizational units</li>
                  <li>Selected groups</li>
                </ul>
              </div>
            </div>

            <div className="flex">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Configure Settings</h3>
                <p className="text-gray-600 mb-3">
                  Set up default permissions and access levels:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4">
                  <li>Data access permissions</li>
                  <li>Default user roles</li>
                  <li>Export restrictions</li>
                </ul>
              </div>
            </div>

            <div className="flex">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                5
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Complete Installation</h3>
                <p className="text-gray-600 mb-3">
                  Click "Install" and accept the terms. Users in your organization can now access Statement Desk from their Google Workspace apps.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Post-Installation */}
        <div className="bg-gray-50 rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <CogIcon className="h-8 w-8 text-gray-600 mr-3" />
            Post-Installation Configuration
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">For Individual Users</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Connect your bank accounts (optional)</li>
                <li>Set up automatic categorization rules</li>
                <li>Configure export preferences</li>
                <li>Enable AI insights (Premium feature)</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">For Domain Admins</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Set up billing and choose a plan</li>
                <li>Configure user permissions and roles</li>
                <li>Set data retention policies</li>
                <li>Enable audit logging</li>
                <li>Configure SSO (Enterprise only)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Security Note */}
        <div className="bg-blue-900 text-white rounded-lg p-8 mb-12">
          <div className="flex items-start">
            <ShieldCheckIcon className="h-8 w-8 mr-4 flex-shrink-0" />
            <div>
              <h2 className="text-2xl font-bold mb-3">Security & Privacy</h2>
              <p className="mb-4">
                Statement Desk follows Google's security best practices and never stores your financial data after processing.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                  <span>All data is encrypted in transit and at rest</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                  <span>OAuth 2.0 secure authentication</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Regular security audits and compliance checks</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                  <span>GDPR and SOC 2 compliant</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Next Steps</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/docs/user-guide"
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition inline-flex items-center"
            >
              User Guide <ArrowRightIcon className="h-4 w-4 ml-2" />
            </Link>
            <Link
              href="/docs/api"
              className="px-6 py-3 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition inline-flex items-center"
            >
              API Documentation <ArrowRightIcon className="h-4 w-4 ml-2" />
            </Link>
            <Link
              href="/support"
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition inline-flex items-center"
            >
              Get Support <ArrowRightIcon className="h-4 w-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}