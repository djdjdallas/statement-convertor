import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { financialAssistant } from '@/lib/ai/financial-assistant'

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

    const { query, transactions, userProfile, conversationId } = await request.json()
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Valid query string is required' },
        { status: 400 }
      )
    }

    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json(
        { error: 'Valid transactions array is required' },
        { status: 400 }
      )
    }

    // Process the financial query
    const result = await financialAssistant.processFinancialQuery(
      user.id,
      query,
      transactions,
      userProfile,
      conversationId
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, response: result.response },
        { status: 500 }
      )
    }

    // Log chat usage
    await supabase.from('usage_tracking').insert({
      user_id: user.id,
      action: 'chat_query',
      details: {
        query: query.substring(0, 100), // Truncate for privacy
        intent: result.intent,
        transaction_count: transactions.length,
        conversation_id: conversationId || 'default',
        generated_at: new Date().toISOString()
      }
    })

    // Track analytics event
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      session_id: 'server_chat',
      visitor_id: user.id,
      event_name: 'ai_chat_query',
      event_category: 'feature_usage',
      event_label: result.intent || 'general',
      event_value: transactions.length,
      page_path: '/api/chat/query',
      metadata: {
        intent: result.intent,
        transaction_count: transactions.length,
        conversation_id: conversationId || 'default',
        has_data: result.data ? true : false
      }
    })

    return NextResponse.json({
      success: true,
      response: result.response,
      data: result.data,
      suggestions: result.suggestions,
      intent: result.intent,
      conversationId: result.conversationId
    })

  } catch (error) {
    console.error('Chat query API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        response: "I'm sorry, I encountered an error processing your question. Please try rephrasing it or contact support if the issue persists."
      },
      { status: 500 }
    )
  }
}