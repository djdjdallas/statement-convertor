export const metadata = {
  title: 'Terms of Service - Statement Desk',
  description: 'Statement Desk Terms of Service and User Agreement',
  robots: {
    index: true,
    follow: true,
  }
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Terms of Service
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
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Agreement to Terms
              </h2>
              <p className="text-gray-700 mb-4">
                By accessing or using Statement Desk ("Service," "Platform," or "Application"), you ("User," "you," or "your") 
                agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, 
                you may not access the Service.
              </p>
              <p className="text-gray-700">
                These Terms constitute a legally binding agreement between you and Statement Desk, Inc. ("Company," "we," "us," or "our") 
                governing your use of our financial document processing and analytics service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Description of Service
              </h2>
              <p className="text-gray-700 mb-4">
                Statement Desk is a financial technology service that:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
                <li>Converts PDF bank statements to structured data formats (Excel, CSV, Google Sheets)</li>
                <li>Uses artificial intelligence (Claude AI) to categorize and analyze financial transactions</li>
                <li>Provides financial insights, analytics, and forecasting</li>
                <li>Offers conversational AI assistance for financial queries</li>
                <li>Integrates with Google Workspace for authentication and data export</li>
              </ul>
              <p className="text-gray-700">
                The Service is designed for personal and small business financial management and is not intended as 
                professional financial advice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Eligibility and Account Registration
              </h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-xl font-medium text-gray-900">Age Requirements</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>You must be at least 18 years old to use this Service</li>
                  <li>By using the Service, you represent that you meet this age requirement</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-900">Account Responsibilities</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                  <li>You agree to accept responsibility for all activities under your account</li>
                  <li>You must notify us immediately of any unauthorized use of your account</li>
                  <li>You may not use another person's account without permission</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Google Workspace Integration
              </h2>
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-2">OAuth and API Usage</h3>
                <ul className="list-disc pl-6 space-y-1 text-gray-700">
                  <li>Authentication is provided through Google OAuth 2.0</li>
                  <li>We adhere to Google API Services User Data Policy</li>
                  <li>You can revoke our access to your Google account at any time</li>
                  <li>We only access files and data you explicitly authorize</li>
                </ul>
                
                <h3 className="text-lg font-medium text-gray-900 mb-2 mt-4">Marketplace Terms</h3>
                <ul className="list-disc pl-6 space-y-1 text-gray-700">
                  <li>If installed via Google Workspace Marketplace, additional Google terms apply</li>
                  <li>Organization installations require admin consent</li>
                  <li>We comply with all Google Workspace developer policies</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Subscription and Billing
              </h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-xl font-medium text-gray-900">Subscription Tiers</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Free Tier</strong>: Limited processing (up to 5 files/month)</li>
                  <li><strong>Basic Tier</strong>: Enhanced features and higher limits</li>
                  <li><strong>Premium Tier</strong>: Unlimited processing and all features</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-900">Payment Terms</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Subscriptions are billed monthly or annually in advance</li>
                  <li>All fees are in USD unless otherwise stated</li>
                  <li>Payment processing is handled securely by Stripe</li>
                  <li>Prices are subject to change with 30 days notice</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-900">Refund Policy</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Monthly subscriptions: No refunds for partial months</li>
                  <li>Annual subscriptions: Pro-rated refund within 30 days of purchase</li>
                  <li>Refunds for technical issues evaluated case-by-case</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Acceptable Use Policy
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>You agree not to use the Service to:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Process documents you don't have legal rights to access</li>
                  <li>Upload malicious files or attempt to compromise our systems</li>
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe upon intellectual property rights</li>
                  <li>Harass, abuse, or harm other users</li>
                  <li>Engage in fraudulent or deceptive practices</li>
                  <li>Reverse engineer or attempt to extract our source code</li>
                  <li>Use the Service for illegal financial activities</li>
                </ul>
                
                <p className="mt-4">
                  We reserve the right to terminate accounts that violate these policies without notice.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Data Accuracy and Financial Disclaimer
              </h2>
              <div className="bg-yellow-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Important Disclaimers</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Not Financial Advice</strong>: Statement Desk provides data processing and analytics tools only. 
                      Nothing in the Service constitutes professional financial, investment, tax, or legal advice.</li>
                  <li><strong>Accuracy Limitations</strong>: While we strive for accuracy, AI and automated processing may 
                      contain errors. Always verify important financial data.</li>
                  <li><strong>User Responsibility</strong>: You are responsible for the accuracy of uploaded documents and 
                      for verifying all processed data before making financial decisions.</li>
                  <li><strong>Third-Party Data</strong>: We are not responsible for the accuracy of bank statements or other 
                      third-party financial documents.</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Intellectual Property Rights
              </h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-xl font-medium text-gray-900">Our Property</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>The Service, including its code, design, and content, is owned by Statement Desk, Inc.</li>
                  <li>Our trademarks, logos, and brand features may not be used without permission</li>
                  <li>All AI models and algorithms are proprietary technology</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-900">Your Content</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>You retain ownership of your financial data and documents</li>
                  <li>You grant us a limited license to process and analyze your data as necessary to provide the Service</li>
                  <li>We will not share your content except as described in our Privacy Policy</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Limitation of Liability
              </h2>
              <div className="space-y-4 text-gray-700">
                <p className="font-medium">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND</li>
                  <li>WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE</li>
                  <li>WE ARE NOT LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES</li>
                  <li>OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE PAST 12 MONTHS</li>
                  <li>WE ARE NOT LIABLE FOR SERVICE INTERRUPTIONS, DATA LOSS, OR SECURITY BREACHES BEYOND OUR REASONABLE CONTROL</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Indemnification
              </h2>
              <p className="text-gray-700">
                You agree to indemnify, defend, and hold harmless Statement Desk, Inc., its officers, directors, employees, 
                and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700 mt-2">
                <li>Your use or misuse of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any third-party rights</li>
                <li>Your financial decisions based on the Service's output</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Termination
              </h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-xl font-medium text-gray-900">By You</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>You may terminate your account at any time through account settings</li>
                  <li>Termination does not entitle you to refunds for unused subscription periods</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-900">By Us</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>We may terminate or suspend your account for Terms violations</li>
                  <li>We may discontinue the Service with 30 days notice</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-900">Effect of Termination</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Your right to use the Service ceases immediately</li>
                  <li>We may delete your data after 90 days unless legally required to retain it</li>
                  <li>Provisions that should survive termination will remain in effect</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Dispute Resolution
              </h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-xl font-medium text-gray-900">Arbitration Agreement</h3>
                <p>
                  Any disputes arising from these Terms or the Service shall be resolved through binding arbitration 
                  under the rules of the American Arbitration Association, except where prohibited by law.
                </p>

                <h3 className="text-xl font-medium text-gray-900">Class Action Waiver</h3>
                <p>
                  You agree to resolve disputes individually and waive any right to participate in class actions.
                </p>

                <h3 className="text-xl font-medium text-gray-900">Governing Law</h3>
                <p>
                  These Terms are governed by the laws of [Your State/Country] without regard to conflict of law principles.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Privacy and Security
              </h2>
              <p className="text-gray-700">
                Your use of the Service is subject to our Privacy Policy, which is incorporated by reference into these Terms. 
                By using Statement Desk, you acknowledge that you have read and understood our Privacy Policy and agree to its terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Changes to Terms
              </h2>
              <p className="text-gray-700">
                We reserve the right to modify these Terms at any time. Material changes will be notified via email or 
                in-app notification at least 30 days before taking effect. Continued use of the Service after changes 
                constitutes acceptance of the modified Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Miscellaneous
              </h2>
              <div className="space-y-4 text-gray-700">
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Entire Agreement</strong>: These Terms constitute the entire agreement between you and Statement Desk</li>
                  <li><strong>Severability</strong>: If any provision is found unenforceable, the remaining provisions continue in effect</li>
                  <li><strong>Waiver</strong>: Failure to enforce any right or provision does not constitute a waiver</li>
                  <li><strong>Assignment</strong>: You may not assign your rights without our written consent</li>
                  <li><strong>Force Majeure</strong>: We are not liable for failures due to circumstances beyond our reasonable control</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Contact Information
              </h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-2">
                  For questions about these Terms of Service:
                </p>
                <ul className="space-y-1 text-gray-700">
                  <li><strong>Email</strong>: legal@statementdesk.com</li>
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