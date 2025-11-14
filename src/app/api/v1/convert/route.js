/**
 * API v1: Convert Bank Statement
 *
 * POST /api/v1/convert
 *
 * Converts a bank statement PDF to Excel/CSV format using the B2B API.
 * Requires API key authentication.
 *
 * Request:
 * - Multipart form data with PDF file
 * - Optional: ai_enhanced (boolean)
 * - Optional: export_format ('excel' or 'csv')
 *
 * Response:
 * - Downloadable file or JSON with transaction data
 */

import { NextResponse } from 'next/server';
import { withApiAuth, apiError, apiSuccess, createRateLimitHeaders } from '@/lib/api-keys/middleware';
import { enhancedBankStatementParser } from '@/lib/enhanced-pdf-parser';
import { createClient } from '@supabase/supabase-js';
import ExcelJS from 'exceljs';
import { recordApiConversion } from '@/lib/stripe/metered-billing';

// Configure Vercel timeout
export const maxDuration = 300; // 5 minutes

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * POST handler for PDF conversion
 */
export async function POST(request) {
  const startTime = Date.now();

  // Step 1: Authenticate request
  const authResult = await withApiAuth(request, {
    requireQuota: true,
    billable: true
  });

  if (authResult.error) {
    return authResult.response;
  }

  const { user, quota, rateLimit, logRequest, incrementQuota } = authResult.data;

  try {
    // Step 2: Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file');
    const aiEnhanced = formData.get('ai_enhanced') === 'true';
    const exportFormat = formData.get('export_format') || 'excel';

    // Validate file presence
    if (!file) {
      await logRequest(400, {
        errorCode: 'MISSING_FILE',
        errorMessage: 'No file provided'
      });

      return apiError(
        'Validation error',
        'No file provided in request',
        'MISSING_FILE',
        400
      );
    }

    // Validate file type
    if (!file.type || file.type !== 'application/pdf') {
      await logRequest(400, {
        errorCode: 'INVALID_FILE_TYPE',
        errorMessage: `Invalid file type: ${file.type}`
      });

      return apiError(
        'Validation error',
        'Only PDF files are supported',
        'INVALID_FILE_TYPE',
        400
      );
    }

    // Validate file size (10MB limit)
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSizeBytes) {
      await logRequest(413, {
        errorCode: 'FILE_TOO_LARGE',
        errorMessage: `File size ${file.size} exceeds limit of ${maxSizeBytes}`,
        fileSizeBytes: file.size
      });

      return apiError(
        'Validation error',
        `File size exceeds 10MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`,
        'FILE_TOO_LARGE',
        413
      );
    }

    // Validate export format
    if (!['excel', 'csv'].includes(exportFormat)) {
      await logRequest(400, {
        errorCode: 'INVALID_FORMAT',
        errorMessage: `Invalid export format: ${exportFormat}`
      });

      return apiError(
        'Validation error',
        'Export format must be "excel" or "csv"',
        'INVALID_FORMAT',
        400
      );
    }

    // Step 3: Convert file to buffer for processing
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Step 4: Process PDF with enhanced parser
    console.log(`Processing PDF for user ${user.id}, AI enhanced: ${aiEnhanced}`);

    const parseResult = await enhancedBankStatementParser(buffer, {
      aiEnhanced,
      userId: user.id
    });

    if (!parseResult.success) {
      await logRequest(500, {
        errorCode: 'PROCESSING_FAILED',
        errorMessage: parseResult.error || 'PDF processing failed',
        fileSizeBytes: file.size
      });

      return apiError(
        'Processing error',
        parseResult.error || 'Failed to process PDF',
        'PROCESSING_FAILED',
        500
      );
    }

    const { transactions, metadata } = parseResult;

    if (!transactions || transactions.length === 0) {
      await logRequest(422, {
        errorCode: 'NO_TRANSACTIONS',
        errorMessage: 'No transactions found in PDF',
        fileSizeBytes: file.size
      });

      return apiError(
        'Processing error',
        'No transactions found in the PDF',
        'NO_TRANSACTIONS',
        422
      );
    }

    // Step 5: Increment usage quota
    const quotaIncremented = await incrementQuota(1);

    if (!quotaIncremented && !quota.overageAllowed) {
      // This shouldn't happen (middleware checks quota), but handle just in case
      await logRequest(429, {
        errorCode: 'QUOTA_INCREMENT_FAILED',
        errorMessage: 'Failed to increment quota'
      });

      return apiError(
        'Quota error',
        'Failed to increment usage quota',
        'QUOTA_INCREMENT_FAILED',
        429
      );
    }

    // Step 5a: Record to Stripe for metered billing
    const conversionId = `conv_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Get user's Stripe customer ID
    const { data: userProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (userProfile?.stripe_customer_id) {
      // Record the conversion to Stripe (non-blocking - don't fail if this fails)
      await recordApiConversion({
        userId: user.id,
        stripeCustomerId: userProfile.stripe_customer_id,
        quantity: 1,
        conversionId
      }).catch(err => {
        console.error('Failed to record Stripe meter event:', err);
        // Don't fail the request - billing failure shouldn't break API
      });
    }

    // Step 6: Generate export file
    let fileBuffer;
    let fileName;
    let mimeType;

    if (exportFormat === 'excel') {
      // Generate Excel file
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Transactions');

      // Add headers
      worksheet.columns = [
        { header: 'Date', key: 'date', width: 12 },
        { header: 'Description', key: 'description', width: 40 },
        { header: 'Amount', key: 'amount', width: 15 },
        { header: 'Balance', key: 'balance', width: 15 },
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Type', key: 'type', width: 10 }
      ];

      // Add transaction rows
      transactions.forEach(txn => {
        worksheet.addRow({
          date: txn.date,
          description: txn.description || txn.normalized_merchant || '',
          amount: txn.amount,
          balance: txn.balance,
          category: txn.category || '',
          type: txn.amount >= 0 ? 'Credit' : 'Debit'
        });
      });

      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Generate buffer
      fileBuffer = await workbook.xlsx.writeBuffer();
      fileName = `statement_${Date.now()}.xlsx`;
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    } else {
      // Generate CSV file
      const csvRows = [
        ['Date', 'Description', 'Amount', 'Balance', 'Category', 'Type'].join(',')
      ];

      transactions.forEach(txn => {
        csvRows.push([
          txn.date,
          `"${(txn.description || txn.normalized_merchant || '').replace(/"/g, '""')}"`,
          txn.amount,
          txn.balance,
          txn.category || '',
          txn.amount >= 0 ? 'Credit' : 'Debit'
        ].join(','));
      });

      fileBuffer = Buffer.from(csvRows.join('\n'));
      fileName = `statement_${Date.now()}.csv`;
      mimeType = 'text/csv';
    }

    // Step 7: Store conversion record in temporary storage (optional)
    // conversionId already defined above for Stripe integration

    // Calculate new quota values
    const newUsed = quota.used + 1;
    const newRemaining = quota.limit === -1 ? -1 : Math.max(0, quota.limit - newUsed);

    // Step 8: Log successful request
    await logRequest(200, {
      fileSizeBytes: file.size,
      transactionCount: transactions.length,
      aiEnhanced,
      errorCode: null,
      errorMessage: null
    });

    // Step 9: Return response
    // Option A: Return downloadable file
    const headers = createRateLimitHeaders(rateLimit);
    headers.set('Content-Type', mimeType);
    headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
    headers.set('X-Conversion-Id', conversionId);
    headers.set('X-Transaction-Count', transactions.length.toString());
    headers.set('X-Quota-Used', newUsed.toString());
    headers.set('X-Quota-Remaining', newRemaining.toString());

    return new NextResponse(fileBuffer, {
      status: 200,
      headers
    });

    // Option B: Return JSON with download URL (commented out - use if you want to store files)
    /*
    return apiSuccess({
      conversion_id: conversionId,
      download_url: `/api/v1/downloads/${conversionId}`,
      expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour
      transaction_count: transactions.length,
      date_range: {
        start: transactions[0]?.date,
        end: transactions[transactions.length - 1]?.date
      },
      usage: {
        used: newUsed,
        limit: quota.limit,
        remaining: newRemaining,
        resets_at: quota.resetAt
      },
      processing_time_ms: Date.now() - startTime
    }, createRateLimitHeaders(rateLimit));
    */

  } catch (error) {
    console.error('Error processing conversion:', error);

    await authResult.data.logRequest(500, {
      errorCode: 'INTERNAL_ERROR',
      errorMessage: error.message
    });

    return apiError(
      'Internal error',
      'An error occurred while processing your request',
      'INTERNAL_ERROR',
      500
    );
  }
}

/**
 * GET handler - returns API information
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/v1/convert',
    method: 'POST',
    description: 'Convert bank statement PDF to Excel or CSV',
    authentication: 'Required (API key)',
    parameters: {
      file: 'PDF file (multipart/form-data)',
      ai_enhanced: 'Boolean (optional, default: false)',
      export_format: 'String: "excel" or "csv" (optional, default: "excel")'
    },
    limits: {
      file_size_max: '10MB',
      rate_limit: 'Varies by plan tier'
    },
    documentation: 'https://statementdesk.com/docs/api/convert'
  });
}
