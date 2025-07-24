import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const sortBy = searchParams.get('sortBy') || 'date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    // Validate parameters
    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
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

    // Build query
    let query = supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('file_id', fileId)

    // Apply filters
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    if (search) {
      query = query.ilike('description', `%${search}%`)
    }

    // Apply sorting
    const validSortColumns = ['date', 'amount', 'description', 'category', 'balance']
    const validSortOrders = ['asc', 'desc']
    
    if (validSortColumns.includes(sortBy) && validSortOrders.includes(sortOrder)) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    } else {
      query = query.order('date', { ascending: false })
    }

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    // Execute query
    const { data: transactions, error: transactionError, count } = await query

    if (transactionError) {
      console.error('Transaction query error:', transactionError)
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      )
    }

    // Get summary statistics
    const { data: summary } = await supabase
      .from('transactions')
      .select('amount, transaction_type')
      .eq('file_id', fileId)

    const stats = {
      totalTransactions: count || 0,
      totalCredits: 0,
      totalDebits: 0,
      netAmount: 0,
      averageTransaction: 0
    }

    if (summary && summary.length > 0) {
      stats.totalCredits = summary
        .filter(t => t.transaction_type === 'credit')
        .reduce((sum, t) => sum + (t.amount || 0), 0)
      
      stats.totalDebits = summary
        .filter(t => t.transaction_type === 'debit')
        .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0)
      
      stats.netAmount = stats.totalCredits - stats.totalDebits
      stats.averageTransaction = summary.reduce((sum, t) => sum + Math.abs(t.amount || 0), 0) / summary.length
    }

    // Get unique categories for filtering
    const { data: categories } = await supabase
      .from('transactions')
      .select('category')
      .eq('file_id', fileId)
      .not('category', 'is', null)

    const uniqueCategories = [...new Set(categories?.map(c => c.category) || [])]
      .filter(Boolean)
      .sort()

    return NextResponse.json({
      success: true,
      data: {
        file: fileRecord,
        transactions,
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        },
        filters: {
          sortBy,
          sortOrder,
          category,
          search
        },
        stats,
        categories: uniqueCategories
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update transaction (for editing)
export async function PATCH(request) {
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

    const { transactionId, updates } = await request.json()
    
    if (!transactionId || !updates) {
      return NextResponse.json(
        { error: 'Transaction ID and updates are required' },
        { status: 400 }
      )
    }

    // Verify user owns the transaction (through file ownership)
    const { data: transaction } = await supabase
      .from('transactions')
      .select(`
        id,
        files!inner(user_id)
      `)
      .eq('id', transactionId)
      .single()

    if (!transaction || transaction.files.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Update transaction
    const allowedUpdates = ['description', 'category', 'transaction_type']
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key]
        return obj
      }, {})

    const { data: updatedTransaction, error: updateError } = await supabase
      .from('transactions')
      .update(filteredUpdates)
      .eq('id', transactionId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update transaction' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedTransaction
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}