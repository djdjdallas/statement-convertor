import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/api-route'
import crypto from 'crypto'

// Marketplace webhook events
const WEBHOOK_EVENTS = {
  LICENSE_CHANGE: 'LICENSE_CHANGE',
  UNINSTALL: 'UNINSTALL',
  SUSPENSION: 'SUSPENSION',
  DELETION: 'DELETION',
  REACTIVATION: 'REACTIVATION',
  USER_LICENSE_CHANGE: 'USER_LICENSE_CHANGE'
}

export async function POST(request) {
  try {
    const headersList = headers()
    const signature = headersList.get('x-goog-signature')
    const timestamp = headersList.get('x-goog-timestamp')
    
    // Get request body
    const body = await request.text()
    
    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature, timestamp)) {
      console.error('Invalid webhook signature')
      return Response.json({ error: 'Invalid signature' }, { status: 401 })
    }
    
    // Parse webhook payload
    const payload = JSON.parse(body)
    const { eventType, eventId, timestamp: eventTimestamp, data } = payload
    
    console.log('Received marketplace webhook:', {
      eventType,
      eventId,
      timestamp: eventTimestamp
    })
    
    // Process webhook based on event type
    const supabase = await createClient()
    
    switch (eventType) {
      case WEBHOOK_EVENTS.LICENSE_CHANGE:
        await handleLicenseChange(supabase, data)
        break
        
      case WEBHOOK_EVENTS.UNINSTALL:
        await handleUninstall(supabase, data)
        break
        
      case WEBHOOK_EVENTS.SUSPENSION:
        await handleSuspension(supabase, data)
        break
        
      case WEBHOOK_EVENTS.DELETION:
        await handleDeletion(supabase, data)
        break
        
      case WEBHOOK_EVENTS.REACTIVATION:
        await handleReactivation(supabase, data)
        break
        
      case WEBHOOK_EVENTS.USER_LICENSE_CHANGE:
        await handleUserLicenseChange(supabase, data)
        break
        
      default:
        console.warn('Unknown webhook event type:', eventType)
    }
    
    // Store webhook event for auditing
    await supabase.from('marketplace_webhook_events').insert({
      event_id: eventId,
      event_type: eventType,
      event_data: data,
      processed_at: new Date().toISOString()
    })
    
    return Response.json({ success: true })
  } catch (error) {
    console.error('Marketplace webhook error:', error)
    return Response.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

// Verify webhook signature from Google
function verifyWebhookSignature(body, signature, timestamp) {
  if (!signature || !timestamp || !process.env.MARKETPLACE_WEBHOOK_SECRET) {
    return false
  }
  
  // Check timestamp to prevent replay attacks (within 5 minutes)
  const currentTime = Math.floor(Date.now() / 1000)
  const webhookTime = parseInt(timestamp)
  if (Math.abs(currentTime - webhookTime) > 300) {
    return false
  }
  
  // Verify signature
  const payload = `${timestamp}.${body}`
  const expectedSignature = crypto
    .createHmac('sha256', process.env.MARKETPLACE_WEBHOOK_SECRET)
    .update(payload)
    .digest('base64')
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

// Handle license change events
async function handleLicenseChange(supabase, data) {
  const { customerId, skuId, seats, planId } = data
  
  console.log('Processing license change:', {
    customerId,
    skuId,
    seats,
    planId
  })
  
  // Update domain configuration
  const { error } = await supabase
    .from('domain_configurations')
    .update({
      default_plan: planId,
      settings: {
        seats,
        sku_id: skuId
      },
      updated_at: new Date().toISOString()
    })
    .eq('domain', customerId)
  
  if (error) {
    console.error('Error updating domain configuration:', error)
    throw error
  }
  
  // Send notification to domain admin
  await sendAdminNotification(customerId, 'license_change', {
    newPlan: planId,
    seats
  })
}

// Handle uninstall events
async function handleUninstall(supabase, data) {
  const { customerId, domain } = data
  
  console.log('Processing uninstall:', { customerId, domain })
  
  // Update installation status
  const { error: installError } = await supabase
    .from('marketplace_installations')
    .update({
      status: 'uninstalled',
      uninstalled_at: new Date().toISOString()
    })
    .eq('domain', domain)
  
  if (installError) {
    console.error('Error updating installation:', installError)
  }
  
  // Revoke all OAuth tokens for the domain
  const { data: users } = await supabase
    .from('user_marketplace_associations')
    .select('user_id')
    .eq('domain', domain)
  
  if (users) {
    for (const user of users) {
      await revokeUserAccess(supabase, user.user_id)
    }
  }
  
  // Send uninstall notification
  await sendAdminNotification(domain, 'uninstall', {
    reason: 'Marketplace uninstall'
  })
}

// Handle suspension events
async function handleSuspension(supabase, data) {
  const { customerId, domain, reason } = data
  
  console.log('Processing suspension:', { customerId, domain, reason })
  
  // Update installation status
  await supabase
    .from('marketplace_installations')
    .update({
      status: 'suspended',
      suspension_reason: reason,
      suspended_at: new Date().toISOString()
    })
    .eq('domain', domain)
  
  // Notify domain admin
  await sendAdminNotification(domain, 'suspension', { reason })
}

// Handle deletion events
async function handleDeletion(supabase, data) {
  const { customerId, domain } = data
  
  console.log('Processing deletion:', { customerId, domain })
  
  // Soft delete installation record
  await supabase
    .from('marketplace_installations')
    .update({
      status: 'deleted',
      deleted_at: new Date().toISOString()
    })
    .eq('domain', domain)
  
  // Schedule data deletion (30 days)
  await scheduleDataDeletion(domain, 30)
}

// Handle reactivation events
async function handleReactivation(supabase, data) {
  const { customerId, domain } = data
  
  console.log('Processing reactivation:', { customerId, domain })
  
  // Update installation status
  await supabase
    .from('marketplace_installations')
    .update({
      status: 'active',
      suspension_reason: null,
      suspended_at: null,
      reactivated_at: new Date().toISOString()
    })
    .eq('domain', domain)
  
  // Notify domain admin
  await sendAdminNotification(domain, 'reactivation', {
    message: 'Your Statement Desk installation has been reactivated'
  })
}

// Handle individual user license changes
async function handleUserLicenseChange(supabase, data) {
  const { userId, domain, action, planId } = data
  
  console.log('Processing user license change:', {
    userId,
    domain,
    action,
    planId
  })
  
  if (action === 'assign') {
    // Create or update user association
    await supabase
      .from('user_marketplace_associations')
      .upsert({
        user_id: userId,
        domain,
        installation_id: `${domain}-individual`,
        association_type: 'domain_member',
        plan_id: planId
      })
  } else if (action === 'revoke') {
    // Remove user association
    await supabase
      .from('user_marketplace_associations')
      .delete()
      .eq('user_id', userId)
      .eq('domain', domain)
    
    // Revoke OAuth access
    await revokeUserAccess(supabase, userId)
  }
}

// Helper function to revoke user access
async function revokeUserAccess(supabase, userId) {
  try {
    // Delete OAuth tokens
    await supabase
      .from('google_oauth_tokens')
      .delete()
      .eq('user_id', userId)
    
    // You might also want to:
    // - Clear user sessions
    // - Remove cached data
    // - Send notification to user
  } catch (error) {
    console.error('Error revoking user access:', error)
  }
}

// Helper function to send admin notifications
async function sendAdminNotification(domain, type, data) {
  // This would integrate with your notification system
  // For now, we'll just log it
  console.log('Admin notification:', {
    domain,
    type,
    data,
    timestamp: new Date().toISOString()
  })
  
  // In production, you might:
  // - Send email to domain admin
  // - Post to Slack webhook
  // - Create in-app notification
}

// Helper function to schedule data deletion
async function scheduleDataDeletion(domain, daysUntilDeletion) {
  // This would integrate with your job queue system
  // For now, we'll just log it
  console.log('Scheduled data deletion:', {
    domain,
    daysUntilDeletion,
    scheduledFor: new Date(Date.now() + daysUntilDeletion * 24 * 60 * 60 * 1000).toISOString()
  })
  
  // In production, you might use:
  // - Background job queue (Bull, BullMQ)
  // - Scheduled cloud function
  // - Cron job
}