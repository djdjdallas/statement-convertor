import { NextResponse } from 'next/server'
import { createSheetsService } from '@/lib/google/sheets-service'
import { createApiRouteClient } from '@/lib/supabase/api-route'

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

    const { transactions, insights } = await request.json()

    // Test creating a Google Sheet
    try {
      const sheetsService = await createSheetsService(user.id)
      
      const result = await sheetsService.createStatementSheet(
        transactions,
        insights,
        {
          fileName: 'Test Statement Export',
          bankName: 'Test Bank'
        }
      )

      return NextResponse.json({
        success: true,
        ...result
      })
    } catch (sheetsError) {
      console.error('Sheets creation error:', sheetsError)
      return NextResponse.json(
        { error: 'Failed to create Google Sheet: ' + sheetsError.message },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Test sheets API error:', error)
    return NextResponse.json(
      { error: 'Test failed: ' + error.message },
      { status: 500 }
    )
  }
}