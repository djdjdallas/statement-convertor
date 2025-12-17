import { NextRequest, NextResponse } from 'next/server'
import { createApiRouteClient } from '@/lib/supabase/api-route'
import * as XLSX from 'xlsx'
import { Parser } from 'json2csv'
import { trackExport, trackError } from '@/lib/posthog-server'

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

    const { transactionIds, format, fileIds } = await request.json()

    if (!format) {
      return NextResponse.json(
        { error: 'Format is required' },
        { status: 400 }
      )
    }

    if (!['csv', 'xlsx'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Supported formats: csv, xlsx' },
        { status: 400 }
      )
    }

    let transactions = []

    // If specific transaction IDs provided, fetch those
    if (transactionIds && transactionIds.length > 0) {
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select(`
          *,
          files!inner(user_id, original_filename)
        `)
        .in('id', transactionIds)
        .eq('files.user_id', user.id)
        .order('date', { ascending: true })

      if (txError) {
        console.error('Transaction query error:', txError)
        return NextResponse.json(
          { error: 'Failed to fetch transaction data' },
          { status: 500 }
        )
      }

      transactions = txData || []
    }
    // If file IDs provided, fetch all transactions from those files
    else if (fileIds && fileIds.length > 0) {
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select(`
          *,
          files!inner(user_id, original_filename)
        `)
        .in('file_id', fileIds)
        .eq('files.user_id', user.id)
        .order('date', { ascending: true })

      if (txError) {
        console.error('Transaction query error:', txError)
        return NextResponse.json(
          { error: 'Failed to fetch transaction data' },
          { status: 500 }
        )
      }

      transactions = txData || []
    }
    // Otherwise, fetch ALL user transactions
    else {
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select(`
          *,
          files!inner(user_id, original_filename)
        `)
        .eq('files.user_id', user.id)
        .order('date', { ascending: true })

      if (txError) {
        console.error('Transaction query error:', txError)
        return NextResponse.json(
          { error: 'Failed to fetch transaction data' },
          { status: 500 }
        )
      }

      transactions = txData || []
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
      'Source File': transaction.files?.original_filename || '',
      'Anomaly Detected': transaction.anomaly_data ? 'Yes' : 'No'
    }))

    let fileBuffer
    let mimeType
    let fileName

    const timestamp = new Date().toISOString().split('T')[0]

    if (format === 'csv') {
      // Generate CSV
      const parser = new Parser({
        fields: ['Date', 'Description', 'Normalized Merchant', 'Category', 'Subcategory', 'Amount', 'Balance', 'Type', 'Confidence %', 'Source File', 'Anomaly Detected']
      })
      const csvContent = parser.parse(exportData)
      fileBuffer = Buffer.from(csvContent, 'utf8')
      mimeType = 'text/csv'
      fileName = `all_transactions_${timestamp}.csv`
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
        { width: 30 }, // Source File
        { width: 15 }  // Anomaly Detected
      ]
      ws['!cols'] = colWidths

      // Create workbook
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'All Transactions')

      // Add summary sheet
      const highConfidenceCount = transactions.filter(t => t.confidence >= 90).length
      const anomaliesDetected = transactions.filter(t => t.anomaly_data).length
      const avgConfidence = transactions.filter(t => t.confidence).reduce((sum, t) => sum + t.confidence, 0) / transactions.filter(t => t.confidence).length || 0
      const uniqueFiles = [...new Set(transactions.map(t => t.file_id))].length

      const summaryData = [
        { Metric: 'Total Transactions', Value: transactions.length },
        { Metric: 'Total Files', Value: uniqueFiles },
        { Metric: 'Total Income', Value: transactions.filter(t => t.transaction_type === 'credit').reduce((sum, t) => sum + Math.abs(t.amount || 0), 0) },
        { Metric: 'Total Expenses', Value: -transactions.filter(t => t.transaction_type === 'debit').reduce((sum, t) => sum + Math.abs(t.amount || 0), 0) },
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
      summaryWs['!cols'] = [{ width: 25 }, { width: 20 }]
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary')

      // Add category breakdown sheet
      const categoryBreakdown = {}
      transactions.forEach(t => {
        const cat = t.category || 'Uncategorized'
        if (!categoryBreakdown[cat]) {
          categoryBreakdown[cat] = { income: 0, expenses: 0, count: 0 }
        }
        categoryBreakdown[cat].count++
        if (t.transaction_type === 'credit') {
          categoryBreakdown[cat].income += Math.abs(t.amount || 0)
        } else {
          categoryBreakdown[cat].expenses += Math.abs(t.amount || 0)
        }
      })

      const categoryData = Object.entries(categoryBreakdown)
        .map(([category, data]) => ({
          Category: category,
          'Transaction Count': data.count,
          'Total Income': data.income.toFixed(2),
          'Total Expenses': (-data.expenses).toFixed(2),
          'Net': (data.income - data.expenses).toFixed(2)
        }))
        .sort((a, b) => Math.abs(parseFloat(b['Net'])) - Math.abs(parseFloat(a['Net'])))

      const categoryWs = XLSX.utils.json_to_sheet(categoryData)
      categoryWs['!cols'] = [{ width: 20 }, { width: 18 }, { width: 15 }, { width: 15 }, { width: 15 }]
      XLSX.utils.book_append_sheet(wb, categoryWs, 'By Category')

      fileBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      fileName = `all_transactions_${timestamp}.xlsx`
    }

    // Log export activity
    await supabase.from('usage_tracking').insert({
      user_id: user.id,
      action: 'bulk_export',
      details: {
        format: format,
        destination: 'local',
        transaction_count: transactions.length,
        file_count: [...new Set(transactions.map(t => t.file_id))].length
      }
    })

    // Track analytics event
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      session_id: 'server_export',
      visitor_id: user.id,
      event_name: `bulk_export_${format}`,
      event_category: 'conversion',
      event_label: 'Bulk transaction export',
      event_value: transactions.length,
      page_path: '/api/export/all',
      metadata: {
        format: format,
        destination: 'local',
        transaction_count: transactions.length,
        file_count: [...new Set(transactions.map(t => t.file_id))].length
      }
    })

    // Track export in PostHog
    trackExport(user.id, {
      type: 'bulk',
      format,
      transactionCount: transactions.length,
      fileCount: [...new Set(transactions.map(t => t.file_id))].length,
      destination: 'download'
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
    console.error('Bulk export API error:', error)

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
