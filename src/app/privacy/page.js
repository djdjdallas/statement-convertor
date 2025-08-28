export const metadata = {
  title: 'Privacy Policy - Statement Desk',
  description: 'Statement Desk Privacy Policy and Data Protection Information',
  robots: {
    index: true,
    follow: true,
  }
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Privacy Policy
          </h1>
          <p className="text-gray-600">
            Effective Date: January 28, 2025
          </p>
          <p className="text-gray-600">
            Last Updated: January 28, 2025
          </p>
        </div>
        
        <div className="prose prose-lg max-w-none">
          <div className="space-y-8">
            <section>
              <p className="text-gray-700 mb-4">
                Statement Desk ("we," "our," or "us") is committed to protecting your privacy and ensuring the security of your personal and financial information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
              </p>
              <p className="text-gray-700">
                By using Statement Desk, you agree to the collection and use of information in accordance with this policy. If you do not agree with the terms of this Privacy Policy, please do not use our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Information We Collect
              </h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-xl font-medium text-gray-900">Personal Information</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Google Account Data</strong>: When you sign in with Google OAuth, we collect your name, email address, and profile picture</li>
                  <li><strong>Contact Information</strong>: Email address for account management, support, and service-related communications</li>
                  <li><strong>Usage Data</strong>: Information about how you interact with our service, including features used, processing history, and error logs</li>
                  <li><strong>Device Information</strong>: Browser type, IP address, device type, and operating system for security and service optimization</li>
                </ul>
                
                <h3 className="text-xl font-medium text-gray-900">Financial Data</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Bank Statements</strong>: PDF files containing transaction history that you explicitly upload or select from Google Drive</li>
                  <li><strong>Transaction Data</strong>: Transaction dates, amounts, descriptions, merchant names, and categories extracted from your statements</li>
                  <li><strong>Account Information</strong>: Bank names and partial account numbers (last 4 digits only) for identification purposes</li>
                  <li><strong>Financial Insights</strong>: Generated budgets, forecasts, spending patterns, and AI-powered analytics based on your transaction data</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-900">Google Workspace Data</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Google Drive Access</strong>: Read-only access to PDF files you explicitly select for processing</li>
                  <li><strong>Google Sheets Access</strong>: Read and write permissions to create and update spreadsheets for data export</li>
                  <li><strong>Authentication Tokens</strong>: Encrypted OAuth tokens for maintaining secure access to Google services</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                How We Use Your Information
              </h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-xl font-medium text-gray-900">Primary Uses</h3>
                <ol className="list-decimal pl-6 space-y-2">
                  <li><strong>Process Bank Statements</strong>: Extract and analyze transaction data from PDF files using AI and traditional parsing methods</li>
                  <li><strong>Provide AI Services</strong>: Use Claude AI to categorize transactions, detect anomalies, and generate financial insights</li>
                  <li><strong>Export Data</strong>: Create and populate Google Sheets or other formats with your processed transaction data</li>
                  <li><strong>Generate Analytics</strong>: Create cash flow forecasts, budget recommendations, and spending trend analyses</li>
                  <li><strong>Enable Chat Features</strong>: Provide conversational AI assistance for financial queries about your data</li>
                  <li><strong>Account Management</strong>: Manage your subscription, authentication, and service preferences</li>
                </ol>

                <h3 className="text-xl font-medium text-gray-900">Secondary Uses</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Service Improvement</strong>: Analyze usage patterns to improve features and user experience</li>
                  <li><strong>Security Monitoring</strong>: Detect and prevent fraudulent activity or unauthorized access</li>
                  <li><strong>Customer Support</strong>: Respond to inquiries and provide technical assistance</li>
                  <li><strong>Legal Compliance</strong>: Meet regulatory requirements and respond to legal requests</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Google API Services User Data Policy
              </h2>
              <div className="bg-blue-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-4">
                  Statement Desk's use and transfer of information received from Google APIs adheres to the{' '}
                  <a 
                    href="https://developers.google.com/terms/api-services-user-data-policy"
                    className="text-blue-600 hover:text-blue-800 underline"
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Google API Services User Data Policy
                  </a>, including the Limited Use requirements.
                </p>
                
                <h3 className="text-lg font-medium text-gray-900 mb-2">Specific Google Permissions Used:</h3>
                <ul className="list-disc pl-6 space-y-1 text-gray-700">
                  <li><strong>Google Drive (read-only)</strong>: Access PDF files you explicitly select for processing</li>
                  <li><strong>Google Sheets (read/write)</strong>: Create and update spreadsheets for data export</li>
                  <li><strong>Google Auth</strong>: Authenticate and maintain your secure session</li>
                </ul>

                <h3 className="text-lg font-medium text-gray-900 mb-2 mt-4">Limited Use Disclosure:</h3>
                <p className="text-gray-700">
                  We limit our use of Google user data to providing the core functionality of Statement Desk. We do not:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-gray-700 mt-2">
                  <li>Transfer your Google data to third parties except as necessary to provide our service (e.g., Claude AI for processing)</li>
                  <li>Use your Google data for advertising purposes</li>
                  <li>Allow humans to read your data unless you explicitly request support</li>
                  <li>Access files beyond those you explicitly select</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Data Sharing and Disclosure
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>We do not sell, trade, or rent your personal information. We may share your information only in the following circumstances:</p>
                
                <h3 className="text-xl font-medium text-gray-900">Service Providers</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Anthropic (Claude AI)</strong>: For AI-powered transaction processing and insights generation</li>
                  <li><strong>Supabase</strong>: For secure database storage and authentication</li>
                  <li><strong>Stripe</strong>: For payment processing (they receive only payment information, not financial statement data)</li>
                  <li><strong>Google Cloud Platform</strong>: For infrastructure and OAuth services</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-900">Legal Requirements</h3>
                <p>We may disclose your information if required by law, court order, or government regulation, or if we believe disclosure is necessary to:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Comply with legal obligations</li>
                  <li>Protect and defend our rights or property</li>
                  <li>Prevent fraud or illegal activity</li>
                  <li>Protect the safety of users or the public</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Data Security
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>We implement industry-standard security measures to protect your data:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Encryption</strong>: All data is encrypted in transit (TLS 1.2+) and at rest (AES-256)</li>
                  <li><strong>Access Controls</strong>: Role-based access control and multi-factor authentication</li>
                  <li><strong>Regular Audits</strong>: Security assessments and vulnerability testing</li>
                  <li><strong>Secure Infrastructure</strong>: SOC 2 compliant cloud infrastructure</li>
                  <li><strong>Employee Training</strong>: Regular security awareness training for all team members</li>
                  <li><strong>Incident Response</strong>: 24-hour breach notification policy</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Data Retention
              </h2>
              <div className="space-y-4 text-gray-700">
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Active Accounts</strong>: We retain your data as long as your account is active</li>
                  <li><strong>Financial Records</strong>: Transaction data is retained for 7 years to comply with financial regulations</li>
                  <li><strong>Deleted Accounts</strong>: Personal data is deleted within 90 days of account closure, except where retention is required by law</li>
                  <li><strong>Aggregated Data</strong>: We may retain anonymized, aggregated data indefinitely for analytics</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Your Rights and Choices
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>You have the following rights regarding your personal information:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Access</strong>: Request a copy of your personal data</li>
                  <li><strong>Correction</strong>: Update or correct inaccurate information</li>
                  <li><strong>Deletion</strong>: Request deletion of your account and associated data</li>
                  <li><strong>Data Portability</strong>: Export your transaction data in standard formats</li>
                  <li><strong>Opt-out</strong>: Unsubscribe from marketing communications</li>
                  <li><strong>Revoke Consent</strong>: Disconnect Google account access at any time</li>
                </ul>
                
                <p className="mt-4">To exercise these rights, contact us at privacy@statementdesk.com</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                International Data Transfers
              </h2>
              <p className="text-gray-700">
                Your information may be transferred to and processed in the United States where our servers are located. 
                We ensure appropriate safeguards are in place for international transfers in compliance with applicable laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Children's Privacy
              </h2>
              <p className="text-gray-700">
                Statement Desk is not intended for use by individuals under 18 years of age. We do not knowingly collect 
                personal information from children. If you believe we have collected information from a child, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                California Privacy Rights
              </h2>
              <p className="text-gray-700">
                California residents have additional rights under the California Consumer Privacy Act (CCPA), including the right 
                to know about personal information collected, the right to delete personal information, and the right to opt-out 
                of the sale of personal information. We do not sell personal information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Updates to This Policy
              </h2>
              <p className="text-gray-700">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting 
                the new Privacy Policy on this page and updating the "Last Updated" date. For significant changes, we will 
                provide additional notice via email or in-app notification.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Contact Information
              </h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-2">
                  For privacy questions, concerns, or to exercise your rights:
                </p>
                <ul className="space-y-1 text-gray-700">
                  <li><strong>Email</strong>: privacy@statementdesk.com</li>
                  <li><strong>Support</strong>: support@statementdesk.com</li>
                  <li><strong>Website</strong>: https://statementdesk.com</li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}