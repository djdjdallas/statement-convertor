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

    const { transactions, userProfile } = await request.json()
    
    // Get contextual suggestions based on user data
    const suggestions = financialAssistant.getSuggestedPrompts(
      transactions || [], 
      userProfile
    )

    // Get help message for new users
    const helpMessage = financialAssistant.generateHelpMessage(userProfile)

    return NextResponse.json({
      success: true,
      suggestions,
      helpMessage,
      tips: helpMessage.tips
    })

  } catch (error) {
    console.error('Chat suggestions API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        suggestions: [
          "How much did I spend last month?",
          "What's my biggest spending category?",
          "Show me my recent transactions",
          "Help me create a budget",
          "Analyze my spending trends",
          "Find unusual transactions"
        ]
      },
      { status: 500 }
    )
  }
}