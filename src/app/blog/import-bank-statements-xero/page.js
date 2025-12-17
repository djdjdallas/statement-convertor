'use client';

import { generateBlogJsonLd } from '@/components/blog/SEOHead';
import BlogLayout from '@/components/blog/BlogLayout';
import ComparisonTable from '@/components/blog/ComparisonTable';
import CTASection from '@/components/blog/CTASection';
import ProConsList from '@/components/blog/ProConsList';
import FAQSection from '@/components/blog/FAQSection';
import CodeBlock from '@/components/blog/CodeBlock';
import Link from 'next/link';

export default function ImportBankStatementsXero() {
  // JSON-LD structured data
  const articleJsonLd = generateBlogJsonLd({
    title: 'How to Import Bank Statements into Xero (3 Easy Methods - 2025)',
    description: 'Import bank statements into Xero in 3 easy steps. Complete guide with CSV formatting, bank feeds, and automated conversion options.',
    canonicalUrl: 'https://statementdesk.com/blog/import-bank-statements-xero',
    publishedTime: '2025-01-15T10:00:00Z',
    modifiedTime: '2025-01-15T10:00:00Z',
    author: {
      name: 'Statement Desk Team',
      url: 'https://statementdesk.com'
    },
    image: {
      url: '/blog/import-bank-statements-xero-og.jpg',
      alt: 'How to Import Bank Statements into Xero Guide'
    }
  });

  // HowTo Schema for step-by-step guides
  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Import Bank Statements into Xero',
    description: 'Step-by-step guide to importing bank statements into Xero using bank feeds, CSV files, or automated conversion',
    step: [
      {
        '@type': 'HowToStep',
        name: 'Choose Your Import Method',
        text: 'Select from direct bank feed (automatic), CSV/OFX import (manual), or Statement Desk conversion (AI-powered) based on your needs and bank support.'
      },
      {
        '@type': 'HowToStep',
        name: 'Prepare Your Bank Statement Data',
        text: 'Ensure your statement data is in the correct format with required columns: Date (DD/MM/YYYY), Description/Payee, and Amount or separate Debit/Credit columns.'
      },
      {
        '@type': 'HowToStep',
        name: 'Import into Xero',
        text: 'Navigate to Accounting → Bank Accounts → Manage Account → Import Statement, upload your file, map columns if needed, and import.'
      },
      {
        '@type': 'HowToStep',
        name: 'Reconcile Transactions',
        text: 'Review imported transactions in the Reconciliation tab, match with existing invoices/bills, create bank rules for auto-categorization, and mark as reconciled.'
      }
    ]
  };

  // FAQ data
  const faqs = [
    {
      id: 'faq-1',
      question: 'Can I import PDF statements into Xero?',
      answer: 'No, Xero does not support direct PDF import. You must first convert your PDF bank statements to CSV, OFX, QIF, or MT940 format. Statement Desk makes this easy by automatically converting PDF statements to Xero-formatted CSV files in 30 seconds with 97% accuracy. Simply upload your PDF, and download a ready-to-import CSV file with proper DD/MM/YYYY date formatting and column mapping.'
    },
    {
      id: 'faq-2',
      question: 'What file formats does Xero accept for bank statement imports?',
      answer: 'Xero accepts CSV (Comma-Separated Values), OFX (Open Financial Exchange), QIF (Quicken Interchange Format), and MT940 (SWIFT standard) file formats. CSV is the most common and easiest to work with. Xero provides three CSV template options: Xero format (with specific column headers), Generic format (flexible mapping), and Custom format (save your own mapping for reuse). Most banks export OFX or QIF, while Statement Desk provides Xero-formatted CSV files.'
    },
    {
      id: 'faq-3',
      question: 'How do I fix date format errors when importing to Xero?',
      answer: 'Xero expects dates in DD/MM/YYYY format by default (varies by region settings). If you see date errors, check your CSV file and convert dates from MM/DD/YYYY or other formats to DD/MM/YYYY. In Excel: select the date column → Format Cells → Date → choose DD/MM/YYYY. Or use a formula: =TEXT(A2,"DD/MM/YYYY"). Statement Desk automatically formats dates correctly for your Xero region, eliminating this common import error.'
    },
    {
      id: 'faq-4',
      question: 'What\'s the difference between bank feeds and CSV import in Xero?',
      answer: 'Bank feeds automatically sync transactions daily from your bank to Xero (requires bank support and authorization). CSV import is manual - you upload a file containing transactions from a specific period. Bank feeds are convenient for ongoing reconciliation but limited to supported banks (1,000+ via Yodlee). CSV import works with any bank but requires manual file upload. Many users combine both: bank feeds for regular accounts, CSV import for credit cards or banks without feed support.'
    },
    {
      id: 'faq-5',
      question: 'How do I avoid duplicate transactions when importing to Xero?',
      answer: 'Xero automatically detects duplicates based on date, amount, and description similarity. When importing, Xero will flag potential duplicates for review. To minimize duplicates: don\'t overlap date ranges when importing multiple statements, check if transactions are already imported via bank feed before uploading CSV, and review the duplicate warning screen carefully before confirming import. Statement Desk includes built-in duplicate detection across all your uploaded statements.'
    },
    {
      id: 'faq-6',
      question: 'What are bank rules in Xero and how do I set them up?',
      answer: 'Bank rules automatically categorize and reconcile transactions in Xero based on conditions you define. To create: go to Accounting → Bank Accounts → Manage Account → Bank Rules → Create Rule. Set conditions like "Description contains \'STARBUCKS\'" then assign category (Meals & Entertainment) and tax rate. Rules apply to future imports and existing uncategorized transactions. Statement Desk provides AI-powered categorization before import, reducing the need for extensive bank rules.'
    },
    {
      id: 'faq-7',
      question: 'Can I import transactions from multiple bank accounts at once?',
      answer: 'No, Xero requires separate imports for each bank account. Each CSV file must be imported to its corresponding account in Xero. Navigate to Accounting → Bank Accounts → select the specific account → Import Statement. Repeat for each account. Statement Desk Professional plan supports batch processing - upload multiple statements at once and export separate Xero-formatted CSV files for each account, saving 10-15 minutes per import session.'
    },
    {
      id: 'faq-8',
      question: 'Why are my imported amounts showing incorrectly in Xero?',
      answer: 'Common amount issues: 1) Using wrong sign convention (debits should be negative, credits positive), 2) Currency symbols ($, £) not removed, 3) Thousands separators (1,234.56 should be 1234.56), 4) Decimal format mismatch (some regions use comma for decimals). Xero requires clean number format: no symbols, period for decimals, two decimal places (100.00). Statement Desk automatically formats amounts correctly, removing symbols and ensuring proper negative/positive notation.'
    },
    {
      id: 'faq-9',
      question: 'How do I import credit card statements into Xero?',
      answer: 'Import credit card statements the same way as bank statements: 1) Set up your credit card as a "Bank account" in Xero (use Credit Card account type), 2) Download statement from credit card company or convert PDF to CSV, 3) Go to that account → Import Statement → Upload file. For credit cards, expenses are positive numbers and payments are negative numbers (opposite of checking accounts). Many credit card companies don\'t offer CSV export, making Statement Desk essential for PDF conversion.'
    },
    {
      id: 'faq-10',
      question: 'What do I do if Xero says "No transactions found" when importing?',
      answer: 'This error indicates file format issues: 1) Check file has data rows (not just headers), 2) Verify correct delimiter (comma, not semicolon or tab), 3) Ensure no extra header rows or footer text, 4) Confirm date format matches Xero expectations (DD/MM/YYYY), 5) Check file encoding is UTF-8. Open the CSV in a text editor to verify structure. Statement Desk generates Xero-compliant CSV files that pass all validation checks, preventing this frustrating error.'
    },
    {
      id: 'faq-11',
      question: 'Can I use Statement Desk with Xero Accounting?',
      answer: 'Yes! Statement Desk offers a Xero-formatted CSV export option specifically designed for Xero Accounting. Upload your PDF bank statement, let AI extract transactions with 97% accuracy, then download as "Xero Format" CSV with proper DD/MM/YYYY dates, correct column headers (Date, Payee, Description, Reference, Amount), and clean formatting. This eliminates 90% of manual CSV preparation work and import errors. Try your first statement free at statementdesk.com.'
    },
    {
      id: 'faq-12',
      question: 'How far back can I import bank statements into Xero?',
      answer: 'Xero has no restriction on how far back you can import historical transactions. You can import statements from any date, even years ago, for historical record-keeping or initial setup. However, bank feeds typically only sync 90 days of historical transactions. For older statements, use CSV import or convert PDF statements with Statement Desk. Be aware that importing large volumes may take longer to process and reconcile.'
    }
  ];

  // Related articles
  const relatedArticles = [
    {
      title: 'How to Import Bank Statements into QuickBooks',
      slug: 'import-bank-statements-quickbooks',
      excerpt: 'Complete guide to importing bank statements into QuickBooks Online and Desktop with CSV formatting and troubleshooting.'
    },
    {
      title: 'Bank Statement to CSV Converter',
      slug: 'bank-statement-to-csv-converter',
      excerpt: 'Learn how to convert bank statements to CSV format with formatting tips for accounting software compatibility.'
    },
    {
      title: 'How to Convert PDF Bank Statement to Excel',
      slug: 'how-to-convert-pdf-bank-statement-to-excel',
      excerpt: 'Master PDF to Excel conversion with 5 proven methods, from free tools to AI-powered converters.'
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
        title="How to Import Bank Statements into Xero (3 Easy Methods - 2025)"
        description="Complete guide to importing bank statements into Xero Accounting. Learn 3 methods: bank feeds, CSV import, and automated AI conversion with step-by-step instructions."
        author="Statement Desk Team"
        publishedDate="January 15, 2025"
        readingTime={14}
        relatedArticles={relatedArticles}
      >
        {/* Introduction */}
        <div className="prose prose-lg max-w-none">
          <p className="text-xl text-gray-700 leading-relaxed">
            Importing <strong>bank statements into Xero</strong> is a crucial step for maintaining accurate financial records and streamlining your reconciliation process. Whether you're an accountant managing multiple clients, a bookkeeper processing monthly statements, or a business owner keeping your books up to date, understanding Xero's import options can save you hours of manual data entry every month.
          </p>

          <p>
            Xero offers three primary methods for importing bank transactions: <strong>direct bank feeds</strong> (automatic daily sync), <strong>CSV/OFX file import</strong> (manual upload), and <strong>AI-powered conversion tools</strong> like Statement Desk (for PDF statements). Each method has specific advantages depending on your bank, statement format, and workflow preferences.
          </p>

          <p>
            This comprehensive guide walks you through all three import methods with step-by-step instructions, Xero-specific CSV formatting requirements, common troubleshooting solutions, and best practices for bank reconciliation. By the end, you'll know exactly which method works best for your situation and how to execute flawless imports every time.
          </p>

          {/* TL;DR Quick Answer Box */}
          <div className="my-8 bg-blue-50 border-l-4 border-blue-600 rounded-r-lg p-6 not-prose">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              Quick Answer: Importing to Xero
            </h3>
            <p className="text-gray-800 mb-4">
              <strong>Method 1 (Recommended for ongoing use):</strong> Set up automatic bank feeds in Xero → Accounting → Add Bank Account → Connect via Yodlee (supports 1,000+ banks). Transactions sync daily with minimal effort.
            </p>
            <p className="text-gray-800 mb-4">
              <strong>Method 2 (For historical or unsupported banks):</strong> Export CSV/OFX from your bank → Xero → Accounting → Bank Accounts → Manage Account → Import Statement → Upload file → Map columns → Import.
            </p>
            <p className="text-gray-800">
              <strong>Method 3 (For PDF statements):</strong> Use <Link href="/auth/signup?utm_source=blog&utm_campaign=xero-import" className="text-blue-600 hover:text-blue-700 underline">Statement Desk</Link> to convert PDF to Xero-formatted CSV in 30 seconds → Import to Xero as Method 2.
            </p>
          </div>

          <h2 id="prerequisites">Prerequisites: What You'll Need</h2>

          <p>
            Before importing bank statements into Xero, ensure you have the following:
          </p>

          <h3>Xero Account Requirements</h3>

          <ul>
            <li>
              <strong>Active Xero Subscription:</strong> Any Xero plan (Starter, Standard, or Premium) supports bank statement imports. Early and Growing plans have full bank reconciliation features.
            </li>
            <li>
              <strong>Appropriate User Permissions:</strong> You need "Standard" or "Adviser" user role to import bank statements. Read-only users cannot import transactions.
            </li>
            <li>
              <strong>Bank Account Set Up in Xero:</strong> The bank account must already exist in your Xero Chart of Accounts before you can import transactions. Go to Accounting → Chart of Accounts → Add Account if needed.
            </li>
          </ul>

          <h3>Bank Statement Requirements</h3>

          <ul>
            <li>
              <strong>Statement Format:</strong> CSV, OFX, QIF, or MT940 file. Xero does NOT accept PDF files directly - they must be converted first.
            </li>
            <li>
              <strong>Required Data Fields:</strong> At minimum, your statement must include Date, Description (or Payee), and Amount (or separate Debit/Credit columns).
            </li>
            <li>
              <strong>Date Range Awareness:</strong> Know the statement period to avoid overlapping imports and duplicate transactions.
            </li>
          </ul>

          <h3>Pre-Import Checklist</h3>

          <div className="not-prose my-6 bg-gray-50 rounded-lg p-6">
            <h4 className="font-bold text-gray-900 mb-4">Before You Import:</h4>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold mt-1">✓</span>
                <span>Verify the correct bank account is selected in Xero</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold mt-1">✓</span>
                <span>Check for existing transactions in the date range (avoid duplicates)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold mt-1">✓</span>
                <span>Ensure CSV file uses DD/MM/YYYY date format (or matches your region)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold mt-1">✓</span>
                <span>Remove header/footer text and bank account summaries from CSV</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold mt-1">✓</span>
                <span>Confirm amounts are properly formatted (no currency symbols, proper decimals)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold mt-1">✓</span>
                <span>Back up your Xero data (Settings → General Settings → Export for safety)</span>
              </li>
            </ul>
          </div>

          <h2 id="method-1-direct-bank-feed">Method 1: Direct Bank Feed (Automatic) - Recommended</h2>

          <p>
            Direct bank feeds are the most convenient method for importing bank transactions into Xero. Once set up, transactions automatically sync from your bank to Xero daily, eliminating manual imports entirely. Xero partners with Yodlee and other aggregators to support over 1,000 financial institutions worldwide.
          </p>

          <h3>How Xero Bank Feeds Work</h3>

          <p>
            Bank feeds use secure API connections between your bank and Xero. After you authorize the connection, Xero automatically downloads new transactions each day (typically overnight). Transactions appear in your Xero bank reconciliation screen for review, categorization, and matching with invoices or bills.
          </p>

          <p>
            <strong>Important:</strong> Bank feeds typically import the last 90 days of historical transactions when first connected. For older statements, you'll need to use CSV import (Method 2) or convert PDFs with Statement Desk (Method 3).
          </p>

          <h3>Supported Banks and Financial Institutions</h3>

          <p>
            Xero supports 1,000+ banks globally through partnerships with Yodlee, Plaid, and direct bank integrations:
          </p>

          <ul>
            <li><strong>United States:</strong> Chase, Bank of America, Wells Fargo, Citi, Capital One, US Bank, PNC, TD Bank, Ally Bank, American Express, Discover</li>
            <li><strong>United Kingdom:</strong> Barclays, HSBC, Lloyds, NatWest, Santander, Royal Bank of Scotland, Nationwide, TSB, Halifax, Metro Bank</li>
            <li><strong>Australia:</strong> Commonwealth Bank, Westpac, NAB, ANZ, Bendigo Bank, Bank of Melbourne, St.George, BankSA, Macquarie</li>
            <li><strong>New Zealand:</strong> ANZ, ASB, BNZ, Westpac NZ, Kiwibank, TSB, Rabobank, The Co-operative Bank</li>
            <li><strong>Canada:</strong> RBC, TD Canada Trust, Scotiabank, BMO, CIBC, Tangerine, Simplii Financial, Desjardins</li>
          </ul>

          <p>
            Check Xero's bank feed compatibility at: Accounting → Bank Accounts → Add Bank Account → Search for your bank. If your bank isn't listed, use CSV import instead.
          </p>

          <h3>Step-by-Step: Set Up Bank Feed in Xero</h3>

          <div className="not-prose my-6 bg-gray-50 rounded-lg p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full font-bold text-lg">1</div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Navigate to Bank Accounts</h4>
                <p className="text-gray-700">Log into Xero → Click <strong>Accounting</strong> in the main menu → Select <strong>Bank Accounts</strong>. This shows all your connected accounts and available bank feeds.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full font-bold text-lg">2</div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Add Bank Account</h4>
                <p className="text-gray-700">Click <strong>Add Bank Account</strong> button (top right). Search for your bank using the search bar. Xero shows all supported banks and credit unions.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full font-bold text-lg">3</div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Authorize Bank Connection</h4>
                <p className="text-gray-700">Click <strong>Connect</strong> next to your bank. You'll be redirected to your bank's secure login page. Enter your online banking credentials. Xero uses bank-level encryption and never stores your login details.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full font-bold text-lg">4</div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Select Accounts to Sync</h4>
                <p className="text-gray-700">Choose which bank accounts to connect (checking, savings, credit cards). You can connect multiple accounts from the same bank. Click <strong>Continue</strong> to authorize the connection.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full font-bold text-lg">5</div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Map to Xero Accounts</h4>
                <p className="text-gray-700">Xero prompts you to map each bank account to an account in your Chart of Accounts. Select existing accounts or create new ones. Ensure correct account types (Bank, Credit Card, etc.).</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full font-bold text-lg">6</div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Import Historical Transactions</h4>
                <p className="text-gray-700">Xero automatically imports the last 90 days of transactions (varies by bank). Review these in the Reconciliation tab. You can choose to accept or skip historical transactions if already manually entered.</p>
              </div>
            </div>
          </div>

          <h3>Troubleshooting Bank Feed Issues</h3>

          <ul>
            <li>
              <strong>Bank not listed:</strong> Your bank may not support Xero feeds. Use CSV import or Statement Desk instead. Some smaller credit unions lack API support.
            </li>
            <li>
              <strong>Connection fails:</strong> Check bank login credentials are correct. Some banks require additional security steps (2FA, security questions). Try disconnecting and reconnecting.
            </li>
            <li>
              <strong>Transactions not updating:</strong> Bank feeds sync daily, usually overnight. Manual refresh isn't available - wait 24 hours. Check Xero status page for service interruptions.
            </li>
            <li>
              <strong>Duplicate transactions:</strong> This happens if you imported CSV files for the same period. Delete duplicates manually or use Xero's duplicate detection feature.
            </li>
            <li>
              <strong>Feed disconnected:</strong> Banks may disconnect feeds after 90 days of inactivity or if you change passwords. Reconnect by going to Manage Account → Reconnect Bank Feed.
            </li>
          </ul>

          <ProConsList
            title="Direct Bank Feed: Pros and Cons"
            pros={[
              'Completely automatic - transactions sync daily without manual work',
              'Real-time data within 24 hours of bank posting',
              'Reduces manual data entry errors by 95%',
              'Supports 1,000+ banks worldwide through Yodlee integration',
              'Historical import of last 90 days when first connected',
              'Free feature included with all Xero plans',
              'Secure bank-level encryption, credentials never stored by Xero'
            ]}
            cons={[
              'Only works with supported banks (not all banks have feeds)',
              'Limited to 90 days of historical data on initial connection',
              'Cannot import older statements (must use CSV for historical)',
              'Requires ongoing bank authorization (may disconnect if credentials change)',
              'Some banks charge fees for third-party data access',
              'Sync delays possible during bank maintenance windows'
            ]}
          />

          <CTASection
            variant="inline"
            title="Need to Import Historical Statements?"
            description="Bank feeds only sync 90 days back. For older statements or unsupported banks, convert PDFs to Xero-formatted CSV with Statement Desk in 30 seconds."
            buttonText="Convert PDF to Xero CSV"
            buttonLink="/auth/signup?utm_source=blog&utm_campaign=xero-method1-cta"
          />

          <h2 id="method-2-csv-import">Method 2: CSV/OFX Import (Manual)</h2>

          <p>
            Manual CSV import gives you complete control over which transactions to import and when. This method is essential for historical statements, banks without feed support, or when you prefer to review data before importing. Xero accepts CSV, OFX, QIF, and MT940 file formats.
          </p>

          <h3>Xero CSV Format Requirements</h3>

          <p>
            Unlike QuickBooks, Xero has specific CSV format expectations. Understanding these prevents import errors and saves troubleshooting time.
          </p>

          <h4>Required Columns (Minimum):</h4>

          <ul>
            <li><strong>Date:</strong> Transaction date in DD/MM/YYYY format (varies by Xero region settings)</li>
            <li><strong>Amount:</strong> Single column with positive for credits/deposits, negative for debits/expenses, OR separate Debit and Credit columns</li>
            <li><strong>Payee or Description:</strong> Merchant name or transaction description</li>
          </ul>

          <h4>Optional Columns (Recommended):</h4>

          <ul>
            <li><strong>Reference:</strong> Check number, transaction ID, or invoice number</li>
            <li><strong>Code:</strong> Account code from your Chart of Accounts for automatic categorization</li>
            <li><strong>Analysis Code:</strong> Tracking category code for project/department tracking</li>
          </ul>

          <h3>Xero CSV Format Example</h3>

          <p>
            Here's what a properly formatted Xero CSV file looks like:
          </p>

          <CodeBlock
            code={`Date,Payee,Description,Reference,Debit,Credit
15/01/2025,Starbucks,Coffee purchase,DB-1001,15.50,
14/01/2025,ABC Corporation,Invoice payment,INV-5234,,2500.00
13/01/2025,Electric Company,Monthly utilities,CHK-8721,125.00,
12/01/2025,Office Supplies Ltd,Paper and pens,DB-1002,78.45,
11/01/2025,Client Payment,Project ABC deposit,DEP-9876,,1000.00`}
            language="csv"
            filename="xero-bank-statement.csv"
          />

          <p className="text-sm text-gray-600 italic">
            <strong>Note:</strong> Xero's date format is DD/MM/YYYY by default (UK/AU). US users should check their Xero organization settings (Settings → General Settings → Date Format) to confirm expected format.
          </p>

          <h3>Step-by-Step: Import CSV into Xero</h3>

          <div className="not-prose my-6 bg-gray-50 rounded-lg p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-green-600 text-white rounded-full font-bold text-lg">1</div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Navigate to Bank Account</h4>
                <p className="text-gray-700">Go to <strong>Accounting</strong> → <strong>Bank Accounts</strong> → Click the bank account name where you want to import transactions (e.g., "Business Checking Account").</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-green-600 text-white rounded-full font-bold text-lg">2</div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Access Import Function</h4>
                <p className="text-gray-700">Click <strong>Manage Account</strong> button (top right) → Select <strong>Import a Statement</strong> from the dropdown menu. This opens the import wizard.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-green-600 text-white rounded-full font-bold text-lg">3</div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Upload Your File</h4>
                <p className="text-gray-700">Click <strong>Choose File</strong> and select your CSV, OFX, QIF, or MT940 file. Xero supports files up to 1MB (approximately 1,000 transactions). Click <strong>Upload</strong> to proceed.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-green-600 text-white rounded-full font-bold text-lg">4</div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Choose Statement Format</h4>
                <p className="text-gray-700">Select format: <strong>Xero</strong> (if using Xero's standard format), <strong>Generic</strong> (flexible mapping), or <strong>Custom</strong> (previously saved mapping). Most users choose Generic for first-time imports.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-green-600 text-white rounded-full font-bold text-lg">5</div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Map Columns</h4>
                <p className="text-gray-700">Xero displays your CSV columns and asks you to map them to Xero fields. Map Date → Date, Payee/Description → Payee, Amount/Debit/Credit → corresponding Xero fields. Click <strong>Continue</strong> when mapping is complete.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-green-600 text-white rounded-full font-bold text-lg">6</div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Review and Import</h4>
                <p className="text-gray-700">Xero shows a preview of transactions to be imported. Check date range, amounts, and descriptions. Review duplicate warnings if any. Click <strong>Import</strong> to add transactions to your account. Processing takes 5-30 seconds depending on file size.</p>
              </div>
            </div>
          </div>

          <h3>Xero Statement Formats Explained</h3>

          <ComparisonTable
            headers={['Format Type', 'Use Case', 'Column Mapping', 'Best For']}
            rows={[
              ['Xero Format', 'Pre-defined structure', 'Automatic', 'Statement Desk exports'],
              ['Generic Format', 'Flexible mapping', 'Manual selection', 'Bank CSV exports'],
              ['Custom Format', 'Saved mappings', 'Reuse previous', 'Regular imports']
            ]}
            highlightColumn={1}
            caption="Comparison of Xero import format options"
          />

          <h3>Column Mapping Guide</h3>

          <p>
            When using Generic format, you'll need to map your CSV columns to Xero fields. Here's what each field means:
          </p>

          <ul>
            <li>
              <strong>Date:</strong> Required. Transaction date. Xero auto-detects format but expects DD/MM/YYYY. If dates aren't recognized, check your file format.
            </li>
            <li>
              <strong>Amount:</strong> Required (if not using Debit/Credit). Single column with positive for income, negative for expenses.
            </li>
            <li>
              <strong>Debit / Credit:</strong> Alternative to Amount. Separate columns for debits (money out) and credits (money in). Leave opposite column empty for each transaction.
            </li>
            <li>
              <strong>Payee:</strong> Required. Merchant or counterparty name. Used for bank rule matching and transaction description.
            </li>
            <li>
              <strong>Description:</strong> Optional. Additional transaction details. Xero combines Payee + Description if both provided.
            </li>
            <li>
              <strong>Reference:</strong> Optional. Check number, invoice number, or transaction ID for your records.
            </li>
            <li>
              <strong>Code:</strong> Optional. Account code from Chart of Accounts for automatic categorization (e.g., "400" for Sales, "500" for Expenses).
            </li>
          </ul>

          <h3>6 Common CSV Import Errors and Fixes</h3>

          <div className="not-prose my-6 bg-amber-50 border-l-4 border-amber-600 rounded-r-lg p-6">
            <h4 className="font-bold text-gray-900 mb-4">Import Error Solutions:</h4>

            <div className="space-y-4 text-gray-800">
              <div>
                <strong className="text-amber-900">1. "Date format not recognized"</strong>
                <p className="mt-1">Fix: Convert dates to DD/MM/YYYY. In Excel: Format Cells → Date → DD/MM/YYYY. Or use formula: =TEXT(A2,"DD/MM/YYYY")</p>
              </div>

              <div>
                <strong className="text-amber-900">2. "No transactions found in file"</strong>
                <p className="mt-1">Fix: Check file has data rows below headers. Remove footer text, blank rows, and account summaries. Ensure correct delimiter (comma, not semicolon).</p>
              </div>

              <div>
                <strong className="text-amber-900">3. "Amount column invalid"</strong>
                <p className="mt-1">Fix: Remove currency symbols ($, £), thousands separators (1,234.56 → 1234.56), use period for decimals, negative sign for debits (-100.00).</p>
              </div>

              <div>
                <strong className="text-amber-900">4. "Duplicate transactions detected"</strong>
                <p className="mt-1">Fix: Review duplicate warning screen. Uncheck duplicates if already imported. Don't overlap date ranges when importing multiple statements.</p>
              </div>

              <div>
                <strong className="text-amber-900">5. "File size too large"</strong>
                <p className="mt-1">Fix: Xero limits imports to 1MB (~1,000 transactions). Split large statements into smaller files by date range. Import separately.</p>
              </div>

              <div>
                <strong className="text-amber-900">6. "Character encoding error"</strong>
                <p className="mt-1">Fix: Save CSV as UTF-8 encoding. In Excel: Save As → CSV UTF-8 (not standard CSV). This preserves special characters correctly.</p>
              </div>
            </div>
          </div>

          <ProConsList
            title="CSV/OFX Import: Pros and Cons"
            pros={[
              'Works with any bank - no feed support required',
              'Import historical statements from any date (no 90-day limit)',
              'Full control over which transactions to import',
              'Review and edit data before importing',
              'Supports multiple file formats (CSV, OFX, QIF, MT940)',
              'Can save custom mappings for repeated imports',
              'No bank authorization or credential sharing required'
            ]}
            cons={[
              'Manual process - requires file download and upload',
              'Time-consuming for regular reconciliation (5-10 min per statement)',
              'Risk of duplicate transactions if date ranges overlap',
              'Requires proper CSV formatting to avoid import errors',
              'Banks may not offer CSV export (requires PDF conversion)',
              'No automatic categorization (unless using account codes)'
            ]}
          />

          <h2 id="method-3-statement-desk">Method 3: Statement Desk to Xero (AI-Powered)</h2>

          <p>
            For banks that don't offer CSV export or when you only have PDF statements, Statement Desk provides the fastest solution. Our AI-powered converter transforms PDF bank statements into Xero-formatted CSV files in 30 seconds with 97% accuracy.
          </p>

          <h3>Why Use Statement Desk for Xero Imports?</h3>

          <ul>
            <li>
              <strong>Xero-Specific Formatting:</strong> Exports use DD/MM/YYYY dates, proper column headers (Date, Payee, Description, Amount), and Xero-compatible structure.
            </li>
            <li>
              <strong>No Manual Formatting:</strong> Eliminates 90% of CSV preparation work. No need to adjust dates, remove symbols, or restructure columns.
            </li>
            <li>
              <strong>AI Categorization:</strong> Transactions are automatically categorized before export, reducing manual categorization in Xero.
            </li>
            <li>
              <strong>Works with All Banks:</strong> Supports 200+ banks worldwide, including those without CSV export or Xero feeds.
            </li>
            <li>
              <strong>Duplicate Detection:</strong> Built-in duplicate detection across multiple statements prevents import conflicts.
            </li>
          </ul>

          <h3>Step-by-Step: Convert PDF to Xero CSV</h3>

          <div className="not-prose my-6 bg-gray-50 rounded-lg p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-purple-600 text-white rounded-full font-bold text-lg">1</div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Upload PDF Statement</h4>
                <p className="text-gray-700">Go to <Link href="/auth/signup?utm_source=blog&utm_campaign=xero-method3" className="text-blue-600 hover:text-blue-700 underline">Statement Desk</Link> → Sign up (free tier available) → Click <strong>Upload Statement</strong> → Select your PDF bank statement. AI automatically detects your bank format.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-purple-600 text-white rounded-full font-bold text-lg">2</div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">AI Extracts Transaction Data</h4>
                <p className="text-gray-700">Claude AI processes your statement in 20-30 seconds, extracting dates, payees, amounts, descriptions with 97% accuracy. Automatically categorizes transactions and normalizes merchant names (e.g., "STARBUCKS #1234" → "Starbucks").</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-purple-600 text-white rounded-full font-bold text-lg">3</div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Review and Edit (Optional)</h4>
                <p className="text-gray-700">Preview extracted transactions with confidence scores. Make any necessary corrections. Statement Desk learns from your edits for improved accuracy on future statements.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-purple-600 text-white rounded-full font-bold text-lg">4</div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Export as Xero Format CSV</h4>
                <p className="text-gray-700">Click <strong>Export</strong> → Select <strong>Xero Format</strong> from format dropdown → Download CSV. The file is ready to import with proper DD/MM/YYYY dates, clean amounts, and Xero column structure.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-purple-600 text-white rounded-full font-bold text-lg">5</div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Import to Xero</h4>
                <p className="text-gray-700">Follow Method 2 steps above: Xero → Accounting → Bank Accounts → select account → Manage Account → Import Statement → Upload the CSV → Select "Xero" format → Import.</p>
              </div>
            </div>
          </div>

          <ProConsList
            title="Statement Desk to Xero: Pros and Cons"
            pros={[
              'Fastest method - 30 seconds total vs 1-2 hours manual',
              '97% accuracy with AI-powered extraction',
              'Xero-specific CSV format eliminates import errors',
              'Works with all banks (200+) - no feed support needed',
              'Automatic transaction categorization included',
              'Handles both native and scanned PDF statements',
              'Batch processing for multiple statements',
              'Duplicate detection across statements',
              'Free tier available (1 statement/month)'
            ]}
            cons={[
              'Monthly subscription for regular use ($19/mo Professional)',
              'Requires internet connection (cloud-based processing)',
              'Free tier limited to 1 statement per month',
              'Must use trusted service due to financial data sensitivity'
            ]}
          />

          <CTASection
            variant="primary"
            title="Convert PDF Statements to Xero Format in 30 Seconds"
            description="Stop wasting hours on manual CSV formatting. Let Statement Desk's AI handle the conversion while you focus on growing your business."
            buttonText="Try Statement Desk Free"
            buttonLink="/auth/signup?utm_source=blog&utm_campaign=xero-method3-cta"
            badge="Free Tier Available"
          />

          <h2 id="bank-reconciliation">Bank Reconciliation in Xero After Import</h2>

          <p>
            Importing transactions is only half the process. Proper reconciliation ensures your Xero records match your actual bank balance and transactions are categorized correctly.
          </p>

          <h3>How to Reconcile in Xero</h3>

          <ol>
            <li>
              <strong>Access Reconciliation Tab:</strong> Go to Accounting → Bank Accounts → Click the account name → You'll see the <strong>Reconcile</strong> tab with imported transactions awaiting review.
            </li>
            <li>
              <strong>Match Transactions:</strong> Xero suggests matches with existing invoices, bills, or expenses. Click <strong>OK</strong> to accept matches, or <strong>Create</strong> to manually enter details for new transactions.
            </li>
            <li>
              <strong>Categorize Unmatched Items:</strong> For transactions without matches, select the appropriate account from the dropdown (e.g., Office Supplies, Meals & Entertainment). Add descriptions and tax rates as needed.
            </li>
            <li>
              <strong>Create Bank Rules:</strong> For recurring transactions (e.g., monthly subscriptions, utilities), create a bank rule to auto-categorize future similar transactions. Click <strong>Create Rule</strong> on any transaction.
            </li>
            <li>
              <strong>Mark as Reconciled:</strong> Once all transactions are matched or categorized, click <strong>Reconcile X Transactions</strong> button. Xero marks them as reconciled and updates your account balance.
            </li>
          </ol>

          <h3>Matching Transactions with Invoices/Bills</h3>

          <p>
            Xero's matching algorithm looks for:
          </p>

          <ul>
            <li><strong>Amount match:</strong> Transaction amount matches invoice/bill amount exactly</li>
            <li><strong>Date proximity:</strong> Transaction date is within 7 days of invoice/bill date</li>
            <li><strong>Contact match:</strong> Payee name matches contact name in Xero</li>
          </ul>

          <p>
            <strong>Pro Tip:</strong> Improve matching accuracy by ensuring invoice/bill payee names match bank statement descriptions. Use consistent naming (e.g., "ABC Corp" everywhere, not "ABC Corporation" sometimes and "ABC Corp" other times).
          </p>

          <h3>Setting Up Bank Rules for Auto-Categorization</h3>

          <p>
            Bank rules automatically categorize and code transactions, saving 5-10 minutes per reconciliation:
          </p>

          <ol>
            <li>Go to Accounting → Bank Accounts → Select account → <strong>Manage Account</strong> → <strong>Bank Rules</strong></li>
            <li>Click <strong>Create Rule</strong></li>
            <li>Set conditions: "If Description contains 'STARBUCKS'"</li>
            <li>Set action: "Assign to account '820 - Meals & Entertainment'" and "Apply 10% GST"</li>
            <li>Click <strong>Save</strong></li>
          </ol>

          <p>
            Rules apply to all future imported transactions and can be retroactively applied to existing unreconciled transactions. Create 10-15 rules for common vendors to automate 80% of categorization.
          </p>

          <h2 id="best-practices">Best Practices for Xero Bank Statement Imports</h2>

          <h3>Import Frequency Recommendations</h3>

          <ul>
            <li>
              <strong>Daily reconciliation:</strong> Ideal for high-transaction businesses. Use bank feeds for automatic daily updates. Spend 10-15 minutes daily matching transactions.
            </li>
            <li>
              <strong>Weekly reconciliation:</strong> Good balance for most small businesses. Import CSV files or check bank feed transactions weekly. Prevents backlog buildup.
            </li>
            <li>
              <strong>Monthly reconciliation:</strong> Minimum recommendation. Import full month statements at month-end. Allows for comprehensive review but takes 30-60 minutes per account.
            </li>
            <li>
              <strong>Real-time (bank feeds):</strong> Best practice for all businesses. Set up once, transactions auto-sync daily. Only requires categorization and matching.
            </li>
          </ul>

          <h3>Avoiding Duplicate Transactions</h3>

          <ul>
            <li>
              <strong>Check date ranges:</strong> Before importing CSV, verify the date range doesn't overlap with existing transactions. Use Xero's transaction search to confirm.
            </li>
            <li>
              <strong>Don't mix methods:</strong> If using bank feeds, don't also import CSV for the same period unless absolutely necessary. Choose one method per account.
            </li>
            <li>
              <strong>Use Xero's duplicate detection:</strong> When importing, Xero flags potential duplicates. Review carefully before confirming. Better safe than sorry.
            </li>
            <li>
              <strong>Regular account reconciliation:</strong> Reconcile transactions promptly after import. This makes duplicates obvious when your balance doesn't match the bank.
            </li>
          </ul>

          <h3>Setting Up Efficient Bank Rules</h3>

          <p>
            Bank rules are Xero's most powerful reconciliation automation feature:
          </p>

          <ul>
            <li>
              <strong>Start with high-frequency vendors:</strong> Create rules for merchants you pay monthly or weekly (utilities, subscriptions, rent, payroll). These provide the biggest time savings.
            </li>
            <li>
              <strong>Use specific conditions:</strong> Instead of "contains 'Amazon'" (too broad), use "contains 'Amazon AWS'" for hosting or "Amazon Business" for supplies. This prevents miscategorization.
            </li>
            <li>
              <strong>Include amount conditions for fixed payments:</strong> For subscriptions with fixed amounts, add "Amount equals $29.99" to ensure the rule only applies when amount matches exactly.
            </li>
            <li>
              <strong>Test rules on existing transactions:</strong> After creating a rule, apply it to unreconciled transactions to verify it works correctly before relying on it for future imports.
            </li>
            <li>
              <strong>Review and refine quarterly:</strong> Periodically review your bank rules. Delete unused rules, update outdated ones, and add new rules for recurring vendors.
            </li>
          </ul>

          <h3>Categorization Tips for Faster Reconciliation</h3>

          <ul>
            <li>
              <strong>Use tracking categories:</strong> Set up tracking categories for projects, departments, or locations. Apply these during reconciliation for detailed reporting.
            </li>
            <li>
              <strong>Standardize payee names:</strong> When creating expenses or bills, use consistent payee names that match bank descriptions. This improves Xero's auto-matching.
            </li>
            <li>
              <strong>Leverage Statement Desk categorization:</strong> If converting PDFs, Statement Desk's AI categorization provides a head start. Transactions arrive in Xero pre-categorized.
            </li>
            <li>
              <strong>Review uncategorized monthly:</strong> Run the "Uncategorized Transactions" report monthly to catch any items missed during reconciliation.
            </li>
          </ul>

          <h2 id="troubleshooting">Troubleshooting Common Xero Import Issues</h2>

          <h3>1. Date Format Errors</h3>

          <p>
            <strong>Symptom:</strong> Xero says "Date format not recognized" or dates appear incorrect after import.
          </p>

          <p><strong>Solutions:</strong></p>

          <ul>
            <li>Check your Xero organization settings: Settings → General Settings → Date Format. Ensure your CSV matches this format.</li>
            <li>Most Xero accounts use DD/MM/YYYY (UK/AU) or MM/DD/YYYY (US). Convert dates in Excel using TEXT function: =TEXT(A2,"DD/MM/YYYY")</li>
            <li>Use ISO format (YYYY-MM-DD) which Xero recognizes universally regardless of region settings</li>
            <li>Remove any date formatting in Excel - save dates as plain text before exporting to CSV</li>
            <li>Statement Desk automatically detects your Xero region and formats dates correctly</li>
          </ul>

          <h3>2. Balance Mismatches After Import</h3>

          <p>
            <strong>Symptom:</strong> Xero balance doesn't match your bank statement balance after importing transactions.
          </p>

          <p><strong>Solutions:</strong></p>

          <ul>
            <li>Check for duplicate transactions - search for same date/amount combinations and delete duplicates</li>
            <li>Verify opening balance is correct in Xero before import</li>
            <li>Ensure all transactions in date range were imported - compare transaction count with bank statement</li>
            <li>Check if pending/cleared status affects balance - Xero shows cleared transactions only</li>
            <li>Look for transactions with incorrect signs (debits as credits or vice versa)</li>
            <li>Run Bank Reconciliation Summary report to identify discrepancies</li>
          </ul>

          <h3>3. Duplicate Transactions Appearing</h3>

          <p>
            <strong>Symptom:</strong> Same transaction appears multiple times after import.
          </p>

          <p><strong>Solutions:</strong></p>

          <ul>
            <li>Check if you imported overlapping date ranges from multiple files</li>
            <li>If using bank feeds AND CSV import, choose one method - don't double-import</li>
            <li>Use Xero's duplicate detection during import - carefully review the warning screen</li>
            <li>Manually delete duplicates: Find transaction → Options → Delete → Confirm</li>
            <li>For bulk deletion, export transactions to Excel, identify duplicates, then delete via Xero API or contact support</li>
            <li>Statement Desk includes duplicate detection across multiple statement uploads to prevent this</li>
          </ul>

          <h3>4. Amounts Not Recognized as Numbers</h3>

          <p>
            <strong>Symptom:</strong> Import fails with "Invalid amount" or amounts appear as text in Xero.
          </p>

          <p><strong>Solutions:</strong></p>

          <ul>
            <li>Remove all currency symbols ($, £, €, ¥) from amount fields</li>
            <li>Remove thousands separators - change 1,234.56 to 1234.56</li>
            <li>Use period (.) for decimal separator, not comma - even in European locales for CSV</li>
            <li>Ensure negative amounts use minus sign (-100.00), not parentheses (100.00)</li>
            <li>Format amount column as Number with 2 decimal places in Excel before saving CSV</li>
            <li>Check for hidden characters or spaces in amount cells - these break number recognition</li>
          </ul>

          <h3>5. "No Transactions Found" Error</h3>

          <p>
            <strong>Symptom:</strong> Xero says "No transactions found in file" even though CSV has data.
          </p>

          <p><strong>Solutions:</strong></p>

          <ul>
            <li>Verify file has data rows below header row - not just headers</li>
            <li>Check delimiter is comma (,) not semicolon (;) or tab - save as "CSV Comma Delimited" in Excel</li>
            <li>Remove all footer text, account summaries, and extra header rows from CSV</li>
            <li>Ensure file encoding is UTF-8 - save as "CSV UTF-8" in Excel for compatibility</li>
            <li>Check for blank rows between data - remove all empty rows</li>
            <li>Open CSV in text editor (Notepad) to verify structure: one line per transaction, commas between fields</li>
          </ul>

          <h3>6. CSV Column Mapping Confusion</h3>

          <p>
            <strong>Symptom:</strong> Unsure which CSV columns to map to which Xero fields during import.
          </p>

          <p><strong>Solutions:</strong></p>

          <ul>
            <li>Use "Generic" format for first import, then save as "Custom" format for reuse</li>
            <li>Required mappings: Date → Date, Description/Merchant → Payee, Amount → Amount (or Debit/Credit)</li>
            <li>Optional but recommended: Reference number → Reference, Category code → Code</li>
            <li>If unsure, use Statement Desk's Xero format - no mapping needed, automatically correct</li>
            <li>Test with small sample file (5-10 transactions) before importing full statement</li>
            <li>Consult Xero's import guide: Help → Bank Accounts → Import Statement → View Guide</li>
          </ul>

          <h3>7. Special Characters Display Incorrectly</h3>

          <p>
            <strong>Symptom:</strong> Merchant names with accents or symbols show as gibberish (Café → CafÃ©).
          </p>

          <p><strong>Solutions:</strong></p>

          <ul>
            <li>Save CSV as UTF-8 encoding in Excel: Save As → CSV UTF-8 (not standard CSV)</li>
            <li>If using text editor (Notepad++), select "UTF-8 without BOM" encoding when saving</li>
            <li>Xero expects UTF-8 encoding for international characters</li>
            <li>Statement Desk uses proper UTF-8 encoding automatically, preserving all special characters</li>
          </ul>

          <h3>8. Import Fails with Large Files</h3>

          <p>
            <strong>Symptom:</strong> Import times out or fails with "File too large" error.
          </p>

          <p><strong>Solutions:</strong></p>

          <ul>
            <li>Xero limits imports to 1MB (~1,000 transactions) per file</li>
            <li>Split large statements into smaller files by date range (monthly or quarterly)</li>
            <li>Import each file separately to the same account</li>
            <li>For very large historical imports, contact Xero support for assistance</li>
            <li>Consider using bank feeds for ongoing transactions and CSV only for historical data</li>
          </ul>

          <h2 id="faq">Frequently Asked Questions</h2>

          <FAQSection faqs={faqs} allowMultiple={false} />

          <h2 id="conclusion">Conclusion: Master Xero Bank Statement Imports</h2>

          <p>
            Importing bank statements into Xero doesn't have to be complicated or time-consuming. By understanding the three main import methods and choosing the right approach for your situation, you can streamline your bookkeeping workflow and maintain accurate financial records with minimal effort.
          </p>

          <h3>Method Recap and Recommendations</h3>

          <div className="not-prose my-8 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
            <ul className="space-y-3 text-gray-800">
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold text-xl mt-1">1</span>
                <div>
                  <strong className="text-blue-900">Direct Bank Feed (Best for Ongoing Use):</strong>
                  <p className="text-gray-700 mt-1">Set up once, transactions sync automatically daily. Supports 1,000+ banks. Eliminates manual import work entirely. Recommended for all businesses whose banks support feeds.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold text-xl mt-1">2</span>
                <div>
                  <strong className="text-blue-900">CSV/OFX Import (Best for Historical Data):</strong>
                  <p className="text-gray-700 mt-1">Manual upload of bank-provided files. Works with any bank. Essential for statements older than 90 days or when feeds aren't available. Requires proper CSV formatting.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold text-xl mt-1">3</span>
                <div>
                  <strong className="text-blue-900">Statement Desk AI Conversion (Best for PDF Statements):</strong>
                  <p className="text-gray-700 mt-1">Convert PDF statements to Xero-formatted CSV in 30 seconds. 97% accuracy, automatic categorization, works with 200+ banks. Ideal when CSV export isn't available. Free tier available.</p>
                </div>
              </li>
            </ul>
          </div>

          <h3>Key Takeaways for Xero Users</h3>

          <ul>
            <li>
              <strong>Prioritize bank feeds for convenience:</strong> If your bank supports Xero feeds, set them up first. This provides the best long-term workflow with minimal manual intervention.
            </li>
            <li>
              <strong>Master CSV formatting for flexibility:</strong> Understanding Xero's CSV requirements (DD/MM/YYYY dates, proper column structure) ensures smooth imports when feeds aren't available.
            </li>
            <li>
              <strong>Use AI for PDF conversion:</strong> Don't waste hours manually transcribing PDF statements. Statement Desk converts them to import-ready CSV files in seconds with higher accuracy than manual entry.
            </li>
            <li>
              <strong>Create bank rules early:</strong> Invest 30 minutes setting up bank rules for recurring vendors. This automation saves 5-10 minutes per reconciliation session going forward.
            </li>
            <li>
              <strong>Reconcile regularly:</strong> Weekly or monthly reconciliation prevents backlog buildup and catches errors early when they're easier to fix.
            </li>
          </ul>

          <h3>Next Steps</h3>

          <ol>
            <li>
              <strong>Assess your current method:</strong> Review how you currently import transactions. Can you switch to bank feeds? Are you spending too much time on manual CSV preparation?
            </li>
            <li>
              <strong>Try Statement Desk free:</strong> Convert your first PDF statement to Xero-formatted CSV in 30 seconds. See how much time AI-powered conversion saves compared to manual methods.
            </li>
            <li>
              <strong>Set up bank rules:</strong> Identify your 10 most frequent vendors and create bank rules for automatic categorization. This compounds time savings month after month.
            </li>
            <li>
              <strong>Learn more about Xero:</strong> Read our related guides on <Link href="/blog/bank-statement-to-csv-converter" className="text-blue-600 hover:text-blue-700 underline">CSV formatting</Link> and <Link href="/blog/import-bank-statements-quickbooks" className="text-blue-600 hover:text-blue-700 underline">QuickBooks imports</Link> for comprehensive accounting knowledge.
            </li>
          </ol>

          <h3>Related Resources</h3>

          <ul>
            <li>
              <Link href="/blog/import-bank-statements-quickbooks" className="text-blue-600 hover:text-blue-700 underline">How to Import Bank Statements into QuickBooks</Link> - If you also use QuickBooks or are comparing platforms
            </li>
            <li>
              <Link href="/blog/bank-statement-to-csv-converter" className="text-blue-600 hover:text-blue-700 underline">Bank Statement to CSV Converter Guide</Link> - Deep dive into CSV formatting best practices
            </li>
            <li>
              <Link href="/blog/how-to-convert-pdf-bank-statement-to-excel" className="text-blue-600 hover:text-blue-700 underline">Convert PDF Bank Statement to Excel</Link> - Alternative to CSV if you prefer Excel analysis first
            </li>
            <li>
              <Link href="/blog/best-bank-statement-converter-tools" className="text-blue-600 hover:text-blue-700 underline">Best Bank Statement Converter Tools</Link> - Comparison of top 10 conversion tools including Statement Desk
            </li>
          </ul>

          <CTASection
            variant="footer"
            title="Transform Your Xero Workflow with AI-Powered Imports"
            description="Join thousands of accountants and businesses who trust Statement Desk to convert PDF bank statements to Xero-ready CSV files in seconds. No more manual formatting, no more import errors."
            buttonText="Start Converting for Free"
            buttonLink="/auth/signup?utm_source=blog&utm_campaign=xero-import-footer"
          />
        </div>
      </BlogLayout>
    </>
  );
}
