import { NextRequest, NextResponse } from 'next/server'
import { createApiRouteClient } from '@/lib/supabase/api-route'
import * as XLSX from 'xlsx'
import { Parser } from 'json2csv'
import { createDriveService } from '@/lib/google/drive-service'
import { createSheetsService } from '@/lib/google/sheets-service'
import { hasGoogleIntegration } from '@/lib/google/auth'
import { createErrorResponse, GOOGLE_ERROR_CODES } from '@/lib/google/error-handler'

// Configure extended timeout for large exports
export const maxDuration = 300 // 5 minutes for Pro/Enterprise plans

export async function POST(request) {
  try {
    const supabase = await createApiRouteClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { fileId, format, destination = 'local' } = await request.json()
    
    if (!fileId || !format) {
      return NextResponse.json(
        { error: 'File ID and format are required' },
        { status: 400 }
      )
    }

    if (!['csv', 'xlsx', 'sheets'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Supported formats: csv, xlsx, sheets' },
        { status: 400 }
      )
    }

    if (!['local', 'drive'].includes(destination)) {
      return NextResponse.json(
        { error: 'Invalid destination. Supported destinations: local, drive' },
        { status: 400 }
      )
    }

    // Check Google integration if destination is drive
    if (destination === 'drive') {
      const hasGoogle = await hasGoogleIntegration(user.id, true) // Pass true for server-side
      if (!hasGoogle) {
        return NextResponse.json(
          { error: 'Google Drive not connected. Please connect your Google account first.' },
          { status: 400 }
        )
      }
    }

    // Verify user owns the file
    const { data: fileRecord, error: fileError } = await supabase
      .from('files')
      .select('id, original_filename, processing_status')
      .eq('id', fileId)
      .eq('user_id', user.id)
      .single()

    if (fileError || !fileRecord) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    if (fileRecord.processing_status !== 'completed') {
      return NextResponse.json(
        { error: 'File processing not completed' },
        { status: 400 }
      )
    }

    // Get all transactions for the file
    const { data: transactions, error: transactionError } = await supabase
      .from('transactions')
      .select('*')
      .eq('file_id', fileId)
      .order('date', { ascending: true })

    if (transactionError) {
      console.error('Transaction query error:', transactionError)
      return NextResponse.json(
        { error: 'Failed to fetch transaction data' },
        { status: 500 }
      )
    }

    if (!transactions || transactions.length === 0) {
      return NextResponse.json(
        { error: 'No transaction data found' },
        { status: 400 }
      )
    }

    // Format data for export
    const exportData = transactions.map(transaction => ({
      Date: transaction.date,
      Description: transaction.description,
      'Normalized Merchant': transaction.normalized_merchant || transaction.description,
      Category: transaction.category,
      Subcategory: transaction.subcategory || '',
      // Apply negative sign for debits/withdrawals
      Amount: transaction.transaction_type === 'debit' ? 
        (transaction.amount > 0 ? -transaction.amount : transaction.amount) : 
        transaction.amount,
      Balance: transaction.balance || '',
      Type: transaction.transaction_type,
      'Confidence %': transaction.confidence || '',
      'AI Reasoning': transaction.ai_reasoning || '',
      'Anomaly Detected': transaction.anomaly_data ? 'Yes' : 'No'
    }))

    let fileBuffer
    let mimeType
    let fileName

    if (format === 'csv') {
      // Generate CSV
      const parser = new Parser({
        fields: ['Date', 'Description', 'Normalized Merchant', 'Category', 'Subcategory', 'Amount', 'Balance', 'Type', 'Confidence %', 'AI Reasoning', 'Anomaly Detected']
      })
      const csvContent = parser.parse(exportData)
      fileBuffer = Buffer.from(csvContent, 'utf8')
      mimeType = 'text/csv'
      fileName = `${fileRecord.original_filename.replace('.pdf', '')}_transactions.csv`
    } else {
      // Generate Excel
      const ws = XLSX.utils.json_to_sheet(exportData)
      
      // Set column widths
      const colWidths = [
        { width: 12 }, // Date
        { width: 40 }, // Description
        { width: 30 }, // Normalized Merchant
        { width: 15 }, // Category
        { width: 15 }, // Subcategory
        { width: 12 }, // Amount
        { width: 12 }, // Balance
        { width: 10 }, // Type
        { width: 12 }, // Confidence %
        { width: 40 }, // AI Reasoning
        { width: 15 }  // Anomaly Detected
      ]
      ws['!cols'] = colWidths

      // Create workbook
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Transactions')
      
      // Add summary sheet
      const highConfidenceCount = transactions.filter(t => t.confidence >= 90).length
      const anomaliesDetected = transactions.filter(t => t.anomaly_data).length
      const avgConfidence = transactions.filter(t => t.confidence).reduce((sum, t) => sum + t.confidence, 0) / transactions.filter(t => t.confidence).length || 0
      
      const summaryData = [
        { Metric: 'Total Transactions', Value: transactions.length },
        { Metric: 'Total Credits', Value: transactions.filter(t => t.transaction_type === 'credit').reduce((sum, t) => sum + Math.abs(t.amount || 0), 0) },
        { Metric: 'Total Debits', Value: -transactions.filter(t => t.transaction_type === 'debit').reduce((sum, t) => sum + Math.abs(t.amount || 0), 0) },
        { Metric: 'Net Amount', Value: transactions.reduce((sum, t) => {
          const amount = t.amount || 0
          return sum + (t.transaction_type === 'debit' ? -Math.abs(amount) : Math.abs(amount))
        }, 0) },
        { Metric: 'AI Processed', Value: transactions.filter(t => t.confidence).length },
        { Metric: 'High Confidence (90%+)', Value: highConfidenceCount },
        { Metric: 'Average Confidence %', Value: avgConfidence.toFixed(1) },
        { Metric: 'Anomalies Detected', Value: anomaliesDetected }
      ]
      
      const summaryWs = XLSX.utils.json_to_sheet(summaryData)
      summaryWs['!cols'] = [{ width: 20 }, { width: 15 }]
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary')
      
      fileBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      fileName = `${fileRecord.original_filename.replace('.pdf', '')}_transactions.xlsx`
    }

    // Handle destination
    if (destination === 'drive') {
      // Upload to Google Drive
      try {
        let uploadResult;
        const bankName = fileRecord.original_filename.split('_')[0] || 'Statement'
        
        if (format === 'sheets') {
          // Create Google Sheets directly
          const sheetsService = await createSheetsService(user.id, true) // Pass true for server-side
          
          // Get AI insights if available
          const { data: aiInsights } = await supabase
            .from('ai_insights')
            .select('insights_data')
            .eq('file_id', fileId)
            .order('generated_at', { ascending: false })
            .limit(1)
            .single()
          
          uploadResult = await sheetsService.createStatementSheet(
            transactions,
            aiInsights?.insights_data || null,
            {
              fileName: fileRecord.original_filename.replace('.pdf', ''),
              bankName
            }
          )
        } else {
          // Upload Excel/CSV to Drive
          const driveService = await createDriveService(user.id, true) // Pass true for server-side
          uploadResult = await driveService.uploadStatementFile(
            fileBuffer,
            fileName,
            format,
            { 
              bankName,
              fileId: fileId,
              originalFileName: fileRecord.original_filename
            }
          )
        }

        // Store export record with Drive info
        const { data: exportRecord } = await supabase
          .from('file_exports')
          .insert({
            file_id: fileId,
            user_id: user.id,
            export_format: format,
            destination: 'google_drive',
            drive_file_id: uploadResult.id,
            drive_file_link: uploadResult.webViewLink,
            created_at: new Date().toISOString()
          })
          .select()
          .single()

        // Log export activity
        await supabase.from('usage_tracking').insert({
          user_id: user.id,
          action: 'export',
          details: {
            file_id: fileId,
            format: format,
            destination: 'google_drive',
            transaction_count: transactions.length,
            export_id: exportRecord?.id,
            drive_file_id: uploadResult.id
          }
        })

        // Track analytics event (use service role for server-side tracking)
        await supabase.from('analytics_events').insert({
          user_id: user.id,
          session_id: 'server_export',
          visitor_id: user.id,
          event_name: format === 'sheets' ? 'export_google_sheets' : `export_${format}`,
          event_category: 'conversion',
          event_label: 'Google Drive export',
          event_value: transactions.length,
          page_path: '/api/export',
          metadata: {
            file_id: fileId,
            format: format,
            destination: 'google_drive',
            transaction_count: transactions.length,
            drive_file_id: uploadResult.id
          }
        })

        // Return Drive upload result
        return NextResponse.json({
          success: true,
          destination: 'google_drive',
          data: {
            fileId: uploadResult.id,
            fileName: uploadResult.name,
            webViewLink: uploadResult.webViewLink,
            webContentLink: uploadResult.webContentLink,
            size: uploadResult.size,
            createdTime: uploadResult.createdTime
          }
        })
      } catch (driveError) {
        console.error('Google Drive upload error:', driveError)
        
        // Return Google-specific error response
        const errorResponse = createErrorResponse(driveError, {
          userId: user.id,
          operation: 'exportToGoogleDrive',
          fileId,
          format
        })
        
        return NextResponse.json(errorResponse, { 
          status: errorResponse.statusCode 
        })
      }
    } else {
      // Local download - existing behavior
      const { data: exportRecord } = await supabase
        .from('file_exports')
        .insert({
          file_id: fileId,
          user_id: user.id,
          export_format: format,
          destination: 'local',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      // Log export activity
      await supabase.from('usage_tracking').insert({
        user_id: user.id,
        action: 'export',
        details: {
          file_id: fileId,
          format: format,
          destination: 'local',
          transaction_count: transactions.length,
          export_id: exportRecord?.id
        }
      })

      // Track analytics event
      await supabase.from('analytics_events').insert({
        user_id: user.id,
        session_id: 'server_export',
        visitor_id: user.id,
        event_name: `export_${format}`,
        event_category: 'conversion',
        event_label: 'Local download',
        event_value: transactions.length,
        page_path: '/api/export',
        metadata: {
          file_id: fileId,
          format: format,
          destination: 'local',
          transaction_count: transactions.length
        }
      })

      // Return file as download
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Length': fileBuffer.length.toString(),
        },
      })
    }

  } catch (error) {
    console.error('Export API error:', error)
    
    // Check if it's a Google API error
    if (error.code && error.code.includes('/')) {
      const errorResponse = createErrorResponse(error, {
        operation: 'export'
      })
      return NextResponse.json(errorResponse, { 
        status: errorResponse.statusCode 
      })
    }
    
    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    )
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}