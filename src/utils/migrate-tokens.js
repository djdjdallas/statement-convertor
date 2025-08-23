#!/usr/bin/env node

/**
 * Token Migration Utility
 * Encrypts existing plain-text tokens in the database
 * 
 * Usage: node src/utils/migrate-tokens.js [--dry-run]
 */

import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 32)
const ENCRYPTION_ALGORITHM = 'aes-256-gcm'

// Initialize Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

/**
 * Encrypts text using AES-256-GCM
 */
function encrypt(text) {
  if (!ENCRYPTION_KEY) {
    throw new Error('TOKEN_ENCRYPTION_KEY is not configured')
  }

  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(
    ENCRYPTION_ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  )

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  }
}

/**
 * Check if a token is already encrypted (JSON format)
 */
function isEncrypted(token) {
  try {
    const parsed = JSON.parse(token)
    return parsed.encrypted && parsed.iv && parsed.authTag
  } catch {
    return false
  }
}

/**
 * Migrate tokens to encrypted format
 */
async function migrateTokens(dryRun = false) {
  console.log('Starting token migration...')
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`)
  
  try {
    // Generate encryption key if not exists
    if (!ENCRYPTION_KEY) {
      console.error('ERROR: TOKEN_ENCRYPTION_KEY is not set in environment variables')
      console.log('\nTo generate a new encryption key, run:')
      console.log('  node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"')
      console.log('\nThen add it to your .env.local file:')
      console.log('  TOKEN_ENCRYPTION_KEY=your_generated_key_here')
      process.exit(1)
    }

    // Fetch all tokens
    const { data: tokens, error } = await supabase
      .from('google_oauth_tokens')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    console.log(`Found ${tokens.length} token records`)

    let migratedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const token of tokens) {
      try {
        // Check if already encrypted
        if (isEncrypted(token.access_token)) {
          console.log(`✓ Token for user ${token.user_id} already encrypted, skipping`)
          skippedCount++
          continue
        }

        // Encrypt tokens
        const encryptedAccess = encrypt(token.access_token)
        const encryptedRefresh = token.refresh_token ? encrypt(token.refresh_token) : null

        if (dryRun) {
          console.log(`◯ Would encrypt token for user ${token.user_id}`)
          migratedCount++
        } else {
          // Update in database
          const { error: updateError } = await supabase
            .from('google_oauth_tokens')
            .update({
              access_token: JSON.stringify(encryptedAccess),
              refresh_token: encryptedRefresh ? JSON.stringify(encryptedRefresh) : null,
              updated_at: new Date().toISOString()
            })
            .eq('id', token.id)

          if (updateError) {
            throw updateError
          }

          console.log(`✓ Encrypted token for user ${token.user_id}`)
          migratedCount++
        }
      } catch (error) {
        console.error(`✗ Error processing token for user ${token.user_id}:`, error.message)
        errorCount++
      }
    }

    console.log('\nMigration Summary:')
    console.log(`  Total tokens: ${tokens.length}`)
    console.log(`  Migrated: ${migratedCount}`)
    console.log(`  Skipped (already encrypted): ${skippedCount}`)
    console.log(`  Errors: ${errorCount}`)

    if (dryRun) {
      console.log('\nThis was a DRY RUN. No changes were made.')
      console.log('Run without --dry-run flag to apply changes.')
    }

  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

/**
 * Generate a new encryption key
 */
function generateKey() {
  const key = crypto.randomBytes(32).toString('hex')
  console.log('Generated encryption key:')
  console.log(key)
  console.log('\nAdd this to your .env.local file:')
  console.log(`TOKEN_ENCRYPTION_KEY=${key}`)
}

// Parse command line arguments
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const generateKeyFlag = args.includes('--generate-key')

if (generateKeyFlag) {
  generateKey()
} else {
  // Add warning about backup
  console.log('⚠️  WARNING: This will encrypt all Google OAuth tokens in your database.')
  console.log('Make sure you have a backup before proceeding!')
  console.log('')
  
  // Give user time to cancel
  setTimeout(() => {
    migrateTokens(dryRun)
  }, 3000)
}