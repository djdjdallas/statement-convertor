import { XeroService } from './xero-service'
import { createServiceClient } from '@/lib/supabase/service'

export class XeroImportService {
  constructor() {
    this.xeroService = new XeroService()
    this.supabase = createServiceClient()
  }

  async importFile(fileId, userId, tenantId, bankAccountId, options = {}) {
    try {
      console.log('Importing file:', { fileId, userId, tenantId, bankAccountId })
      
      // Fetch file and its transactions
      const { data: file, error: fileError } = await this.supabase
        .from('files')
        .select(`
          *,
          transactions(*)
        `)
        .eq('id', fileId)
        .eq('user_id', userId)
        .single()

      if (fileError) {
        console.error('File fetch error:', fileError)
        throw new Error(`File not found: ${fileError.message}`)
      }
      
      if (!file) {
        throw new Error('File not found')
      }

      if (!file.transactions || file.transactions.length === 0) {
        throw new Error('No transactions found in file')
      }

      // Get Xero access token
      const { data: connection, error: connError } = await this.supabase
        .from('xero_connections')
        .select('*')
        .eq('user_id', userId)
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .single()

      if (connError || !connection) {
        throw new Error('Xero connection not found')
      }

      // Decrypt tokens
      const { decrypt } = await import('@/lib/encryption')
      let accessToken = connection.access_token
      let refreshToken = connection.refresh_token
      
      // Check if tokens need decryption
      if (!accessToken.startsWith('eyJ')) {
        accessToken = decrypt(connection.access_token)
        refreshToken = decrypt(connection.refresh_token)
      }

      // Import transactions to Xero
      const result = await this.xeroService.importTransactions(
        accessToken,
        refreshToken,
        tenantId,
        bankAccountId,
        file.transactions,
        {
          description: options.description || `Import from ${file.original_filename}`,
          reference: options.jobId || file.id,
          ...options
        }
      )

      // Update tokens if refreshed
      if (result.newTokens) {
        const { encrypt } = await import('@/lib/encryption')
        await this.supabase
          .from('xero_connections')
          .update({
            access_token: encrypt(result.newTokens.access_token),
            refresh_token: encrypt(result.newTokens.refresh_token),
            token_expires_at: new Date(Date.now() + result.newTokens.expires_in * 1000).toISOString()
          })
          .eq('id', connection.id)
      }

      // Record the import
      const { data: importRecord, error: importError } = await this.supabase
        .from('xero_imports')
        .insert({
          user_id: userId,
          file_id: fileId,
          tenant_id: tenantId,
          bank_account_id: bankAccountId,
          transaction_count: file.transactions.length,
          status: 'completed',
          xero_bank_transaction_ids: result.bankTransactionIds,
          import_summary: result.summary,
          bulk_job_id: options.jobId
        })
        .select()
        .single()

      if (!importError) {
        // Update file to mark as imported
        await this.supabase
          .from('files')
          .update({ 
            xero_import_id: importRecord.id,
            xero_imported_at: new Date().toISOString()
          })
          .eq('id', fileId)
      }

      return {
        success: true,
        importId: importRecord?.id,
        transactionCount: file.transactions.length,
        summary: result.summary
      }

    } catch (error) {
      console.error('Import service error:', error)
      
      // Check if this is a refresh token error
      const isTokenExpired = error.message?.includes('Refresh token has expired')
      
      // Record failed import if jobId provided
      if (options.jobId) {
        await this.supabase
          .from('xero_imports')
          .insert({
            user_id: userId,
            file_id: fileId,
            tenant_id: tenantId,
            bank_account_id: bankAccountId,
            status: 'failed',
            error_message: error.message,
            error_code: isTokenExpired ? 'XERO_TOKEN_EXPIRED' : null,
            bulk_job_id: options.jobId
          })
      }

      // Re-throw with enhanced error info
      if (isTokenExpired) {
        const tokenError = new Error('Xero session expired. Please reconnect your Xero account.')
        tokenError.code = 'XERO_TOKEN_EXPIRED'
        tokenError.requiresReconnect = true
        throw tokenError
      }

      throw error
    }
  }

  async getImportStatus(importId, userId) {
    const { data, error } = await this.supabase
      .from('xero_imports')
      .select('*')
      .eq('id', importId)
      .eq('user_id', userId)
      .single()

    if (error) {
      throw error
    }

    return data
  }

  async getFileImports(fileId, userId) {
    const { data, error } = await this.supabase
      .from('xero_imports')
      .select('*')
      .eq('file_id', fileId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return data
  }
}