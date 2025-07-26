import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { enhancedBankStatementParser } from '@/lib/enhanced-pdf-parser'
import { checkUsageLimit, getTierLimits } from '@/lib/subscription-tiers'

export async function POST(request) {
  try {
    console.log('PDF processing API called')
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('Authentication error:', authError)
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    console.log('User authenticated:', user.id)

    // Get request data
    const { fileId } = await request.json()
    
    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      )
    }

    // Get user profile and check subscription limits
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()

    const userTier = userProfile?.subscription_tier || 'free'

    // Check usage limits for current month
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
    const { data: monthlyUsage } = await supabase
      .from('usage_tracking')
      .select('id')
      .eq('user_id', user.id)
      .eq('action', 'pdf_process')
      .gte('created_at', `${currentMonth}-01`)
      .lt('created_at', `${currentMonth}-32`)

    const currentUsage = monthlyUsage?.length || 0
    
    if (!checkUsageLimit(userTier, currentUsage)) {
      return NextResponse.json(
        { error: 'Monthly processing limit exceeded. Please upgrade your plan.' },
        { status: 429 }
      )
    }

    // Get file record from database
    const { data: fileRecord, error: fileError } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', user.id)
      .single()

    if (fileError || !fileRecord) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Update file status to processing
    await supabase
      .from('files')
      .update({ 
        processing_status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', fileId)

    try {
      // Download file from Supabase Storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('statement-files')
        .download(fileRecord.file_path)

      if (downloadError) {
        throw new Error(`Failed to download file: ${downloadError.message}`)
      }

      // Convert file to buffer
      const arrayBuffer = await fileData.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Parse PDF and extract transactions with AI enhancement
      const parseResult = await enhancedBankStatementParser.parsePDF(buffer)

      if (!parseResult.success) {
        throw new Error(parseResult.error)
      }

      const { data: extractedData } = parseResult

      // Save extracted transactions to database with AI-enhanced fields
      const transactionsToInsert = extractedData.transactions.map(transaction => ({
        file_id: fileId,
        date: transaction.date,
        description: transaction.description,
        amount: transaction.amount,
        balance: transaction.balance,
        transaction_type: transaction.type,
        category: transaction.category,
        subcategory: transaction.subcategory,
        confidence: transaction.confidence,
        normalized_merchant: transaction.normalizedMerchant,
        ai_reasoning: transaction.aiReasoning,
        anomaly_data: transaction.anomaly ? JSON.stringify(transaction.anomaly) : null,
        original_category: transaction.originalCategory
      }))

      if (transactionsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('transactions')
          .insert(transactionsToInsert)

        if (insertError) {
          console.error('Error inserting transactions:', insertError)
          throw new Error('Failed to save transaction data')
        }
      }

      // Save AI insights if available
      if (extractedData.aiInsights) {
        await supabase
          .from('ai_insights')
          .insert({
            file_id: fileId,
            user_id: user.id,
            insights_data: extractedData.aiInsights,
            generated_at: new Date().toISOString()
          })
      }

      // Update file record with completion status and metadata
      await supabase
        .from('files')
        .update({
          processing_status: 'completed',
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ai_enhanced: extractedData.metadata?.aiEnhanced || false,
          extraction_method: extractedData.metadata?.extractionMethod || 'Traditional'
        })
        .eq('id', fileId)

      // Log successful processing
      await supabase.from('usage_tracking').insert({
        user_id: user.id,
        action: 'pdf_process',
        details: {
          file_id: fileId,
          filename: fileRecord.original_filename,
          transaction_count: extractedData.transactions.length,
          bank_type: extractedData.bankType,
          processing_time: Date.now()
        }
      })

      // Return success response with extracted data
      return NextResponse.json({
        success: true,
        data: {
          fileId,
          transactionCount: extractedData.transactions.length,
          bankType: extractedData.bankType,
          accountInfo: extractedData.accountInfo,
          statementPeriod: extractedData.statementPeriod,
          preview: extractedData.transactions.slice(0, 5), // First 5 transactions for preview
          metadata: extractedData.metadata,
          aiInsights: extractedData.aiInsights
        }
      })

    } catch (processingError) {
      console.error('PDF processing error:', processingError)
      
      // Update file status to failed
      await supabase
        .from('files')
        .update({
          processing_status: 'failed',
          error_message: processingError.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', fileId)

      return NextResponse.json(
        { error: processingError.message || 'Failed to process PDF' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('API error:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
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