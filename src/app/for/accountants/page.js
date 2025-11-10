import Link from 'next/link';
import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';
import CTASection from '@/components/blog/CTASection';
import ComparisonTable from '@/components/blog/ComparisonTable';
import FAQSection from '@/components/blog/FAQSection';
import ProConsList from '@/components/blog/ProConsList';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Clock,
  DollarSign,
  Users,
  CheckCircle2,
  TrendingUp,
  FileSpreadsheet,
  Zap,
  Shield,
  BarChart3,
  Target,
  Award,
  Building2,
  X
} from 'lucide-react';

export const metadata = {
  title: 'Bank Statement Converter for Accountants | Save 10-20 Hours/Month',
  description: 'Bank statement converter built for accountants. Process multiple clients 10x faster with 90%+ accuracy. Save 10-20 hours per accountant monthly.',
  keywords: 'bank statement converter for accountants, accounting software, bank statement to excel, QuickBooks integration, automated bookkeeping, CPA tools, tax preparation software',
  openGraph: {
    title: 'Bank Statement Converter for Accountants | Save 10-20 Hours/Month',
    description: 'Bank statement converter built for accountants. Process multiple clients 10x faster with 90%+ accuracy. Save 10-20 hours per accountant monthly.',
    url: 'https://statementdesk.com/for/accountants',
    siteName: 'Statement Desk',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bank Statement Converter for Accountants | Save 10-20 Hours/Month',
    description: 'Bank statement converter built for accountants. Process multiple clients 10x faster with 90%+ accuracy.',
  },
  alternates: {
    canonical: 'https://statementdesk.com/for/accountants',
  },
};

export default function AccountantsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 text-white overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full opacity-20 blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400 rounded-full opacity-20 blur-2xl translate-y-1/2 -translate-x-1/2"></div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
            <div className="text-center max-w-4xl mx-auto">
              {/* Badge */}
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/30 backdrop-blur-sm border border-blue-400/30 text-sm font-medium mb-8">
                <Award className="h-4 w-4 mr-2" />
                Trusted by 200+ Accountants
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                The Bank Statement Converter Built for Accountants
              </h1>

              <p className="text-xl md:text-2xl text-blue-100 mb-4">
                Save 10-20 hours monthly processing client statements
              </p>

              <p className="text-lg text-blue-200 mb-10 max-w-3xl mx-auto">
                Eliminate manual data entry, process multiple clients 10x faster with AI-powered accuracy, and focus on what you do best—advising clients and growing your practice.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-blue-50 shadow-xl text-lg px-8 py-6 h-auto font-semibold"
                >
                  <Link href="/auth/signup">Start Free Trial</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6 h-auto font-semibold"
                >
                  <Link href="#demo">Book a Demo</Link>
                </Button>
              </div>

              {/* Trust signals */}
              <div className="flex flex-wrap justify-center gap-8 text-sm">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  <span><strong className="font-semibold">4.9/5</strong> rating</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  <span><strong className="font-semibold">99%</strong> accuracy</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  <span><strong className="font-semibold">30 sec</strong> processing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  <span><strong className="font-semibold">200+</strong> banks supported</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Challenges Accountants Face Section */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why Accountants Struggle with Bank Statements
              </h2>
              <p className="text-xl text-gray-600">
                Manual data entry is the hidden time-killer in every accounting practice. Here's what our clients told us before switching to Statement Desk:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Challenge 1 */}
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Time-Consuming Manual Entry
                </h3>
                <p className="text-gray-600">
                  Spending 2-3 hours per client statement manually typing transactions into Excel or QuickBooks. With 20+ clients, that's 40-60 hours monthly just on data entry alone.
                </p>
              </Card>

              {/* Challenge 2 */}
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Tax Season Crunch
                </h3>
                <p className="text-gray-600">
                  Processing 100+ bank statements during tax season while trying to meet deadlines. The rush leads to errors, late nights, and burned-out staff members who could be doing higher-value work.
                </p>
              </Card>

              {/* Challenge 3 */}
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                  <DollarSign className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Client Billing Accuracy
                </h3>
                <p className="text-gray-600">
                  Need precise transaction records for client billing and audits. Manual entry errors can damage client relationships and your firm's reputation. Even small mistakes add up.
                </p>
              </Card>

              {/* Challenge 4 */}
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <FileSpreadsheet className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Multiple Bank Formats
                </h3>
                <p className="text-gray-600">
                  Every client uses a different bank with different PDF formats. Chase, Wells Fargo, local credit unions—each requires a different approach. You can't standardize the process.
                </p>
              </Card>

              {/* Challenge 5 */}
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Scanned Legacy Statements
                </h3>
                <p className="text-gray-600">
                  Older clients bring scanned or photocopied statements that are nearly impossible to process with standard tools. These require even more manual work and time.
                </p>
              </Card>

              {/* Challenge 6 */}
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  End-of-Month Rush
                </h3>
                <p className="text-gray-600">
                  All clients send statements at month-end, creating bottlenecks. Your team scrambles to process everything on time while maintaining quality and accuracy standards.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* How Statement Desk Helps Section */}
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                How Statement Desk Transforms Your Accounting Practice
              </h2>
              <p className="text-xl text-gray-600">
                Built specifically for accountants, bookkeepers, and CPAs who need to process multiple client statements efficiently and accurately.
              </p>
            </div>

            {/* Batch Processing */}
            <div className="mb-16">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-4">
                    <Zap className="h-4 w-4 mr-2" />
                    Most Popular Feature
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">
                    Batch Processing for Multiple Clients
                  </h3>
                  <p className="text-lg text-gray-700 mb-6">
                    Upload and process 10-50 bank statements at once—perfect for accounting firms managing dozens of clients. Instead of processing each statement individually, handle your entire client roster in one efficient session.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">
                        <strong className="font-semibold">Drag-and-drop bulk upload:</strong> Drop 50 PDFs at once and let AI do the work
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">
                        <strong className="font-semibold">Client folder organization:</strong> Automatically sort by client name for easy tracking
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">
                        <strong className="font-semibold">Batch export:</strong> Download all converted files at once in Excel, CSV, or JSON format
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">
                        <strong className="font-semibold">Progress tracking:</strong> Monitor processing status for each client in real-time
                      </span>
                    </li>
                  </ul>
                </div>

                <Card className="p-8 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <h4 className="text-xl font-semibold text-gray-900 mb-6">
                    Real-World Example: Tax Season Workflow
                  </h4>
                  <div className="space-y-4 text-gray-700">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-semibold">
                        1
                      </div>
                      <div>
                        <strong>Monday 9 AM:</strong> Receive 45 bank statements from clients via email
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-semibold">
                        2
                      </div>
                      <div>
                        <strong>Monday 9:15 AM:</strong> Upload all 45 PDFs to Statement Desk batch processor
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-semibold">
                        3
                      </div>
                      <div>
                        <strong>Monday 9:45 AM:</strong> Review AI-categorized transactions (5 minutes per client)
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-semibold">
                        4
                      </div>
                      <div>
                        <strong>Monday 1:00 PM:</strong> Export all 45 Excel files, import to QuickBooks
                      </div>
                    </div>
                    <div className="mt-6 p-4 bg-green-100 rounded-lg border border-green-300">
                      <p className="font-semibold text-green-900">
                        Time saved: 90 hours → 4 hours (95% reduction)
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* ROI Calculator */}
            <div className="mb-16 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 md:p-12 border border-green-200">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">
                    Calculate Your Time Savings ROI
                  </h3>
                  <p className="text-lg text-gray-700">
                    See exactly how much time and money your accounting firm will save with Statement Desk
                  </p>
                </div>

                <Card className="p-6 md:p-8 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Inputs */}
                    <div className="space-y-6">
                      <h4 className="font-semibold text-gray-900 text-lg mb-4">Your Practice Stats:</h4>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Number of clients
                        </label>
                        <div className="text-3xl font-bold text-blue-600">20</div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Statements per client/month
                        </label>
                        <div className="text-3xl font-bold text-blue-600">3</div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Your billable rate
                        </label>
                        <div className="text-3xl font-bold text-blue-600">$75/hr</div>
                      </div>
                    </div>

                    {/* Results */}
                    <div className="space-y-6">
                      <h4 className="font-semibold text-gray-900 text-lg mb-4">Your Savings:</h4>

                      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <div className="text-sm text-gray-600 mb-1">Manual processing time</div>
                        <div className="text-2xl font-bold text-red-600">150 hours/month</div>
                        <div className="text-xs text-gray-500 mt-1">60 statements × 2.5 hrs each</div>
                      </div>

                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-sm text-gray-600 mb-1">With Statement Desk</div>
                        <div className="text-2xl font-bold text-blue-600">5 hours/month</div>
                        <div className="text-xs text-gray-500 mt-1">60 statements × 5 min review each</div>
                      </div>

                      <div className="p-6 bg-gradient-to-br from-green-500 to-green-600 rounded-lg text-white">
                        <div className="text-sm opacity-90 mb-1">Total monthly savings</div>
                        <div className="text-4xl font-bold">145 hours</div>
                        <div className="text-lg mt-2 opacity-90">= $10,875 value/month</div>
                        <div className="text-sm opacity-75 mt-1">Annual value: $130,500</div>
                      </div>

                      <p className="text-sm text-gray-600 italic">
                        Example based on average accounting firm. Your actual savings may vary.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Accuracy for Client Billing */}
            <div className="mb-16">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <Card className="p-8 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 order-2 lg:order-1">
                  <h4 className="text-xl font-semibold text-gray-900 mb-6">
                    AI Accuracy Features
                  </h4>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <div className="h-6 w-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">99%</span>
                      </div>
                      <div>
                        <strong className="text-gray-900">Transaction extraction accuracy</strong>
                        <p className="text-sm text-gray-600 mt-1">
                          AI-powered extraction matches human-level precision
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="h-6 w-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <strong className="text-gray-900">Confidence scoring</strong>
                        <p className="text-sm text-gray-600 mt-1">
                          Each transaction tagged with confidence level for easy review
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="h-6 w-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <strong className="text-gray-900">Duplicate detection</strong>
                        <p className="text-sm text-gray-600 mt-1">
                          Automatically identifies duplicate transactions across statements
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="h-6 w-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <strong className="text-gray-900">Complete audit trail</strong>
                        <p className="text-sm text-gray-600 mt-1">
                          AI reasoning recorded for compliance and client questions
                        </p>
                      </div>
                    </li>
                  </ul>
                </Card>

                <div className="order-1 lg:order-2">
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-100 text-purple-800 text-sm font-medium mb-4">
                    <Shield className="h-4 w-4 mr-2" />
                    Audit-Ready Accuracy
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">
                    Precision Matters for Client Billing
                  </h3>
                  <p className="text-lg text-gray-700 mb-6">
                    Your reputation depends on accuracy. Statement Desk delivers 99%+ extraction precision with built-in verification tools to ensure every transaction is captured correctly for client billing and audit purposes.
                  </p>
                  <blockquote className="border-l-4 border-purple-600 pl-6 py-2 mb-6">
                    <p className="text-gray-700 italic mb-2">
                      "We used to find 5-10 errors per statement with manual entry. With Statement Desk, we're down to maybe 1 error per 50 statements. The confidence scores make review incredibly efficient."
                    </p>
                    <footer className="text-sm text-gray-600">
                      — Michael Chen, CPA, Tax & Accounting Partners
                    </footer>
                  </blockquote>
                </div>
              </div>
            </div>

            {/* Client Reporting Features */}
            <div className="mb-16">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium mb-4">
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Client-Ready Reports
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">
                    Professional Client Reports in Minutes
                  </h3>
                  <p className="text-lg text-gray-700 mb-6">
                    Generate polished, branded financial reports that clients actually understand. Move beyond raw spreadsheets to deliver insights that demonstrate your value as a trusted advisor.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">
                        <strong className="font-semibold">Branded export templates:</strong> Add your firm's logo and custom formatting
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">
                        <strong className="font-semibold">Automated categorization:</strong> Expenses pre-sorted into tax categories
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">
                        <strong className="font-semibold">Cash flow summaries:</strong> Visual dashboards showing income, expenses, trends
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">
                        <strong className="font-semibold">Budget vs actual reports:</strong> Compare spending against client budgets
                      </span>
                    </li>
                  </ul>
                </div>

                <Card className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
                  <h4 className="text-xl font-semibold text-gray-900 mb-4">
                    Sample Client Report Includes:
                  </h4>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 p-3 bg-white rounded border">
                      <div className="h-10 w-10 bg-blue-100 rounded flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                      </div>
                      <span className="text-gray-700">Monthly income & expense summary</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white rounded border">
                      <div className="h-10 w-10 bg-green-100 rounded flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      </div>
                      <span className="text-gray-700">Category breakdown with trends</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white rounded border">
                      <div className="h-10 w-10 bg-purple-100 rounded flex items-center justify-center">
                        <Target className="h-5 w-5 text-purple-600" />
                      </div>
                      <span className="text-gray-700">Top merchants and spending patterns</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white rounded border">
                      <div className="h-10 w-10 bg-orange-100 rounded flex items-center justify-center">
                        <FileSpreadsheet className="h-5 w-5 text-orange-600" />
                      </div>
                      <span className="text-gray-700">Detailed transaction ledger (Excel/CSV)</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    All reports ready for client review meetings or year-end tax preparation
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section 1 */}
        <CTASection
          variant="inline"
          title="Ready to Reclaim 10-20 Hours Per Month?"
          description="Join 200+ accountants who've eliminated manual data entry from their workflow. Start your 14-day free trial—no credit card required."
          buttonText="Start Free Trial"
          buttonLink="/auth/signup"
        />

        {/* Accountant-Specific Features */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Features Built Specifically for Accounting Firms
              </h2>
              <p className="text-xl text-gray-600">
                We designed Statement Desk for the unique needs of CPAs, bookkeepers, and accounting professionals
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <Card className="p-6 hover:shadow-lg transition-shadow bg-white">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Multi-Client Management Dashboard
                </h3>
                <p className="text-gray-600">
                  Organize all clients in one place. Track processing status, view history, and manage permissions. Switch between clients effortlessly without losing context.
                </p>
              </Card>

              {/* Feature 2 */}
              <Card className="p-6 hover:shadow-lg transition-shadow bg-white">
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <FileSpreadsheet className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Batch Export All Clients
                </h3>
                <p className="text-gray-600">
                  Download converted files for all clients at once. Export to Excel, CSV, or JSON. Perfect for month-end processing or quarterly reviews.
                </p>
              </Card>

              {/* Feature 3 */}
              <Card className="p-6 hover:shadow-lg transition-shadow bg-white">
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  QuickBooks & Xero Integration
                </h3>
                <p className="text-gray-600">
                  Direct integration with QuickBooks Online and Xero. Push converted transactions straight into client books without manual import steps.
                </p>
              </Card>

              {/* Feature 4 */}
              <Card className="p-6 hover:shadow-lg transition-shadow bg-white">
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Custom Categorization Rules
                </h3>
                <p className="text-gray-600">
                  Create categorization rules once, apply to all clients. Build a library of merchant rules that improve accuracy over time. Reusable across your practice.
                </p>
              </Card>

              {/* Feature 5 */}
              <Card className="p-6 hover:shadow-lg transition-shadow bg-white">
                <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Team Collaboration & Permissions
                </h3>
                <p className="text-gray-600">
                  Add team members with role-based permissions. Junior staff can process statements, senior accountants review, partners approve. Full audit trail of who did what.
                </p>
              </Card>

              {/* Feature 6 */}
              <Card className="p-6 hover:shadow-lg transition-shadow bg-white">
                <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Client Permission System
                </h3>
                <p className="text-gray-600">
                  Give clients view-only access to their converted statements. They can download their own files without needing your help. Reduces admin overhead.
                </p>
              </Card>

              {/* Feature 7 */}
              <Card className="p-6 hover:shadow-lg transition-shadow bg-white">
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Complete Audit Logs & History
                </h3>
                <p className="text-gray-600">
                  Full history of all processed statements, exports, and edits. Track who processed what and when. Essential for compliance and client billing documentation.
                </p>
              </Card>

              {/* Feature 8 */}
              <Card className="p-6 hover:shadow-lg transition-shadow bg-white">
                <div className="h-12 w-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                  <Award className="h-6 w-6 text-pink-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Priority Email + Chat Support
                </h3>
                <p className="text-gray-600">
                  Direct access to our support team via email and live chat. Typical response time under 2 hours during business hours. We understand tax deadlines.
                </p>
              </Card>

              {/* Feature 9 */}
              <Card className="p-6 hover:shadow-lg transition-shadow bg-white border-2 border-blue-600">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium mb-3">
                  Enterprise Only
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Dedicated Account Manager
                </h3>
                <p className="text-gray-600">
                  For larger firms (10+ accountants), get a dedicated account manager who understands your workflows, helps with onboarding, and provides strategic guidance.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-16 md:py-24 bg-white" id="pricing">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Pricing Built for Accounting Firms
              </h2>
              <p className="text-xl text-gray-600">
                From solo practitioners to large firms—choose the plan that fits your practice
              </p>
            </div>

            {/* Pricing Comparison Table */}
            <ComparisonTable
              headers={['', 'Professional', 'Business', 'Enterprise']}
              rows={[
                ['Price', '$19/month', '$49/month', 'Custom pricing'],
                ['Statements per month', 'Unlimited', 'Unlimited', 'Unlimited'],
                ['Team members', '1 user', '5 users', 'Unlimited users'],
                ['Client accounts', '50 clients', 'Unlimited clients', 'Unlimited clients'],
                ['QuickBooks/Xero integration', true, true, true],
                ['Batch processing', true, true, true],
                ['Custom categorization rules', true, true, true],
                ['Client permissions', false, true, true],
                ['Team collaboration', false, true, true],
                ['Priority support', false, true, true],
                ['Dedicated account manager', false, false, true],
                ['API access', false, false, true],
                ['Custom integrations', false, false, true],
                ['White-label branding', false, false, true],
              ]}
              highlightColumn={2}
              caption="Statement Desk pricing plans for accountants"
            />

            {/* Cost Savings Calculation */}
            <div className="mt-16 max-w-4xl mx-auto">
              <Card className="p-8 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                  ROI Breakdown: Why Statement Desk Pays for Itself
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Manual/VA Cost */}
                  <div className="bg-white rounded-lg p-6 border-2 border-red-200">
                    <h4 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
                      <X className="h-5 w-5" />
                      Traditional Approach (Manual or VA)
                    </h4>
                    <div className="space-y-3 text-gray-700">
                      <div className="flex justify-between">
                        <span>Virtual assistant at $15/hr</span>
                        <span className="font-semibold">$15/hr</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Hours needed monthly</span>
                        <span className="font-semibold">160 hrs</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span className="text-xs">20 clients × 2 hrs per statement × 4 weeks</span>
                      </div>
                      <div className="pt-3 border-t border-red-200 flex justify-between text-lg font-bold text-red-600">
                        <span>Monthly cost:</span>
                        <span>$2,400</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Annual cost:</span>
                        <span className="font-semibold">$28,800</span>
                      </div>
                    </div>
                  </div>

                  {/* Statement Desk Cost */}
                  <div className="bg-white rounded-lg p-6 border-2 border-green-600">
                    <h4 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      Statement Desk (Business Plan)
                    </h4>
                    <div className="space-y-3 text-gray-700">
                      <div className="flex justify-between">
                        <span>Business plan</span>
                        <span className="font-semibold">$49/mo</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Time needed monthly</span>
                        <span className="font-semibold">5 hrs</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span className="text-xs">5 min review × 60 statements</span>
                      </div>
                      <div className="pt-3 border-t border-green-200 flex justify-between text-lg font-bold text-green-600">
                        <span>Monthly cost:</span>
                        <span>$49</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Annual cost:</span>
                        <span className="font-semibold">$588</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Savings Highlight */}
                <div className="mt-8 p-6 bg-gradient-to-br from-green-600 to-green-700 rounded-lg text-white text-center">
                  <div className="text-sm uppercase tracking-wide opacity-90 mb-2">Your Total Savings</div>
                  <div className="text-5xl font-bold mb-2">$2,351/month</div>
                  <div className="text-xl opacity-90 mb-4">= $28,212 saved per year</div>
                  <div className="text-sm opacity-75">
                    That's a 4,800% ROI on your Statement Desk subscription
                  </div>
                </div>
              </Card>
            </div>

            {/* Special Offer */}
            <div className="mt-12 text-center">
              <Card className="inline-block p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300">
                <div className="flex items-center gap-3">
                  <Award className="h-8 w-8 text-blue-600" />
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">Special Offer for Accounting Firms</div>
                    <div className="text-gray-700">20% discount for firms with 5+ team members</div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section 2 */}
        <CTASection
          variant="primary"
          title="Join 200+ Accountants Who've Eliminated Manual Data Entry"
          description="Start your 14-day free trial. Process your first 20 statements free. See the time savings yourself."
          buttonText="Start Free Trial"
          buttonLink="/auth/signup"
          badge="No Credit Card Required"
        />

        {/* Case Studies Section */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Real Results from Real Accountants
              </h2>
              <p className="text-xl text-gray-600">
                See how accounting professionals are saving 10-20 hours monthly with Statement Desk
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Case Study 1: Solo CPA */}
              <Card className="p-8 hover:shadow-xl transition-shadow bg-white">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600">
                    SK
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Sarah K., CPA</div>
                    <div className="text-sm text-gray-600">Solo Practitioner</div>
                    <div className="flex gap-0.5 mt-1">
                      {[1,2,3,4,5].map(i => (
                        <span key={i} className="text-yellow-500">⭐</span>
                      ))}
                    </div>
                  </div>
                </div>

                <blockquote className="text-gray-700 mb-6 italic">
                  "Before Statement Desk, I spent 15 hours weekly on manual data entry during tax season. Now it's less than 2 hours. The AI categorization is incredibly accurate—usually 95%+ correct. I've been able to take on 5 more clients without hiring help."
                </blockquote>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Firm size:</span>
                    <span className="font-semibold text-gray-900">Solo practitioner</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Clients served:</span>
                    <span className="font-semibold text-gray-900">25 clients</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time saved:</span>
                    <span className="font-semibold text-green-600">13 hrs/week</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t">
                    <span className="text-gray-600">Monthly ROI:</span>
                    <span className="font-bold text-green-600">$1,300</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Based on $25/hr billable rate
                  </div>
                </div>
              </Card>

              {/* Case Study 2: Mid-size Firm */}
              <Card className="p-8 hover:shadow-xl transition-shadow bg-white border-2 border-blue-600">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium mb-4">
                  Featured Success Story
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center text-2xl font-bold text-green-600">
                    MT
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Mike T.</div>
                    <div className="text-sm text-gray-600">Accounting Firm Partner</div>
                    <div className="flex gap-0.5 mt-1">
                      {[1,2,3,4,5].map(i => (
                        <span key={i} className="text-yellow-500">⭐</span>
                      ))}
                    </div>
                  </div>
                </div>

                <blockquote className="text-gray-700 mb-6 italic">
                  "We process 200+ bank statements monthly across 60 clients. Statement Desk reduced our bookkeeping costs by 40% and improved accuracy. The batch processing feature is a game-changer. Our team can focus on advisory services instead of data entry."
                </blockquote>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Firm size:</span>
                    <span className="font-semibold text-gray-900">8 accountants</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Clients served:</span>
                    <span className="font-semibold text-gray-900">60 clients</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time saved:</span>
                    <span className="font-semibold text-green-600">160 hrs/month</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t">
                    <span className="text-gray-600">Monthly ROI:</span>
                    <span className="font-bold text-green-600">$8,000</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Team-wide savings calculation
                  </div>
                </div>
              </Card>

              {/* Case Study 3: Tax Specialist */}
              <Card className="p-8 hover:shadow-xl transition-shadow bg-white">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center text-2xl font-bold text-purple-600">
                    JL
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Jennifer L., CPA</div>
                    <div className="text-sm text-gray-600">Tax Specialist</div>
                    <div className="flex gap-0.5 mt-1">
                      {[1,2,3,4,5].map(i => (
                        <span key={i} className="text-yellow-500">⭐</span>
                      ))}
                    </div>
                  </div>
                </div>

                <blockquote className="text-gray-700 mb-6 italic">
                  "Tax season used to be overwhelming with statement processing. Statement Desk lets me handle the entire workload in a fraction of the time. The QuickBooks integration is seamless. I can now serve 40% more clients during tax season."
                </blockquote>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Specialization:</span>
                    <span className="font-semibold text-gray-900">Tax preparation</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Seasonal workload:</span>
                    <span className="font-semibold text-gray-900">100 statements (Q1)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time saved:</span>
                    <span className="font-semibold text-green-600">250 hrs/season</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t">
                    <span className="text-gray-600">Client capacity:</span>
                    <span className="font-bold text-green-600">+40%</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Able to serve 14 more clients per year
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Manual vs Automated Comparison */}
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Manual Entry vs AI-Powered Automation
              </h2>
              <p className="text-xl text-gray-600">
                See the dramatic difference automation makes for accounting practices
              </p>
            </div>

            <ComparisonTable
              headers={['Metric', 'Manual Entry / VA', 'Statement Desk']}
              rows={[
                ['Time per statement', '2-3 hours', '5 min review'],
                ['Cost per statement', '$30-45 (at $15/hr)', '$0.82 (at $49/mo plan)'],
                ['Accuracy rate', '75-85%', '99%+'],
                ['Human errors', 'Common (typos, missed transactions)', 'Rare (AI-verified)'],
                ['Scalability', 'Limited by hours available', 'Process 50+ statements at once'],
                ['Client capacity', '15-20 clients max', '50+ clients easily'],
                ['Training required', 'High (teach each VA)', 'None (AI learns automatically)'],
                ['Categorization', 'Fully manual', 'Automatic with 90%+ accuracy'],
                ['Duplicate detection', 'Manual review', 'Automatic across all statements'],
                ['QuickBooks integration', 'Manual CSV import', 'Direct push to books'],
                ['Team collaboration', 'Email/spreadsheets', 'Built-in workspace'],
                ['Audit trail', 'None or manual logs', 'Automatic with AI reasoning'],
              ]}
              highlightColumn={2}
              caption="Comparison of manual bank statement entry vs Statement Desk automation"
            />

            {/* Pros/Cons Visual */}
            <div className="mt-16">
              <ProConsList
                title="The Reality of Manual Statement Processing"
                pros={[
                  'No subscription cost (but high labor cost)',
                  'Complete control over every entry',
                  'Can handle unusual edge cases',
                ]}
                cons={[
                  'Extremely time-consuming (2-3 hours per statement)',
                  'High error rate (75-85% accuracy typical)',
                  'Doesn\'t scale (limited by hours in a day)',
                  'Staff burnout during busy seasons',
                  'Training overhead for new hires',
                  'No automated duplicate detection',
                  'Can\'t handle high-volume periods (tax season)',
                  'Expensive at scale ($2,400+/month for VA)',
                ]}
              />
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <FAQSection
              title="Frequently Asked Questions from Accountants"
              faqs={[
                {
                  id: 'time-savings',
                  question: 'How much time will I save with Statement Desk?',
                  answer: 'Most accountants save 10-20 hours per month. Solo practitioners typically save 13+ hours weekly during tax season, while firms with multiple accountants save 100+ hours monthly team-wide. The exact savings depend on your client volume, but on average, Statement Desk reduces statement processing time by 95%—from 2-3 hours per statement to just 5 minutes of review.'
                },
                {
                  id: 'multi-client',
                  question: 'Can I process multiple clients\' statements at once?',
                  answer: 'Yes! Batch processing is one of our most popular features for accountants. Upload 10-50 statements simultaneously, and Statement Desk will process them all in parallel. You can organize files by client folders, track progress for each client, and export all converted files at once. This is perfect for month-end processing or tax season when you receive statements from all clients at the same time.'
                },
                {
                  id: 'integrations',
                  question: 'Does it integrate with QuickBooks and Xero?',
                  answer: 'Yes, Statement Desk integrates directly with QuickBooks Online and Xero. Instead of downloading CSV files and manually importing them, you can push converted transactions directly into your client\'s books with one click. The integration maintains proper categorization, merchant names, and transaction dates. This saves an additional 15-30 minutes per client monthly.'
                },
                {
                  id: 'small-banks',
                  question: 'What if my client has a small regional bank?',
                  answer: 'Our AI works with 200+ banks including small regional banks and credit unions. Unlike traditional converters that only support 5-10 major banks, Statement Desk uses Claude AI to understand any bank statement format—even ones we\'ve never seen before. If you have a particularly unusual format, our AI adapts and learns from it. You\'re not limited to just Chase, Bank of America, and Wells Fargo.'
                },
                {
                  id: 'branded-reports',
                  question: 'Can I export branded reports for clients?',
                  answer: 'Yes! Business and Enterprise plans include branded export templates where you can add your firm\'s logo, custom formatting, and professional styling. Export includes categorized transactions, cash flow summaries, spending trends, and budget comparisons—ready for client review meetings. Clients appreciate receiving polished reports instead of raw CSV files.'
                },
                {
                  id: 'team-collaboration',
                  question: 'Is there team collaboration for larger firms?',
                  answer: 'Absolutely. Business plan includes up to 5 team members with role-based permissions. Junior staff can upload and process statements, senior accountants can review and approve, and partners can access all client data. Enterprise plans support unlimited team members. Every action is logged with full audit trail showing who did what and when—essential for compliance and quality control.'
                },
                {
                  id: 'accuracy',
                  question: 'How accurate is the AI categorization?',
                  answer: 'Statement Desk achieves 99%+ transaction extraction accuracy and 90%+ categorization accuracy. Each transaction includes a confidence score (90%+ is high confidence, 70-89% is medium, below 70% needs review). You can create custom categorization rules that apply across all clients, and the AI learns from your corrections over time. Most accountants find they only need to review low-confidence transactions, which saves significant time.'
                },
                {
                  id: 'roi',
                  question: 'What\'s the ROI for an accounting firm?',
                  answer: 'The ROI is substantial. If you currently spend 2-3 hours manually processing each statement (or pay a VA $15/hr to do it), you\'re spending $2,400+/month for 20 clients. Statement Desk costs $49/month (Business plan) and reduces processing to 5 minutes per statement. That\'s $2,351/month in savings, or $28,212 annually—a 4,800% ROI on your subscription. Plus you can take on more clients without hiring additional staff.'
                },
              ]}
              allowMultiple={false}
            />
          </div>
        </section>

        {/* Final CTA Section */}
        <section id="demo" className="py-16 md:py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Ready to Transform Your Accounting Practice?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join 200+ accountants who've reclaimed their time and grown their practices with Statement Desk
            </p>

            {/* Two-column CTA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              {/* Solo practitioners / small firms */}
              <Card className="p-8 text-left hover:shadow-xl transition-shadow bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  For Solo Practitioners
                </h3>
                <p className="text-gray-700 mb-6">
                  Start your 14-day free trial. No credit card required. Process your first 20 statements free and see the time savings yourself.
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Unlimited statements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">QuickBooks/Xero integration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">AI categorization & duplicate detection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">30-day money-back guarantee</span>
                  </li>
                </ul>
                <Button
                  asChild
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6 h-auto"
                >
                  <Link href="/auth/signup">Start Free Trial</Link>
                </Button>
              </Card>

              {/* Larger firms */}
              <Card className="p-8 text-left hover:shadow-xl transition-shadow bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-600 text-white text-xs font-medium mb-3">
                  20% Team Discount
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  For Accounting Firms (5+ Users)
                </h3>
                <p className="text-gray-700 mb-6">
                  Schedule a personalized demo for your team. See how Statement Desk handles your specific workflows and get a custom quote with 20% team discount.
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Team collaboration & permissions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Dedicated account manager</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Priority support & onboarding</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Custom integrations & API access</span>
                  </li>
                </ul>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full border-2 border-green-600 text-green-700 hover:bg-green-600 hover:text-white text-lg py-6 h-auto"
                >
                  <Link href="mailto:sales@statementdesk.com">Book a Demo</Link>
                </Button>
              </Card>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span>Bank-level encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-600" />
                <span>4.9/5 rating from accountants</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>200+ accounting professionals</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                <span>30-day money-back guarantee</span>
              </div>
            </div>

            {/* Internal links */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-gray-600 mb-4">Learn more:</p>
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <Link href="/pricing" className="text-blue-600 hover:underline">
                  View Full Pricing
                </Link>
                <span className="text-gray-400">•</span>
                <Link href="/blog/best-bank-statement-converter-tools" className="text-blue-600 hover:underline">
                  Compare Bank Statement Tools
                </Link>
                <span className="text-gray-400">•</span>
                <Link href="/blog/import-bank-statements-quickbooks" className="text-blue-600 hover:underline">
                  QuickBooks Import Guide
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
