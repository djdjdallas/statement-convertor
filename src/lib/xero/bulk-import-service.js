import { XeroImportService } from './import-service'
import { ClientService } from '@/lib/clients/client-service'
import { createServiceClient } from '@/lib/supabase/service'

export class BulkImportService {
  constructor() {
    this.supabase = createServiceClient()
    this.importService = new XeroImportService()
    this.clientService = new ClientService()
  }

  async createBulkJob(userId, jobData) {
    const { name, description, fileIds, tenantId, bankAccountId, clientId } = jobData

    // Create bulk job record
    const { data: bulkJob, error } = await this.supabase
      .from('bulk_import_jobs')
      .insert({
        user_id: userId,
        name,
        description,
        client_id: clientId === 'none' ? null : clientId,
        tenant_id: tenantId,
        bank_account_id: bankAccountId,
        total_files: fileIds.length,
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error

    // Create file associations
    const fileRecords = fileIds.map(fileId => ({
      bulk_job_id: bulkJob.id,
      file_id: fileId,
      status: 'pending'
    }))

    const { error: filesError } = await this.supabase
      .from('bulk_import_files')
      .insert(fileRecords)

    if (filesError) throw filesError

    // Start processing
    this.processBulkJobAsync(bulkJob.id)

    return bulkJob
  }

  async processBulkJobAsync(bulkJobId) {
    try {
      // Update job status
      await this.supabase
        .from('bulk_import_jobs')
        .update({ 
          status: 'processing', 
          started_at: new Date().toISOString() 
        })
        .eq('id', bulkJobId)

      // Get job details
      const { data: bulkJob, error } = await this.supabase
        .from('bulk_import_jobs')
        .select(`
          *,
          bulk_import_files (
            id,
            file_id,
            status
          )
        `)
        .eq('id', bulkJobId)
        .single()

      if (error) throw error

      const results = {
        processedFiles: 0,
        successfulImports: 0,
        failedImports: 0,
        totalTransactions: 0,
        errors: []
      }

      // Process each file
      for (const fileRecord of bulkJob.bulk_import_files) {
        if (fileRecord.status !== 'pending') continue

        try {
          console.log('Processing file record:', {
            fileId: fileRecord.file_id,
            userId: bulkJob.user_id,
            jobId: bulkJobId
          })
          
          // Update file status
          await this.supabase
            .from('bulk_import_files')
            .update({ status: 'processing' })
            .eq('id', fileRecord.id)

          // Get file transactions count
          const { count: transactionCount } = await this.supabase
            .from('transactions')
            .select('*', { count: 'exact', head: true })
            .eq('file_id', fileRecord.file_id)

          // Create individual import
          const importResult = await this.importService.importFile(
            fileRecord.file_id,
            bulkJob.user_id,
            bulkJob.tenant_id,
            bulkJob.bank_account_id,
            {
              jobId: bulkJobId,
              description: bulkJob.description || `Bulk import: ${bulkJob.name}`
            }
          )

          // Update file record with import ID
          await this.supabase
            .from('bulk_import_files')
            .update({ 
              import_id: importResult.importId,
              status: 'completed' 
            })
            .eq('id', fileRecord.id)

          results.processedFiles++
          results.successfulImports++
          results.totalTransactions += importResult.transactionCount || 0

        } catch (error) {
          // Mark file as failed
          await this.supabase
            .from('bulk_import_files')
            .update({ 
              status: 'failed',
              error_message: error.message 
            })
            .eq('id', fileRecord.id)

          results.errors.push({
            fileId: fileRecord.file_id,
            error: error.message
          })
        }

        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // Calculate final results
      const { data: completedImports } = await this.supabase
        .from('bulk_import_files')
        .select(`
          import_id,
          xero_imports!inner (
            transaction_count,
            status,
            import_summary
          )
        `)
        .eq('bulk_job_id', bulkJobId)
        .not('import_id', 'is', null)

      if (completedImports) {
        // Count successful imports based on completed status
        results.successfulImports = completedImports.filter(
          item => item.xero_imports?.status === 'completed'
        ).length
        
        // Count failed imports
        results.failedImports = completedImports.filter(
          item => item.xero_imports?.status === 'failed'
        ).length
        
        // Get total imported transactions
        const importedTransactions = completedImports.reduce(
          (sum, item) => sum + (item.xero_imports?.transaction_count || 0), 0
        )
        
        console.log('Import summary:', {
          completedFiles: completedImports.length,
          importedTransactions,
          imports: completedImports.map(i => ({
            status: i.xero_imports?.status,
            count: i.xero_imports?.transaction_count,
            summary: i.xero_imports?.import_summary
          }))
        })
      }

      // Update bulk job with final status
      const finalStatus = results.errors.length === 0 ? 'completed' : 
                          results.processedFiles > 0 ? 'partial' : 'failed'

      await this.supabase
        .from('bulk_import_jobs')
        .update({
          status: finalStatus,
          processed_files: results.processedFiles,
          total_transactions: results.totalTransactions,
          successful_imports: results.successfulImports,
          failed_imports: results.failedImports,
          job_summary: results,
          completed_at: new Date().toISOString()
        })
        .eq('id', bulkJobId)

      console.log(`Bulk import job ${bulkJobId} completed:`, results)

    } catch (error) {
      console.error('Bulk import processing error:', error)
      
      await this.supabase
        .from('bulk_import_jobs')
        .update({
          status: 'failed',
          job_summary: { error: error.message },
          completed_at: new Date().toISOString()
        })
        .eq('id', bulkJobId)
    }
  }

  async getBulkJobs(userId, clientId = null) {
    let query = this.supabase
      .from('bulk_import_jobs')
      .select(`
        *,
        clients (name),
        bulk_import_files (
          id,
          status,
          files (original_filename)
        )
      `)
      .eq('user_id', userId)

    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async getBulkJobStatus(jobId, userId) {
    const { data: bulkJob, error } = await this.supabase
      .from('bulk_import_jobs')
      .select(`
        *,
        bulk_import_files (
          id,
          file_id,
          status,
          error_message,
          import_id,
          files (original_filename)
        )
      `)
      .eq('id', jobId)
      .eq('user_id', userId)
      .single()

    if (error) throw error

    // Calculate progress
    const files = bulkJob?.bulk_import_files || []
    const processedFiles = files.filter(f => f.status !== 'pending').length
    const successfulFiles = files.filter(f => f.status === 'completed').length
    const failedFiles = files.filter(f => f.status === 'failed').length
    
    return {
      ...bulkJob,
      progress: {
        total: files.length,
        processed: processedFiles,
        successful: successfulFiles,
        failed: failedFiles,
        percentComplete: files.length > 0 ? Math.round((processedFiles / files.length) * 100) : 0
      }
    }
  }
}