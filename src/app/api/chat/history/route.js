import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { financialAssistant } from '@/lib/ai/financial-assistant'

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

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId') || 'default'

    // Get conversation history
    const history = financialAssistant.getConversationHistory(user.id, conversationId)

    return NextResponse.json({
      success: true,
      history,
      conversationId
    })

  } catch (error) {
    console.error('Chat history API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
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

    const { conversationId } = await request.json()

    // Clear conversation history
    financialAssistant.clearConversationHistory(
      user.id, 
      conversationId || 'default'
    )

    // Log history clear
    await supabase.from('usage_tracking').insert({
      user_id: user.id,
      action: 'chat_history_clear',
      details: {
        conversation_id: conversationId || 'default',
        cleared_at: new Date().toISOString()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Conversation history cleared'
    })

  } catch (error) {
    console.error('Chat history clear API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}