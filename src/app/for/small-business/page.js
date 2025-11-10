'use client';

import { useState } from 'react';
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
  TrendingUp,
  FileCheck,
  Shield,
  Sparkles,
  Upload,
  Zap,
  Download,
  Users,
  CheckCircle,
  BarChart3,
  Calculator,
  Target
} from 'lucide-react';

export default function SmallBusinessPage() {
  const [calculatorValues, setCalculatorValues] = useState({
    accounts: 3,
    statementsPerMonth: 3,
    hourlyRate: 50,
  });

  const calculateSavings = () => {
    const manualTime = calculatorValues.statementsPerMonth * 2.5;
    const automatedTime = calculatorValues.statementsPerMonth * (5 / 60);
    const timeSaved = manualTime - automatedTime;
    const monthlyValue = timeSaved * calculatorValues.hourlyRate;
    const annualValue = monthlyValue * 12;
    const annualCost = 19 * 12;
    const netSavings = annualValue - annualCost;

    return {
      manualTime,
      automatedTime,
      timeSaved,
      monthlyValue,
      annualValue,
      annualCost,
      netSavings,
    };
  };

  const savings = calculateSavings();

  const faqs = [
    {
      id: 'q1',
      question: 'How much does Statement Desk cost for small businesses?',
      answer: 'Our Professional plan is $19/month and is perfect for small businesses. It includes unlimited statement conversions, up to 5 bank accounts, full AI features (cash flow forecasting, budget recommendations), and priority support. We also offer a free tier that lets you convert 1 statement to try the service with no credit card required.'
    },
    {
      id: 'q2',
      question: 'Can I try it free before paying?',
      answer: 'Absolutely! Our free tier allows you to convert 1 bank statement with no credit card required. You can see the full AI-powered extraction, categorization, and accuracy before deciding to upgrade. We also offer a 30-day money-back guarantee on our Professional plan.'
    },
    {
      id: 'q3',
      question: 'Will it work with my bank?',
      answer: 'Yes! Statement Desk supports 200+ banks including Chase, Bank of America, Wells Fargo, Capital One, US Bank, PNC, TD Bank, and many more. Our AI can understand and process statements from virtually any bank format, including regional banks and credit unions. Even scanned statements work with our OCR technology.'
    },
    {
      id: 'q4',
      question: 'How accurate is the AI categorization?',
      answer: 'Our AI achieves 95-99% accuracy on transaction categorization. It automatically recognizes common business expense categories like Office Supplies, Travel, Meals & Entertainment, Utilities, and more. You can review and adjust any categorizations, and the AI learns from your preferences over time. We also show confidence scores so you know which transactions to double-check.'
    },
    {
      id: 'q5',
      question: 'Can I customize expense categories?',
      answer: 'Yes! While we provide 20+ standard business expense categories that align with tax reporting requirements (Schedule C), you can create custom categories specific to your business. For example, if you run a coffee shop, you might add categories like "Coffee Beans", "Baked Goods Supplies", or "Equipment Maintenance".'
    },
    {
      id: 'q6',
      question: 'Does it integrate with QuickBooks?',
      answer: 'Yes! You can export your converted statements in formats compatible with QuickBooks, Xero, and other accounting software. The Excel/CSV files include all the transaction details, categories, and metadata needed for seamless import. Many of our users report their accountants love how organized the data is.'
    },
    {
      id: 'q7',
      question: 'What if I have multiple bank accounts?',
      answer: 'The Professional plan ($19/mo) supports up to 5 bank accounts, which is perfect for most small businesses with a checking account, savings account, and a couple of credit cards. You can upload statements from all your accounts, and our dashboard consolidates everything in one view. For businesses needing more accounts, our Enterprise plan offers unlimited accounts.'
    },
    {
      id: 'q8',
      question: 'Is my financial data secure?',
      answer: 'Security is our top priority. We use bank-level 256-bit encryption for all data in transit and at rest. Your statements are processed and then permanently deleted from our servers. We never store your banking credentials, and we are SOC 2 Type II compliant. Your data is as secure as it would be at your bank.'
    },
    {
      id: 'q9',
      question: 'Can I cancel anytime?',
      answer: 'Yes, you can cancel your subscription at any time with no penalties or fees. If you cancel, you will continue to have access to your plan features until the end of your current billing period. We also offer a 30-day money-back guarantee if you are not satisfied with the service.'
    },
    {
      id: 'q10',
      question: 'What\'s the ROI for a small business?',
      answer: 'Most small businesses save 4-8 hours per month on bookkeeping tasks. At an average value of $50/hour (your time or bookkeeper costs), that is $200-400 in monthly value for just $19/month - a 10-20x return on investment. Plus, the improved accuracy and organization can save money during tax season and reduce costly bookkeeping errors.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-blue-50 via-white to-blue-50 pt-16 pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4 mr-2" />
                Trusted by 10,000+ Small Businesses
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Stop Wasting Hours on Manual Bookkeeping
              </h1>

              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Automate your bank statement processing in 30 seconds. Statement Desk converts PDF bank statements to Excel with AI-powered accuracy, saving small business owners 4-8 hours monthly for only $19/mo.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6 h-auto">
                  <Link href="/auth/signup">Try Free - No Credit Card</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6 h-auto">
                  <Link href="#calculator">Calculate Your Savings</Link>
                </Button>
              </div>

              {/* Hero Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">$19/mo</div>
                  <div className="text-sm text-gray-600">Professional Plan</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">99%</div>
                  <div className="text-sm text-gray-600">Accuracy Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">4-8h</div>
                  <div className="text-sm text-gray-600">Saved Monthly</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">30s</div>
                  <div className="text-sm text-gray-600">Processing Time</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Small Businesses Need Statement Conversion */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  The Manual Bookkeeping Problem
                </h2>
                <div className="space-y-4 text-gray-700">
                  <p className="flex items-start gap-3">
                    <span className="text-red-500 mt-1">✗</span>
                    <span>Small business owners waste <strong>8-12 hours monthly</strong> on tedious bookkeeping tasks instead of growing their business</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-red-500 mt-1">✗</span>
                    <span>Manual data entry from PDF statements is <strong>error-prone and frustrating</strong>, leading to costly mistakes during tax season</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-red-500 mt-1">✗</span>
                    <span>Missing transaction details and poor organization create <strong>tax preparation nightmares</strong> that stress you out</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-red-500 mt-1">✗</span>
                    <span>Hiring a full-time bookkeeper costs <strong>$3,000-5,000/month</strong> - completely unaffordable for most small businesses</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-red-500 mt-1">✗</span>
                    <span>Without proper tracking, you lose visibility into cash flow and <strong>can't make informed business decisions</strong></span>
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  The Statement Desk Solution
                </h2>
                <div className="space-y-4 text-gray-700">
                  <p className="flex items-start gap-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <span><strong>Automated transaction extraction</strong> in 30 seconds - no more manual typing or copy-pasting from PDFs</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <span><strong>AI categorization</strong> automatically tags expenses (Office, Travel, Meals) with 95-99% accuracy - no manual tagging required</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Export to <strong>Excel, CSV, or QuickBooks</strong> in formats your accountant will love - seamless integration</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <span><strong>Affordable at $19/mo</strong> vs $3,000+/month for a bookkeeper - get professional results at DIY prices</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <span><strong>Time saved: Focus on growing your business</strong>, not drowning in spreadsheets and data entry</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Time & Cost Savings Calculator */}
        <section id="calculator" className="py-20 bg-gradient-to-br from-blue-50 to-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Calculate Your Time & Cost Savings
              </h2>
              <p className="text-lg text-gray-600">
                See exactly how much Statement Desk will save your business
              </p>
            </div>

            <Card className="p-8 bg-white shadow-xl">
              {/* Calculator Inputs */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Bank Accounts
                  </label>
                  <select
                    value={calculatorValues.accounts}
                    onChange={(e) => setCalculatorValues({ ...calculatorValues, accounts: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  >
                    {[1, 2, 3, 4, 5].map(num => (
                      <option key={num} value={num}>{num} account{num > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statements per Month
                  </label>
                  <select
                    value={calculatorValues.statementsPerMonth}
                    onChange={(e) => setCalculatorValues({ ...calculatorValues, statementsPerMonth: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <option key={num} value={num}>{num} statement{num > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Time Value
                  </label>
                  <select
                    value={calculatorValues.hourlyRate}
                    onChange={(e) => setCalculatorValues({ ...calculatorValues, hourlyRate: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  >
                    <option value={25}>$25/hour</option>
                    <option value={50}>$50/hour</option>
                    <option value={75}>$75/hour</option>
                    <option value={100}>$100/hour</option>
                  </select>
                </div>
              </div>

              {/* Results */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 border-2 border-blue-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                  Your Savings with Statement Desk
                </h3>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Manual Processing Time</div>
                    <div className="text-2xl font-bold text-red-600">
                      {savings.manualTime.toFixed(1)} hours/month
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {calculatorValues.statementsPerMonth} statements × 2.5 hours each
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">With Statement Desk</div>
                    <div className="text-2xl font-bold text-green-600">
                      {(savings.automatedTime * 60).toFixed(0)} minutes/month
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {calculatorValues.statementsPerMonth} statements × 5 minutes each
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-semibold text-gray-900">Time Saved Monthly:</span>
                    <span className="text-3xl font-bold text-blue-600">
                      {savings.timeSaved.toFixed(1)} hours
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-900">Time Saved Yearly:</span>
                    <span className="text-3xl font-bold text-blue-600">
                      {(savings.timeSaved * 12).toFixed(0)} hours
                    </span>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-lg p-4 text-center">
                    <div className="text-sm text-gray-600 mb-1">Monthly Value</div>
                    <div className="text-2xl font-bold text-gray-900">
                      ${savings.monthlyValue.toFixed(0)}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center">
                    <div className="text-sm text-gray-600 mb-1">Annual Value</div>
                    <div className="text-2xl font-bold text-gray-900">
                      ${savings.annualValue.toFixed(0)}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center">
                    <div className="text-sm text-gray-600 mb-1">Annual Cost</div>
                    <div className="text-2xl font-bold text-gray-900">
                      ${savings.annualCost}
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6 text-center">
                  <div className="text-lg font-semibold mb-2">Your Net Annual Savings</div>
                  <div className="text-5xl font-bold mb-2">
                    ${savings.netSavings.toFixed(0)}
                  </div>
                  <div className="text-green-100">
                    That's a {(savings.annualValue / savings.annualCost).toFixed(0)}x return on investment!
                  </div>
                </div>
              </div>

              <div className="text-center mt-6">
                <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                  <Link href="/auth/signup">Start Saving Today - Try Free</Link>
                </Button>
              </div>
            </Card>
          </div>
        </section>

        {/* CTA After Calculator */}
        <CTASection
          variant="inline"
          title="Ready to save hours every month?"
          description="Join thousands of small business owners who trust Statement Desk for accurate, automated bookkeeping."
          buttonText="Start Free Trial"
          buttonLink="/auth/signup"
        />

        {/* How It Works */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                How Statement Desk Works
              </h2>
              <p className="text-xl text-gray-600">
                Three simple steps to automated bookkeeping
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                    <Upload className="h-10 w-10 text-blue-600" />
                  </div>
                  <div className="absolute top-10 left-1/2 w-full h-0.5 bg-blue-200 hidden md:block -z-10"></div>

                  <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mb-4">
                    1
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Upload Your Bank Statement
                  </h3>

                  <p className="text-gray-600 mb-4">
                    Drag and drop your PDF bank statement or browse to upload. Works with any bank including Chase, Bank of America, Wells Fargo, and 200+ others. Even scanned statements work with our OCR technology.
                  </p>

                  <div className="text-sm text-blue-600 font-medium">
                    Takes 5 seconds
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                    <Zap className="h-10 w-10 text-blue-600" />
                  </div>

                  <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mb-4">
                    2
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    AI Processes Automatically
                  </h3>

                  <p className="text-gray-600 mb-4">
                    Our AI extracts all transactions with dates, merchants, and amounts. It automatically categorizes expenses (Office, Travel, Meals), normalizes merchant names (AMZN → Amazon), and detects unusual transactions.
                  </p>

                  <div className="text-sm text-blue-600 font-medium">
                    Processing time: 30 seconds
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                    <Download className="h-10 w-10 text-blue-600" />
                  </div>

                  <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mb-4">
                    3
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Download & Use
                  </h3>

                  <p className="text-gray-600 mb-4">
                    Export to Excel or CSV format. Import into QuickBooks or Xero. Review AI categorization (usually 95%+ accurate). Your data is ready for tax prep or financial analysis.
                  </p>

                  <div className="text-sm text-blue-600 font-medium">
                    Ready to use immediately
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-12">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Link href="/auth/signup">Try It Now - Free</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Small Business-Specific Features */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Built for Small Business Needs
              </h2>
              <p className="text-xl text-gray-600">
                Features designed specifically for entrepreneurs and small business owners
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Cash Flow Forecasting */}
              <Card className="p-8 hover:shadow-xl transition-shadow">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Cash Flow Forecasting
                    </h3>
                    <p className="text-gray-600 mb-4">
                      AI predicts your next 3-6 months of cash flow based on historical income and expenses. See when money will be tight and plan accordingly to avoid cash crunches.
                    </p>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Identifies seasonal patterns in your business</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Helps plan for slow months and busy seasons</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Confidence scores show forecast reliability</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Visual dashboard makes trends easy to understand</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>

              {/* Budget Recommendations */}
              <Card className="p-8 hover:shadow-xl transition-shadow">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Target className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Budget Recommendations
                    </h3>
                    <p className="text-gray-600 mb-4">
                      AI analyzes your spending patterns and suggests personalized budgets by category. Compare your spending to industry benchmarks and get alerts when over budget.
                    </p>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Personalized budgets based on your actual spending</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Category-specific recommendations (e.g., reduce office supply costs)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Track progress toward financial goals</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Financial health indicators show business fitness</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>

              {/* Expense Tracking by Category */}
              <Card className="p-8 hover:shadow-xl transition-shadow">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Expense Tracking by Category
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Automatic categorization of 20+ business expense types. Create custom categories specific to your business. See monthly and quarterly trends at a glance.
                    </p>
                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                      <div className="text-sm font-semibold text-gray-700 mb-2">Common Business Categories:</div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <div>• Office Supplies</div>
                        <div>• Travel</div>
                        <div>• Meals & Entertainment</div>
                        <div>• Utilities</div>
                        <div>• Rent/Lease</div>
                        <div>• Payroll</div>
                        <div>• Marketing</div>
                        <div>• Professional Services</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Tax Prep Simplification */}
              <Card className="p-8 hover:shadow-xl transition-shadow">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileCheck className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Tax Prep Simplification
                    </h3>
                    <p className="text-gray-600 mb-4">
                      All transactions automatically categorized for Schedule C. Export tax-ready reports. Get year-end summaries. Share directly with your accountant.
                    </p>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Schedule C ready expense categorization</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Mileage and expense tracking</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Year-end tax summary reports</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Export in formats accountants prefer</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>

              {/* Multi-Account Support */}
              <Card className="p-8 hover:shadow-xl transition-shadow md:col-span-2">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Multi-Account Support
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Handle business checking, savings, credit cards, and more - all in one dashboard. Get consolidated views across all your accounts with account-specific reports when needed.
                    </p>
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600 mb-1">5</div>
                        <div className="text-sm text-gray-600">Accounts on Pro Plan</div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600 mb-1">∞</div>
                        <div className="text-sm text-gray-600">Statements per Account</div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600 mb-1">1</div>
                        <div className="text-sm text-gray-600">Consolidated Dashboard</div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600 mb-1">200+</div>
                        <div className="text-sm text-gray-600">Supported Banks</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-xl text-gray-600">
                Choose the plan that's right for your small business
              </p>
            </div>

            <ComparisonTable
              headers={['Feature', 'Free', 'Professional', 'Enterprise']}
              rows={[
                ['Statements per Month', '1', 'Unlimited', 'Unlimited'],
                ['Bank Accounts', '1', '5', 'Unlimited'],
                ['AI Transaction Extraction', true, true, true],
                ['AI Categorization', 'Basic', 'Full', 'Full'],
                ['Cash Flow Forecasting', false, true, true],
                ['Budget Recommendations', false, true, true],
                ['Export to Excel/CSV', true, true, true],
                ['QuickBooks/Xero Integration', false, true, true],
                ['Support', 'Email', 'Email + Chat', 'Dedicated Manager'],
                ['API Access', false, false, true],
                ['Monthly Price', 'Free', '$19', 'Custom']
              ]}
              highlightColumn={2}
              caption="Statement Desk pricing comparison"
            />

            <div className="mt-12 max-w-3xl mx-auto">
              <Card className="p-8 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                  Why Professional Plan is Perfect for Small Business
                </h3>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-gray-900">Unlimited Statements</div>
                      <div className="text-sm text-gray-600">Process as many statements as you need for one flat rate of $19/month</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-gray-900">Up to 5 Accounts</div>
                      <div className="text-sm text-gray-600">Perfect for checking, savings, and multiple credit cards</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-gray-900">Full AI Features</div>
                      <div className="text-sm text-gray-600">Cash flow forecasting, budget recommendations, and intelligent categorization</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-gray-900">Priority Support</div>
                      <div className="text-sm text-gray-600">Get help via email and live chat when you need it</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-gray-900">QuickBooks Integration</div>
                      <div className="text-sm text-gray-600">Export in formats compatible with QuickBooks and Xero</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-gray-900">Money-Back Guarantee</div>
                      <div className="text-sm text-gray-600">30-day guarantee, cancel anytime, no questions asked</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 mb-6">
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      10-20x Return on Investment
                    </div>
                    <p className="text-gray-600">See the value Statement Desk provides</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">4-8 hrs</div>
                      <div className="text-sm text-gray-600">Saved Monthly</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">$200-400</div>
                      <div className="text-sm text-gray-600">Value @ $50/hr</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">$19</div>
                      <div className="text-sm text-gray-600">Monthly Cost</div>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                    <Link href="/auth/signup">Start Professional Plan Free</Link>
                  </Button>
                  <p className="text-sm text-gray-600 mt-2">14-day free trial • No credit card required</p>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA After Pricing */}
        <CTASection
          variant="inline"
          title="Join 10,000+ Small Businesses Saving Time & Money"
          description="Start with our free tier - convert 1 statement with no credit card required. Upgrade to Professional when you're ready."
          buttonText="Try Free Now"
          buttonLink="/auth/signup"
        />

        {/* Success Stories */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Small Business Success Stories
              </h2>
              <p className="text-xl text-gray-600">
                Real results from entrepreneurs and small business owners
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Testimonial 1 */}
              <Card className="p-8 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600">
                    ER
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">Emma Rodriguez</div>
                    <div className="text-sm text-gray-600">E-commerce Store Owner</div>
                  </div>
                </div>

                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-500">⭐</span>
                  ))}
                </div>

                <blockquote className="text-gray-700 mb-4 italic">
                  "I used to spend entire Sundays doing bookkeeping. Now it takes 20 minutes. Statement Desk pays for itself 100x over. The cash flow forecasting helped me avoid a cash crunch last quarter."
                </blockquote>

                <div className="border-t border-gray-200 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Business:</span>
                    <span className="font-medium text-gray-900">Online Retail</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Revenue:</span>
                    <span className="font-medium text-gray-900">$500K/year</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time Saved:</span>
                    <span className="font-medium text-green-600">6 hours/month</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Favorite Feature:</span>
                    <span className="font-medium text-blue-600">Cash Flow Forecasting</span>
                  </div>
                </div>
              </Card>

              {/* Testimonial 2 */}
              <Card className="p-8 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600">
                    DL
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">David Lee</div>
                    <div className="text-sm text-gray-600">Freelance Consultant</div>
                  </div>
                </div>

                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-500">⭐</span>
                  ))}
                </div>

                <blockquote className="text-gray-700 mb-4 italic">
                  "As a solo consultant, I can't afford a bookkeeper. Statement Desk gives me professional-level financials for $19/mo. The AI categorization is spot-on - I barely have to review it."
                </blockquote>

                <div className="border-t border-gray-200 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Business:</span>
                    <span className="font-medium text-gray-900">Marketing Consultant</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Revenue:</span>
                    <span className="font-medium text-gray-900">$120K/year</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time Saved:</span>
                    <span className="font-medium text-green-600">4 hours/month</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Favorite Feature:</span>
                    <span className="font-medium text-blue-600">AI Categorization</span>
                  </div>
                </div>
              </Card>

              {/* Testimonial 3 */}
              <Card className="p-8 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600">
                    LM
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">Lisa Martinez</div>
                    <div className="text-sm text-gray-600">Coffee Shop Owner</div>
                  </div>
                </div>

                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-500">⭐</span>
                  ))}
                </div>

                <blockquote className="text-gray-700 mb-4 italic">
                  "Running a small business is chaotic. Statement Desk is the one thing that just works. Upload statements, get Excel, import to QuickBooks. Done. My accountant loves how organized everything is now."
                </blockquote>

                <div className="border-t border-gray-200 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Business:</span>
                    <span className="font-medium text-gray-900">Local Coffee Shop</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Revenue:</span>
                    <span className="font-medium text-gray-900">$250K/year</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time Saved:</span>
                    <span className="font-medium text-green-600">8 hours/month</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Favorite Feature:</span>
                    <span className="font-medium text-blue-600">QuickBooks Integration</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA After Testimonials */}
        <CTASection
          variant="inline"
          title="See why thousands of small businesses trust Statement Desk"
          description="Start your free trial today and experience bookkeeper-level results at DIY pricing."
          buttonText="Start Free Trial"
          buttonLink="/auth/signup"
        />

        {/* Comparison: Manual Entry vs Automated */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Manual Entry vs Automated vs Bookkeeper
              </h2>
              <p className="text-xl text-gray-600">
                Compare your options for small business bookkeeping
              </p>
            </div>

            <ComparisonTable
              headers={['Aspect', 'Manual Entry', 'Hire Bookkeeper', 'Statement Desk']}
              rows={[
                ['Time per Statement', '2-3 hours', 'Hands-off', '5 minutes'],
                ['Monthly Cost', 'Free (but time = money)', '$300-500/month', '$19/month'],
                ['Accuracy Rate', '70-80%', '95%', '99%'],
                ['Scalability', 'Limited', 'Scalable', 'Unlimited'],
                ['Stress Level', 'High', 'Low (but expensive)', 'Low & affordable'],
                ['Setup Time', 'None', 'Days/weeks', '5 minutes'],
                ['Training Required', 'Yes', 'No', 'No'],
                ['Categorization', 'Manual', 'Manual', 'Automatic AI'],
                ['Cash Flow Forecasting', false, true, true],
                ['Budget Recommendations', false, 'Sometimes', true]
              ]}
              highlightColumn={3}
              caption="Comparison of bookkeeping methods for small business"
            />

            <div className="mt-12 max-w-3xl mx-auto">
              <Card className="p-8 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    The Verdict
                  </h3>
                  <p className="text-lg text-gray-700 mb-6">
                    Statement Desk offers <strong>bookkeeper-level results</strong> at <strong>DIY pricing</strong>.
                    Get 99% accuracy, AI-powered insights, and professional features for just $19/month -
                    a fraction of the cost of hiring a bookkeeper.
                  </p>
                  <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
                    <Link href="/auth/signup">Get Bookkeeper Results for $19/mo</Link>
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <FAQSection
              title="Frequently Asked Questions for Small Business Owners"
              faqs={faqs}
              allowMultiple={false}
            />
          </div>
        </section>

        {/* Final CTA */}
        <CTASection
          variant="footer"
          title="Join 10,000+ Small Businesses Saving Time & Money"
          description="Start with our free tier - convert 1 statement with no credit card required. See the accuracy and time savings for yourself. Upgrade to Professional when you're ready for unlimited statements and full AI features."
          buttonText="Start Free Trial"
          buttonLink="/auth/signup"
          badge="No Credit Card Required"
        />

        {/* Trust Signals & Links */}
        <section className="py-12 bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Why Small Businesses Trust Statement Desk
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                <div className="text-center">
                  <div className="text-3xl mb-2">⭐</div>
                  <div className="font-bold text-gray-900">4.9/5 Rating</div>
                  <div className="text-sm text-gray-600">10,000+ Reviews</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">🔒</div>
                  <div className="font-bold text-gray-900">SOC 2 Compliant</div>
                  <div className="text-sm text-gray-600">Bank-Grade Security</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">⚡</div>
                  <div className="font-bold text-gray-900">99% Accuracy</div>
                  <div className="text-sm text-gray-600">AI-Powered</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">💰</div>
                  <div className="font-bold text-gray-900">30-Day Guarantee</div>
                  <div className="text-sm text-gray-600">Risk-Free Trial</div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-8">
              <div className="text-center">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Learn More About Statement Desk
                </h4>
                <div className="flex flex-wrap justify-center gap-4 text-sm">
                  <Link href="/pricing" className="text-blue-600 hover:text-blue-700 hover:underline">
                    View Pricing
                  </Link>
                  <span className="text-gray-300">|</span>
                  <Link href="/blog/how-to-convert-pdf-bank-statement-to-excel" className="text-blue-600 hover:text-blue-700 hover:underline">
                    How to Convert PDF to Excel
                  </Link>
                  <span className="text-gray-300">|</span>
                  <Link href="/blog/best-bank-statement-converter-tools" className="text-blue-600 hover:text-blue-700 hover:underline">
                    Best Converter Tools
                  </Link>
                  <span className="text-gray-300">|</span>
                  <Link href="/for/accountants" className="text-blue-600 hover:text-blue-700 hover:underline">
                    For Accountants
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
