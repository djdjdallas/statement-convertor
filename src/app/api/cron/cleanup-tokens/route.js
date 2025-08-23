import { NextResponse } from 'next/server'
import { tokenService } from '@/lib/google/token-service'
import { headers } from 'next/headers'

// This endpoint should be called by a cron job (e.g., Vercel Cron, GitHub Actions, or external service)
// It cleans up expired tokens that cannot be refreshed
export async function POST(request) {
  try {
    // Verify the request is from an authorized source
    const headersList = headers()
    const authHeader = headersList.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Run cleanup
    const deletedCount = await tokenService.cleanupExpiredTokens()
    
    // Log cleanup results
    console.log(`Token cleanup completed: ${deletedCount} expired tokens removed`)
    
    return NextResponse.json({
      success: true,
      deleted_count: deletedCount,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error in token cleanup:', error)
    return NextResponse.json(
      { error: 'Token cleanup failed', details: error.message },
      { status: 500 }
    )
  }
}

// GET endpoint for monitoring
export async function GET(request) {
  try {
    // This endpoint can be used for health checks
    return NextResponse.json({
      status: 'ready',
      service: 'token-cleanup',
      description: 'POST to this endpoint with proper authorization to clean up expired tokens'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Service unavailable' },
      { status: 503 }
    )
  }
}