import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'
import { Parser } from 'json2csv'

export async function POST(request) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { fileId, format } = await request.json()
    
    if (!fileId || !format) {
      return NextResponse.json(
        { error: 'File ID and format are required' },
        { status: 400 }
      )
    }

    if (!['csv', 'xlsx'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Supported formats: csv, xlsx' },
        { status: 400 }
      )
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
      Amount: transaction.amount,
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
        { Metric: 'Total Credits', Value: transactions.filter(t => t.transaction_type === 'credit').reduce((sum, t) => sum + (t.amount || 0), 0) },
        { Metric: 'Total Debits', Value: Math.abs(transactions.filter(t => t.transaction_type === 'debit').reduce((sum, t) => sum + (t.amount || 0), 0)) },
        { Metric: 'Net Amount', Value: transactions.reduce((sum, t) => sum + (t.amount || 0), 0) },
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

    // Store export record
    const { data: exportRecord } = await supabase
      .from('file_exports')
      .insert({
        file_id: fileId,
        user_id: user.id,
        format: format,
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
        transaction_count: transactions.length,
        export_id: exportRecord?.id
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

  } catch (error) {
    console.error('Export API error:', error)
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