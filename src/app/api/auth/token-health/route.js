import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { tokenService } from '@/lib/google/token-service'

export async function GET(request) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get workspace ID from query params if provided
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')
    
    // Check token health
    const health = await tokenService.checkTokenHealth(user.id, workspaceId)
    
    // Add recommendations based on health status
    let recommendations = []
    
    switch (health.status) {
      case 'missing':
        recommendations.push('Connect your Google account to use Google Drive features')
        break
      case 'expired':
        if (health.has_refresh_token) {
          recommendations.push('Your token will be automatically refreshed on next use')
        } else {
          recommendations.push('Reconnect your Google account to continue using Google Drive features')
        }
        break
      case 'expiring_soon':
        recommendations.push(`Token expires in ${health.minutes_until_expiry} minutes. It will be automatically refreshed.`)
        break
      case 'healthy':
        if (health.refresh_count > 50) {
          recommendations.push('Consider reconnecting your Google account for optimal performance')
        }
        break
    }
    
    return NextResponse.json({
      ...health,
      recommendations,
      workspace_id: workspaceId
    })
  } catch (error) {
    console.error('Error checking token health:', error)
    return NextResponse.json(
      { error: 'Failed to check token health' },
      { status: 500 }
    )
  }
}

// POST endpoint to manually refresh tokens
export async function POST(request) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { workspaceId } = await request.json()
    
    // Manually refresh the token
    const newTokens = await tokenService.refreshAccessToken(user.id, workspaceId)
    
    return NextResponse.json({
      success: true,
      expires_at: new Date(newTokens.expiry_date).toISOString(),
      message: 'Token refreshed successfully'
    })
  } catch (error) {
    console.error('Error refreshing token:', error)
    return NextResponse.json(
      { error: 'Failed to refresh token', details: error.message },
      { status: 500 }
    )
  }
}