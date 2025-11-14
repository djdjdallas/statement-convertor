'use client';

import { generateBlogJsonLd } from '@/components/blog/SEOHead';
import BlogLayout from '@/components/blog/BlogLayout';
import ComparisonTable from '@/components/blog/ComparisonTable';
import CTASection from '@/components/blog/CTASection';
import ProConsList from '@/components/blog/ProConsList';
import FAQSection from '@/components/blog/FAQSection';
import CodeBlock from '@/components/blog/CodeBlock';
import Link from 'next/link';

export default function ImportBankStatementsQuickBooks() {
  // JSON-LD structured data
  const articleJsonLd = generateBlogJsonLd({
    title: 'How to Import Bank Statements into QuickBooks (3 Easy Methods - 2025)',
    description: 'Step-by-step guide to import bank statements into QuickBooks. Learn 3 methods including CSV import, direct connection, and automated conversion.',
    canonicalUrl: 'https://statementdesk.com/blog/import-bank-statements-quickbooks',
    publishedTime: '2025-01-16T10:00:00Z',
    modifiedTime: '2025-01-16T10:00:00Z',
    author: {
      name: 'Statement Desk Team',
      url: 'https://statementdesk.com'
    },
    image: {
      url: '/blog/import-quickbooks-og.jpg',
      alt: 'How to Import Bank Statements into QuickBooks Guide'
    }
  });

  // HowTo Schema for step-by-step guide
  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Import Bank Statements into QuickBooks',
    description: 'Complete guide to importing bank statements into QuickBooks Online and Desktop using direct connection, CSV files, or AI conversion.',
    step: [
      {
        '@type': 'HowToStep',
        name: 'Choose Your Import Method',
        text: 'Select from 3 methods: Direct Bank Connection (automatic, recommended), CSV File Import (manual upload), or AI Statement Conversion (upload PDF).'
      },
      {
        '@type': 'HowToStep',
        name: 'Prepare Your Data',
        text: 'For direct connection, authorize your bank account. For CSV, ensure proper formatting. For PDF conversion, use Statement Desk AI conversion.'
      },
      {
        '@type': 'HowToStep',
        name: 'Import Transactions',
        text: 'Follow QuickBooks import wizard, map columns if needed, review transactions for accuracy.'
      },
      {
        '@type': 'HowToStep',
        name: 'Review and Reconcile',
        text: 'Match imported transactions to your bank statement, categorize, and reconcile to complete import process.'
      }
    ]
  };

  // FAQ data
  const faqs = [
    {
      id: 'faq-1',
      question: 'Can I import bank statements directly into QuickBooks without a CSV?',
      answer: 'Yes, QuickBooks supports three import methods: 1) Direct bank connection (automatic, no CSV needed), 2) CSV file upload, 3) OFX/QFX file format. Direct bank connection is easiest but requires your bank to be supported (200+ banks). If not, use CSV or convert your PDF statement using Statement Desk first.'
    },
    {
      id: 'faq-2',
      question: 'What file formats does QuickBooks accept?',
      answer: 'QuickBooks Online accepts CSV and OFX/QFX formats. QuickBooks Desktop accepts CSV, OFX, QFX, and IIF (Interchange Format) files. For best results, use CSV with these columns: Date (MM/DD/YYYY), Description, and Amount. Statement Desk creates perfectly formatted QuickBooks CSV files in seconds.'
    },
    {
      id: 'faq-3',
      question: 'How long does it take to import bank statements?',
      answer: 'Direct bank connection: automatic daily. CSV import: 5-10 minutes setup + 2-3 minutes review. PDF conversion + import: 2-3 minutes with Statement Desk. Bulk imports of 50+ statements: 15-30 minutes with Statement Desk batch processing.'
    },
    {
      id: 'faq-4',
      question: 'Can I undo a QuickBooks import if I make a mistake?',
      answer: 'Yes. QuickBooks Online: Go to Banking tab, find imported transactions, click menu icon → Delete. QuickBooks Desktop: Delete individual transactions or use Undo (Ctrl+Z) immediately after import. Best practice: always review transactions before importing. Statement Desk shows preview with confidence scores, letting you fix issues before import.'
    },
    {
      id: 'faq-5',
      question: 'What if my bank is not supported by QuickBooks direct connection?',
      answer: 'Use CSV file import instead. Download your bank\'s CSV export (if available) or use Statement Desk to convert PDF statements to QuickBooks-formatted CSV. Statement Desk works with 200+ banks and regional credit unions, providing a solution when direct connection isn\'t available.'
    },
    {
      id: 'faq-6',
      question: 'Does QuickBooks automatically categorize imported transactions?',
      answer: 'QuickBooks Online provides basic automatic categorization based on merchant names and transaction history. For advanced AI-powered categorization with 90%+ accuracy, use Statement Desk before importing. Statement Desk categorizes transactions using advanced AI, making your imports ready for reconciliation immediately.'
    },
    {
      id: 'faq-7',
      question: 'How do I prevent duplicate transactions when importing?',
      answer: 'QuickBooks automatically detects duplicates when using direct bank connection. For CSV imports, review the preview before finalizing. Statement Desk detects duplicates across multiple uploads and highlights them for review. Pro tip: import from one source (either direct or CSV, not both) for the same transactions.'
    },
    {
      id: 'faq-8',
      question: 'Can I import historical bank statements from previous years?',
      answer: 'Yes. QuickBooks Desktop has no date restrictions. QuickBooks Online restricts imports to transactions dated within 90 days (direct connection) but allows CSV import of any date. For historical statements, use CSV import. Statement Desk handles multi-year statement imports with proper dating and categorization.'
    },
    {
      id: 'faq-9',
      question: 'What is bank reconciliation and why is it important?',
      answer: 'Reconciliation compares your imported transactions to your actual bank statement, ensuring accuracy. Match each imported transaction to its corresponding bank statement line. QuickBooks provides a reconciliation tool (Banking → Reconcile) to simplify this process. Reconciliation ensures your books match your bank, catching errors and fraud.'
    },
    {
      id: 'faq-10',
      question: 'Which import method is fastest for processing multiple statements?',
      answer: 'For weekly processing: Direct bank connection (fully automatic). For monthly batches: CSV import or AI conversion. For 5+ statements: Statement Desk batch processing handles unlimited statements simultaneously, completing in 1-2 minutes versus 30-45 minutes manually.'
    },
    {
      id: 'faq-11',
      question: 'Does QuickBooks work with credit card statements?',
      answer: 'Yes, both checking and credit card accounts. For credit card imports: 1) Direct connection to credit card provider (if supported), 2) CSV import from credit card statement, 3) Export credit card CSV from Statement Desk. QuickBooks automatically handles credit transactions differently than bank transactions.'
    },
    {
      id: 'faq-12',
      question: 'Can I import statements into multiple QuickBooks accounts?',
      answer: 'Yes. QuickBooks Online: Each company file maintains separate bank accounts. Import each account independently. QuickBooks Desktop: Same process. Statement Desk supports importing different statements into different QuickBooks accounts or companies, with proper account mapping.'
    }
  ];

  // Related articles
  const relatedArticles = [
    {
      title: 'Bank Statement to CSV Converter: Complete Guide',
      slug: 'bank-statement-to-csv-converter',
      excerpt: 'Learn how to convert PDF bank statements to CSV format for QuickBooks, Xero, and Excel.'
    },
    {
      title: 'How to Convert PDF Bank Statement to Excel',
      slug: 'how-to-convert-pdf-bank-statement-to-excel',
      excerpt: 'Master 5 methods to convert PDF bank statements to Excel with step-by-step instructions.'
    },
    {
      title: 'How to Import Bank Statements into Xero',
      slug: 'import-bank-statements-xero',
      excerpt: 'Complete guide to importing CSV bank statements into Xero with troubleshooting tips.'
    }
  ];

  return (
    <>
      {/* Inject JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />

      <BlogLayout
        title="How to Import Bank Statements into QuickBooks (3 Easy Methods - 2025)"
        description="Master bank statement import in QuickBooks. Learn direct connection, CSV import, and AI conversion methods with step-by-step instructions and troubleshooting."
        author="Statement Desk Team"
        publishedDate="January 16, 2025"
        readingTime={14}
        relatedArticles={relatedArticles}
      >
        {/* Introduction */}
        <div className="prose prose-lg max-w-none">
          <p className="text-xl text-gray-700 leading-relaxed">
            Importing <strong>bank statements into QuickBooks</strong> is one of the most important accounting tasks for keeping your books accurate and up-to-date. Whether you're a small business owner reconciling monthly finances, a bookkeeper managing multiple client accounts, or an accountant processing year-end statements, mastering QuickBooks import methods will save you hours of manual data entry.
          </p>

          <p>
            The good news? QuickBooks makes it surprisingly easy. You have three proven methods: direct bank connection (fully automatic), CSV file import (manual but flexible), or AI-powered PDF conversion (fastest for scanned statements). Each method has distinct advantages depending on your bank, workflow, and volume.
          </p>

          <p>
            By the end of this guide, you'll know exactly which import method works best for your situation, how to prepare your bank statements for seamless import, and how to troubleshoot the most common QuickBooks import issues.
          </p>

          {/* TL;DR Quick Answer Box */}
          <div className="my-8 bg-blue-50 border-l-4 border-blue-600 rounded-r-lg p-6 not-prose">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              Quick Answer: 3 Ways to Import
            </h3>
            <p className="text-gray-800 mb-4">
              <strong>Method 1 - Direct Connection (Recommended):</strong> Most automatic. QuickBooks downloads transactions directly from 200+ supported banks daily. Zero manual work once set up.
            </p>
            <p className="text-gray-800 mb-4">
              <strong>Method 2 - CSV Import:</strong> Most flexible. Works with any bank. Upload a CSV file and QuickBooks imports transactions. Requires 5-10 minutes prep time.
            </p>
            <p className="text-gray-800">
              <strong>Method 3 - PDF to CSV Conversion:</strong> Fastest for old statements. Use <Link href="/auth/signup?utm_source=blog&utm_campaign=qb-import" className="text-blue-600 hover:text-blue-700 underline">Statement Desk</Link> to convert PDF → CSV → import in 2 minutes.
            </p>
          </div>

          <h2 id="prerequisites">What You Need to Import Bank Statements</h2>

          <p>
            Before diving into each import method, ensure you have the following prerequisites in place:
          </p>

          <div className="not-prose my-6 bg-gray-50 rounded-lg p-6 space-y-4">
            <div>
              <h4 className="font-bold text-gray-900 mb-2">For Direct Bank Connection:</h4>
              <ul className="space-y-1 text-gray-700">
                <li>✓ QuickBooks Online subscription (Desktop doesn't support automatic connections)</li>
                <li>✓ Bank account with online banking access</li>
                <li>✓ Bank supported by QuickBooks (200+ banks: Chase, Bank of America, Wells Fargo, Citi, Capital One, etc.)</li>
                <li>✓ Login credentials for your online banking account</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-2">For CSV File Import:</h4>
              <ul className="space-y-1 text-gray-700">
                <li>✓ CSV file with these columns: Date, Description, Amount</li>
                <li>✓ Optional columns: Category, Balance, Reference Number</li>
                <li>✓ Proper formatting: MM/DD/YYYY dates, no currency symbols, negative numbers for debits</li>
                <li>✓ QuickBooks Online or Desktop (both support CSV import)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-2">For PDF Conversion:</h4>
              <ul className="space-y-1 text-gray-700">
                <li>✓ PDF bank statement file</li>
                <li>✓ Statement Desk account (free tier: 1 statement/month)</li>
                <li>✓ 2-3 minutes processing time per statement</li>
              </ul>
            </div>
          </div>

          <h2 id="method-comparison">Method Comparison: Which is Right for You?</h2>

          <ComparisonTable
            headers={['Method', 'Setup Time', 'Automation', 'Bank Coverage', 'Best For']}
            rows={[
              ['Direct Bank Connection', '10 min', 'Daily auto', '200+ banks', 'Supported banks'],
              ['CSV File Import', '5-10 min', 'Manual', 'All banks', 'Any bank, flexibility'],
              ['PDF AI Conversion', '2 min', 'Quick', '200+ banks', 'Old/scanned statements'],
              ['OFX/QFX Files', '5 min', 'Manual', 'Some banks', 'Bank file exports']
            ]}
            highlightColumn={1}
            caption="Comparison of QuickBooks bank statement import methods"
          />

          <h2 id="method-1-direct-connection">Method 1: Direct Bank Connection (Recommended)</h2>

          <p>
            Direct bank connection is the gold standard for QuickBooks bank imports. Once set up, QuickBooks automatically downloads transactions from your bank daily, requiring zero manual effort. This method is available only in QuickBooks Online and works with 200+ banks including Chase, Bank of America, Wells Fargo, Citi, Capital One, US Bank, and most regional credit unions.
          </p>

          <h3>Step-by-Step: Setting Up Direct Bank Connection</h3>

          <div className="not-prose my-6 bg-gray-50 rounded-lg p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full font-bold text-lg">1</div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Open QuickBooks Online Banking Tab</h4>
                <p className="text-gray-700">Log into QuickBooks Online → Click the "Banking" tab in the left navigation. You'll see your connected bank accounts and options to add new ones.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full font-bold text-lg">2</div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Click "Link Account"</h4>
                <p className="text-gray-700">Click the "+ Add Account" or "Link Account" button → Search for your bank by name (e.g., "Chase," "Bank of America," "Wells Fargo") → Select your specific bank and branch if multiple locations appear.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full font-bold text-lg">3</div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Authorize Your Bank Account</h4>
                <p className="text-gray-700">Enter your online banking login credentials (username/password). QuickBooks uses a secure, read-only connection. Your credentials are not stored - QuickBooks only stores a secure authorization token. This is same technology banks use for other third-party apps.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full font-bold text-lg">4</div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Select Accounts to Connect</h4>
                <p className="text-gray-700">Choose which accounts to link: checking, savings, credit card, etc. You can connect multiple accounts. QuickBooks shows your account type and last 4 digits for confirmation.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full font-bold text-lg">5</div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Map to QuickBooks Accounts</h4>
                <p className="text-gray-700">QuickBooks asks which QuickBooks account each bank account maps to. If it's your first time, create new accounts (Checking, Savings, Credit Card, etc.) or use existing accounts. This mapping tells QuickBooks where to record transactions.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full font-bold text-lg">6</div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Start Automatic Downloads</h4>
                <p className="text-gray-700">Click "Connect" to finalize. QuickBooks immediately downloads your bank's recent transaction history (usually last 90 days) and will continue downloading daily automatically. You're done!</p>
              </div>
            </div>
          </div>

          <h3>After Connection: Managing Transactions</h3>

          <p>
            Once your bank account is connected, here's how QuickBooks manages transactions:
          </p>

          <ul>
            <li>
              <strong>Daily Downloads:</strong> QuickBooks downloads new transactions every night around midnight, so you see today's transactions by tomorrow morning.
            </li>
            <li>
              <strong>Review in Transactions Tab:</strong> Unmatched transactions appear in the Banking → Transactions tab. QuickBooks shows three groups: Unreviewed, Reviewed, and Matched.
            </li>
            <li>
              <strong>Categorize Transactions:</strong> For each transaction, select a category (Meals & Entertainment, Office Supplies, etc.). QuickBooks learns from your choices and auto-categorizes similar transactions.
            </li>
            <li>
              <strong>Match to Existing Invoices:</strong> If a transaction matches an invoice you sent, click "Match" to link them. This reconciles your unpaid invoices.
            </li>
            <li>
              <strong>Add Transactions to Register:</strong> Click "Add" to move reviewed transactions into your QuickBooks register. After adding, they appear as confirmed transactions in your accounts.
            </li>
          </ul>

          <ProConsList
            title="Direct Bank Connection: Pros and Cons"
            pros={[
              'Fully automatic - no manual data entry required',
              'Daily downloads keep QuickBooks current in real-time',
              'Works with 200+ US and international banks',
              'Secure encrypted connection with read-only access',
              'Automatic duplicate detection prevents doubled transactions',
              'QuickBooks learns your categorization patterns',
              'Zero maintenance after initial setup',
              'Free - included with all QuickBooks Online plans'
            ]}
            cons={[
              'QuickBooks Online only (not available in Desktop)',
              'Not all banks supported - some regional credit unions excluded',
              'Requires online banking credentials',
              'Initial setup takes 5-10 minutes',
              'Manual categorization still required for new merchants',
              'Some banks have security delays or 2FA authentication'
            ]}
          />

          <CTASection
            variant="inline"
            title="Start Your Free QuickBooks Trial"
            description="Try QuickBooks Online with automatic bank connections for 30 days free. No credit card required."
            buttonText="Try QuickBooks Online Free"
            buttonLink="https://quickbooks.intuit.com/?utm_source=statementdesk"
          />

          <h2 id="method-2-csv-import">Method 2: CSV File Import (Most Flexible)</h2>

          <p>
            CSV file import is the most flexible method, working with any bank - even those not supported by QuickBooks direct connection. You upload a properly formatted CSV file and QuickBooks imports all transactions at once. This method works in both QuickBooks Online and Desktop.
          </p>

          <h3>CSV Format Requirements for QuickBooks</h3>

          <p>
            Your CSV file must follow these requirements for successful QuickBooks import:
          </p>

          <div className="not-prose my-6 bg-gray-50 rounded-lg p-6">
            <h4 className="font-bold text-gray-900 mb-3">Required Columns:</h4>
            <ul className="space-y-2 text-gray-700 mb-4">
              <li><strong>Date:</strong> Format as MM/DD/YYYY (e.g., 01/15/2025). Other formats may cause import errors.</li>
              <li><strong>Description or Payee:</strong> Transaction description or merchant name. Max 250 characters.</li>
              <li><strong>Amount:</strong> Use negative numbers for expenses/debits (-100.00), positive for deposits/income (2500.00).</li>
            </ul>

            <h4 className="font-bold text-gray-900 mb-3">Optional Columns:</h4>
            <ul className="space-y-2 text-gray-700">
              <li><strong>Category:</strong> Maps to your QuickBooks chart of accounts (e.g., "Meals & Entertainment")</li>
              <li><strong>Account Name:</strong> Bank account name (Checking, Savings, Credit Card, etc.)</li>
              <li><strong>Reference/Memo:</strong> Check numbers, invoice references, or transaction IDs</li>
              <li><strong>Balance:</strong> Running account balance (helps verify import accuracy)</li>
            </ul>
          </div>

          <h3>CSV Format Example</h3>

          <CodeBlock
            code={`Date,Description,Amount,Category
01/15/2025,"Coffee Shop",-15.50,"Meals & Entertainment"
01/14/2025,"Payroll Deposit",2500.00,"Income"
01/13/2025,"Electric Company",-125.00,"Utilities"
01/12/2025,"ABC, Inc.",-350.00,"Office Supplies"
01/11/2025,"ATM Withdrawal",-100.00,"Cash"
01/10/2025,"Online Transfer",1000.00,"Transfer In"`}
            language="csv"
            filename="quickbooks-import.csv"
          />

          <h3>QuickBooks Online: CSV Import Steps</h3>

          <div className="not-prose my-6 bg-blue-50 rounded-lg p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full font-bold text-lg">1</div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Navigate to Banking Tab</h4>
                <p className="text-gray-700">Log into QuickBooks Online → Click "Banking" in the left navigation → Look for "Upload from File" or "Import Transactions" button.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full font-bold text-lg">2</div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Select Your CSV File</h4>
                <p className="text-gray-700">Click "Choose File" → Select your prepared CSV → Click "Next". QuickBooks reads the file and displays a preview of your transactions.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full font-bold text-lg">3</div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Map Column Headers</h4>
                <p className="text-gray-700">QuickBooks shows your CSV columns and asks which QuickBooks field each maps to: Date → Date, Description → Description, Amount → Amount. Drag to reorder if needed. Set any unmapped columns to "Skip."</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full font-bold text-lg">4</div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Select Bank Account</h4>
                <p className="text-gray-700">Choose which QuickBooks account these transactions import into (Checking, Savings, Credit Card, etc.). If the account doesn't exist, create it first in Chart of Accounts.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full font-bold text-lg">5</div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Review Transaction Preview</h4>
                <p className="text-gray-700">QuickBooks displays all transactions before importing. Review dates, amounts, and descriptions. Click on any transaction to edit before import. If something looks wrong, go back and fix your CSV.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full font-bold text-lg">6</div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Click "Import" to Finalize</h4>
                <p className="text-gray-700">Review one final time, then click "Import" to add all transactions to your QuickBooks register. Transactions appear immediately in your Banking → Transactions tab and account register.</p>
              </div>
            </div>
          </div>

          <h3>QuickBooks Desktop: CSV Import Steps</h3>

          <div className="not-prose my-6 bg-green-50 rounded-lg p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-green-600 text-white rounded-full font-bold text-lg">1</div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">File → Utilities → Import → Excel Files</h4>
                <p className="text-gray-700">Open QuickBooks Desktop → File menu → Utilities → Import → "Excel Files." Browse to your CSV file and open it. QuickBooks opens the file in Excel first for verification.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-green-600 text-white rounded-full font-bold text-lg">2</div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Follow the Import Wizard</h4>
                <p className="text-gray-700">Select data type (Banking transactions) → Map columns → Select import account → Review transactions. QuickBooks walks you through each step with helpful tooltips.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-green-600 text-white rounded-full font-bold text-lg">3</div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Configure Field Mapping</h4>
                <p className="text-gray-700">Tell QuickBooks which Excel columns contain Date, Description, Amount, etc. Use dropdown selectors for each column. Unneeded columns can be left unmapped.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-green-600 text-white rounded-full font-bold text-lg">4</div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Confirm and Import</h4>
                <p className="text-gray-700">Review the transaction preview one final time. Click "Import" to add all transactions to your QuickBooks register. Transactions appear in your chart of accounts immediately.</p>
              </div>
            </div>
          </div>

          <ProConsList
            title="CSV File Import: Pros and Cons"
            pros={[
              'Works with any bank (no bank API required)',
              'Available in both QuickBooks Online and Desktop',
              'Full control over which transactions import',
              'Can batch import multiple statements at once',
              'No recurring connection to maintain (one-time upload)',
              'Works with any CSV source (bank export, Statement Desk, Excel)',
              'Free - no additional software or subscription needed'
            ]}
            cons={[
              'Requires CSV file preparation (may need cleanup)',
              'Manual upload required (not automatic)',
              'Need to remember to import monthly',
              'Column mapping required each import',
              'No duplicate detection across multiple uploads',
              'Requires proper CSV formatting (dates, amounts, columns)'
            ]}
          />

          <h2 id="method-3-pdf-conversion">Method 3: PDF Statement Conversion (Fastest)</h2>

          <p>
            If you have PDF bank statements (scanned statements, email archives, or historical data), the fastest approach is AI-powered PDF conversion using Statement Desk. Upload your PDF, let AI extract transaction data, export as QuickBooks CSV, and import in minutes. This method combines the accuracy of AI with the flexibility of CSV import.
          </p>

          <h3>How PDF to QuickBooks Works</h3>

          <div className="not-prose my-6 bg-purple-50 rounded-lg p-6 space-y-3">
            <p className="text-gray-800"><strong>Step 1 - Upload PDF:</strong> Sign up at Statement Desk (free tier available) and upload your PDF bank statement. The system automatically detects your bank and statement format.</p>
            <p className="text-gray-800"><strong>Step 2 - AI Extraction:</strong> Claude AI processes your statement in 20-30 seconds, extracting dates, merchant names, amounts, and balances with 95-98% accuracy. AI automatically categorizes transactions and normalizes messy merchant names.</p>
            <p className="text-gray-800"><strong>Step 3 - Review & Edit:</strong> Preview all extracted data with confidence scores. Make any corrections (AI learns from edits). Verify dates, amounts, and merchant names match your statement.</p>
            <p className="text-gray-800"><strong>Step 4 - Export QuickBooks CSV:</strong> Click "Export" and select "QuickBooks" format. Statement Desk creates a perfectly formatted CSV with: MM/DD/YYYY dates, proper negative amounts, correct field mapping, UTF-8 encoding for Excel compatibility.</p>
            <p className="text-gray-800"><strong>Step 5 - Import to QuickBooks:</strong> Use the CSV import process (described above) to import into your QuickBooks account. Takes 2-3 minutes.</p>
          </div>

          <p>
            Total time from PDF to QuickBooks: 2-3 minutes per statement, versus 30-60 minutes of manual copy-paste and cleanup.
          </p>

          <h3>Advantages Over Manual CSV Preparation</h3>

          <ul>
            <li>
              <strong>95-98% Accuracy:</strong> AI extracts transaction data more accurately than manual copy-paste or basic OCR. Handles scanned PDFs, multiple columns, unusual formats.
            </li>
            <li>
              <strong>Automatic Categorization:</strong> AI categorizes each transaction, saving manual categorization time. Categories map to QuickBooks standard chart of accounts.
            </li>
            <li>
              <strong>Merchant Normalization:</strong> Converts "WALMART #1234 BENICIA CA" to "Walmart" automatically, improving transaction clarity and categorization.
            </li>
            <li>
              <strong>Duplicate Detection:</strong> Flags potential duplicates across multiple statement uploads, preventing doubled transactions.
            </li>
            <li>
              <strong>Perfect Formatting:</strong> Exports ready-for-import CSV with proper dates, amounts, encoding. No manual column mapping or cleanup required.
            </li>
            <li>
              <strong>Handles Scanned PDFs:</strong> Works with scanned statements using OCR + AI, versus manual methods that can't read scanned PDFs at all.
            </li>
          </ul>

          <ProConsList
            title="PDF AI Conversion: Pros and Cons"
            pros={[
              'Fastest method overall (2-3 minutes per statement)',
              '95-98% accuracy with automatic error detection',
              'Handles scanned PDF statements (built-in OCR)',
              'Automatic transaction categorization included',
              'Merchant name normalization (cleanup)',
              'Duplicate detection across uploads',
              'Exports properly formatted QuickBooks CSV',
              'Works with 200+ banks',
              'Free tier: 1 statement/month'
            ]}
            cons={[
              'Requires internet connection (cloud-based)',
              'Free tier limited (1/month)',
              'Privacy consideration (upload to cloud service)',
              'Requires Statement Desk account setup',
              'Slightly more steps than direct bank connection'
            ]}
          />

          <CTASection
            variant="inline"
            title="Try Statement Desk Free - Convert Your First PDF to QuickBooks CSV"
            description="Upload a PDF bank statement and export as QuickBooks CSV in under 2 minutes. No credit card required."
            buttonText="Start Free Conversion"
            buttonLink="/auth/signup?utm_source=blog&utm_campaign=qb-pdf-conversion"
          />

          <h2 id="best-practices">Best Practices for Successful Imports</h2>

          <h3>Before You Import</h3>

          <div className="not-prose my-6 bg-amber-50 border-l-4 border-amber-600 rounded-r-lg p-6 space-y-3">
            <p className="text-gray-800">✓ <strong>Create QuickBooks Accounts First:</strong> Ensure your bank accounts exist in QuickBooks Chart of Accounts (Checking, Savings, Credit Card, etc.) before importing.</p>
            <p className="text-gray-800">✓ <strong>Check CSV Format:</strong> Verify column headers (Date, Description, Amount) match QuickBooks requirements. Test dates are MM/DD/YYYY format.</p>
            <p className="text-gray-800">✓ <strong>Remove Duplicates:</strong> If importing statements with overlapping dates, manually remove duplicate transactions from CSV before upload.</p>
            <p className="text-gray-800">✓ <strong>Verify Date Range:</strong> Ensure imported statement dates don't duplicate existing QuickBooks transactions (check last imported date first).</p>
            <p className="text-gray-800">✓ <strong>Review High-Dollar Transactions:</strong> Pay special attention to large or unusual transactions - verify they're accurate before importing.</p>
          </div>

          <h3>During Import</h3>

          <div className="not-prose my-6 bg-blue-50 border-l-4 border-blue-600 rounded-r-lg p-6 space-y-3">
            <p className="text-gray-800">✓ <strong>Review Preview:</strong> Always review the transaction preview before clicking "Import." This is your last chance to catch formatting errors.</p>
            <p className="text-gray-800">✓ <strong>Correct Issues:</strong> If dates or amounts look wrong, go back and fix your CSV file. Don't import bad data and try to fix it later.</p>
            <p className="text-gray-800">✓ <strong>Verify Columns Map Correctly:</strong> Confirm Date, Description, and Amount map to the correct fields. Wrong mapping causes transactions to record incorrectly.</p>
            <p className="text-gray-800">✓ <strong>Select Correct Account:</strong> Double-check you're importing to the right bank account (Checking vs Savings, Business vs Personal, etc.).</p>
          </div>

          <h3>After Import</h3>

          <div className="not-prose my-6 bg-green-50 border-l-4 border-green-600 rounded-r-lg p-6 space-y-3">
            <p className="text-gray-800">✓ <strong>Categorize Transactions:</strong> For imports without pre-categorization, assign each transaction to a category. QuickBooks learns and auto-categorizes future similar transactions.</p>
            <p className="text-gray-800">✓ <strong>Match to Invoices:</strong> If you've sent customer invoices, use QuickBooks "Match" function to link payments to invoices. This automatically marks invoices paid.</p>
            <p className="text-gray-800">✓ <strong>Reconcile to Bank Statement:</strong> Use QuickBooks Reconcile function (Banking → Reconcile) to match all imported transactions to your actual bank statement. This catches any import errors.</p>
            <p className="text-gray-800">✓ <strong>Review Final Balance:</strong> Verify your QuickBooks account balance matches your actual bank balance after reconciliation. This confirms the import was accurate.</p>
          </div>

          <h2 id="troubleshooting">Troubleshooting Common Import Issues</h2>

          <h3>Issue 1: "Invalid File Format" Error</h3>

          <p>
            <strong>Symptom:</strong> QuickBooks rejects your file with error "Invalid file format" or "Unable to read file."
          </p>

          <p>
            <strong>Solutions:</strong>
          </p>
          <ul>
            <li>Verify file is actually CSV format (ends in .csv, not .xls or .xlsx)</li>
            <li>Open CSV in text editor to check it's plain text (not Excel binary)</li>
            <li>Ensure you have required columns: Date, Description, Amount</li>
            <li>Check Date column format: MM/DD/YYYY exactly</li>
            <li>Try exporting from Excel as "CSV (Comma delimited) (*.csv)" not other CSV variants</li>
          </ul>

          <h3>Issue 2: Dates Appear Incorrect After Import</h3>

          <p>
            <strong>Symptom:</strong> Imported transactions show wrong dates (shifted by 1 year, different month, etc.)
          </p>

          <p>
            <strong>Solutions:</strong>
          </p>
          <ul>
            <li>QuickBooks may have misinterpreted date format. Check your CSV uses MM/DD/YYYY (e.g., 01/15/2025)</li>
            <li>Regional settings on your computer may differ from QuickBooks expectations</li>
            <li>Delete incorrect transactions (you can undo right after import with Ctrl+Z)</li>
            <li>Fix your CSV dates to be unambiguous: use YYYY-MM-DD format instead</li>
            <li>Re-import corrected CSV</li>
          </ul>

          <h3>Issue 3: Transactions Doubled When Importing CSV</h3>

          <p>
            <strong>Symptom:</strong> Same transactions appear twice, throwing off balances by 2x
          </p>

          <p>
            <strong>Solutions:</strong>
          </p>
          <ul>
            <li>Check if you're using both direct bank connection AND CSV import for same account (causes duplicates)</li>
            <li>Delete duplicate transactions: Banking → Transactions → Select duplicate → Delete</li>
            <li>To prevent: use either direct connection OR CSV import, never both for same account</li>
            <li>For statement overlaps (monthly + quarterly), remove duplicates from CSV before import</li>
          </ul>

          <h3>Issue 4: "No Matching Column Header" Error</h3>

          <p>
            <strong>Symptom:</strong> QuickBooks can't find Date, Description, or Amount columns
          </p>

          <p>
            <strong>Solutions:</strong>
          </p>
          <ul>
            <li>Verify column headers exactly match: "Date", "Description", "Amount" (case-sensitive in some cases)</li>
            <li>Remove any extra blank columns before required columns</li>
            <li>Ensure first row contains headers, not transaction data</li>
            <li>If headers are different (e.g., "Transaction Date"), manually map during import wizard</li>
          </ul>

          <h3>Issue 5: Amounts Show as Text, Won't Reconcile</h3>

          <p>
            <strong>Symptom:</strong> Imported amounts don't calculate correctly or show as left-aligned (text) instead of right-aligned (numbers)
          </p>

          <p>
            <strong>Solutions:</strong>
          </p>
          <ul>
            <li>CSV amounts must have no currency symbols ($, £) or thousands separators (commas)</li>
            <li>Negative numbers must use minus sign: -100.00 not (100.00) or 100.00-</li>
            <li>Remove all non-numeric characters except minus sign and decimal point</li>
            <li>Excel formula to clean amounts: =VALUE(SUBSTITUTE(SUBSTITUTE(A1,"$",""),",",""))</li>
            <li>Re-export cleaned CSV and re-import</li>
          </ul>

          <h3>Issue 6: Can't Import to Business Account from Bank Connection</h3>

          <p>
            <strong>Symptom:</strong> Bank is connected but QuickBooks shows error for specific account
          </p>

          <p>
            <strong>Solutions:</strong>
          </p>
          <ul>
            <li>Verify the bank account is mapped to correct QuickBooks account in Banking settings</li>
            <li>Try disconnecting and reconnecting the bank account</li>
            <li>Check for special characters or issues with your bank login (bank may have reset credentials)</li>
            <li>If issue persists, use CSV import as alternative instead of direct connection</li>
          </ul>

          <h2 id="faq">Frequently Asked Questions</h2>

          <FAQSection faqs={faqs} allowMultiple={false} />

          <h2 id="conclusion">Conclusion: Choose Your Perfect Import Method</h2>

          <p>
            Importing bank statements into QuickBooks doesn't have to be complicated. You now have three proven methods that handle any situation:
          </p>

          <div className="not-prose my-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-bold text-gray-900 mb-4">Quick Decision Guide</h3>

            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-blue-700 mb-2">Choose Direct Bank Connection If:</h4>
                <ul className="space-y-1 text-gray-700 text-sm">
                  <li>• Your bank is supported by QuickBooks (200+ banks)</li>
                  <li>• You want fully automatic daily downloads</li>
                  <li>• You have QuickBooks Online subscription</li>
                  <li>• You value "set it and forget it" simplicity</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-purple-700 mb-2">Choose CSV Import If:</h4>
                <ul className="space-y-1 text-gray-700 text-sm">
                  <li>• Your bank isn't supported by QuickBooks</li>
                  <li>• You already have CSV files from your bank</li>
                  <li>• You use QuickBooks Desktop</li>
                  <li>• You need one-time flexibility without recurring connections</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-green-700 mb-2">Choose PDF Conversion If:</h4>
                <ul className="space-y-1 text-gray-700 text-sm">
                  <li>• You have PDF statements (current or historical)</li>
                  <li>• You want automatic categorization included</li>
                  <li>• You need fastest processing (2-3 minutes)</li>
                  <li>• You have scanned statements that need OCR</li>
                </ul>
              </div>
            </div>
          </div>

          <h3>Key Takeaways</h3>

          <div className="not-prose my-8 bg-blue-50 rounded-lg p-6">
            <ul className="space-y-2 text-gray-800">
              <li>✓ <strong>Direct bank connection is automatic</strong> - download daily with zero manual effort (200+ banks supported)</li>
              <li>✓ <strong>CSV import is flexible</strong> - works with any bank, takes 5-10 minutes per statement</li>
              <li>✓ <strong>PDF conversion is fastest</strong> - AI extracts and formats in 2-3 minutes, includes categorization</li>
              <li>✓ <strong>Always review before importing</strong> - catch formatting errors in preview, prevent importing bad data</li>
              <li>✓ <strong>Reconcile after importing</strong> - match imported transactions to actual bank statement to catch errors</li>
              <li>✓ <strong>Never import duplicate sources</strong> - use either direct connection OR CSV for same account, never both</li>
            </ul>
          </div>

          <h3>Next Steps</h3>

          <ol className="space-y-3 text-gray-800">
            <li>
              <strong>Check Your Bank Support:</strong> Log into QuickBooks Online → Banking → Add Account → Search for your bank. If found, use direct connection (easiest).
            </li>
            <li>
              <strong>If Not Supported:</strong> Check if your bank offers CSV export. Download a sample CSV and use import method 2.
            </li>
            <li>
              <strong>For PDF Statements:</strong> Try Statement Desk free (1 statement/month) to convert PDF → QuickBooks CSV in 2 minutes.
            </li>
            <li>
              <strong>Set Up Reconciliation:</strong> After first import, use QuickBooks Banking → Reconcile to match transactions to your actual bank statement.
            </li>
          </ol>

          <h3>Related Resources</h3>

          <ul>
            <li><Link href="/blog/bank-statement-to-csv-converter" className="text-blue-600 hover:text-blue-700 underline">Bank Statement to CSV Converter: Complete Guide</Link> - Master CSV conversion for any software</li>
            <li><Link href="/blog/how-to-convert-pdf-bank-statement-to-excel" className="text-blue-600 hover:text-blue-700 underline">How to Convert PDF Bank Statement to Excel</Link> - Excel conversion for analysis and reporting</li>
            <li><Link href="/blog/import-bank-statements-xero" className="text-blue-600 hover:text-blue-700 underline">How to Import Bank Statements into Xero</Link> - Xero-specific import guide</li>
          </ul>

          <CTASection
            variant="footer"
            title="Stop Manual Bank Statement Processing Today"
            description="Whether you choose direct connection, CSV import, or AI conversion, Statement Desk makes bank statement processing fast and accurate. Try it free - no credit card required."
            buttonText="Start Converting Bank Statements Free"
            buttonLink="/auth/signup?utm_source=blog&utm_campaign=qb-import-footer"
          />
        </div>
      </BlogLayout>
    </>
  );
}
