/**
 * QuickBooks Sync Service
 *
 * Core engine for syncing Statement Desk transactions to QuickBooks
 * with batch processing, queue management, and error handling
 */

import { createClient } from '@supabase/supabase-js';
import { getCategoryMappings, getMerchantMappings } from './mapping-service.js';
import { convertTransaction, validateTransaction, validateMappings } from './transaction-converter.js';
import { batchCreateTransactions, createVendor, createCustomer } from './api-client.js';
import { updateLastSynced } from './auth-service.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Create a new sync job
 * @param {string} userId - User ID
 * @param {string} connectionId - QB connection ID
 * @param {string} fileId - File ID to sync
 * @param {Object} settings - Sync settings
 * @returns {Promise<Object>} Created sync job
 */
export async function createSyncJob(userId, connectionId, fileId, settings = {}) {
  // Get file's transactions
  const { data: transactions, error: txnError } = await supabase
    .from('transactions')
    .select('*')
    .eq('file_id', fileId)
    .order('date', { ascending: true });

  if (txnError) {
    console.error('Transaction fetch error:', txnError);
    console.error('Query params:', { fileId, userId });
    throw new Error(`Failed to fetch transactions for file: ${txnError.message || JSON.stringify(txnError)}`);
  }

  if (!transactions || transactions.length === 0) {
    throw new Error('No transactions found in file');
  }

  // Create sync job record
  const { data: job, error: jobError } = await supabase
    .from('quickbooks_sync_jobs')
    .insert({
      connection_id: connectionId,
      file_id: fileId,
      user_id: userId,
      status: 'pending',
      total_transactions: transactions.length,
      synced_transactions: 0,
      failed_transactions: 0,
      skipped_transactions: 0,
      sync_metadata: settings,
    })
    .select()
    .single();

  if (jobError) {
    throw new Error('Failed to create sync job');
  }

  // Create transaction sync records
  const transactionSyncs = transactions.map(txn => ({
    sync_job_id: job.id,
    transaction_id: txn.id,
    status: 'pending',
  }));

  await supabase
    .from('quickbooks_transaction_syncs')
    .insert(transactionSyncs);

  // Add to sync queue for processing
  await addToSyncQueue(job.id, transactions.map(t => t.id));

  return job;
}

/**
 * Add transactions to sync queue
 * @param {string} jobId - Sync job ID
 * @param {Array} transactionIds - Array of transaction IDs
 * @returns {Promise<Object>} Queue record
 */
async function addToSyncQueue(jobId, transactionIds) {
  const { data, error } = await supabase
    .from('quickbooks_sync_queue')
    .insert({
      sync_job_id: jobId,
      transaction_ids: transactionIds,
      priority: 5,
      scheduled_for: new Date(),
    })
    .select()
    .single();

  if (error) {
    throw new Error('Failed to add to sync queue');
  }

  return data;
}

/**
 * Process sync job - main sync logic
 * @param {string} jobId - Sync job ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Job results
 */
export async function processSyncJob(jobId, userId) {
  // Get job details
  const { data: job, error: jobError } = await supabase
    .from('quickbooks_sync_jobs')
    .select('*, quickbooks_connections(*)')
    .eq('id', jobId)
    .eq('user_id', userId)
    .single();

  if (jobError || !job) {
    throw new Error('Sync job not found');
  }

  // Update job status to processing
  await updateJobStatus(jobId, 'processing');

  try {
    // Get all transactions for this job
    const { data: transactionSyncs } = await supabase
      .from('quickbooks_transaction_syncs')
      .select('*, transactions(*)')
      .eq('sync_job_id', jobId)
      .eq('status', 'pending');

    const transactions = transactionSyncs.map(ts => ts.transactions);

    // Get mappings
    const [categoryMappings, merchantMappings] = await Promise.all([
      getCategoryMappings(job.connection_id),
      getMerchantMappings(job.connection_id),
    ]);

    // Build mapping lookup objects
    const categoryMap = {};
    categoryMappings.forEach(m => {
      categoryMap[m.category] = m;
    });

    const merchantMap = {};
    merchantMappings.forEach(m => {
      merchantMap[m.normalized_merchant] = m;
    });

    // Settings from job metadata
    const settings = {
      bankAccountId: job.sync_metadata.bankAccountId,
      minConfidence: job.sync_metadata.minConfidence || 70,
      includeOriginalDescription: job.sync_metadata.includeOriginalDescription !== false,
      includeFileReference: true,
      ...job.sync_metadata,
    };

    // Convert and batch transactions
    const convertedTransactions = [];
    const errors = [];

    for (let i = 0; i < transactions.length; i++) {
      const txn = transactions[i];
      const txnSync = transactionSyncs[i];

      try {
        // Validate transaction
        const validation = validateTransaction(txn);
        if (!validation.valid) {
          await updateTransactionSyncStatus(txnSync.id, 'failed', validation.errors.join(', '));
          errors.push({
            transaction_id: txn.id,
            errors: validation.errors,
          });
          continue;
        }

        // Get mappings for this transaction
        const txnMappings = {
          bankAccountId: settings.bankAccountId,
          categoryMapping: categoryMap[txn.category],
          merchantMapping: txn.normalized_merchant ? merchantMap[txn.normalized_merchant] : null,
        };

        // Validate mappings
        const mappingValidation = validateMappings(txn, txnMappings);
        if (!mappingValidation.valid) {
          await updateTransactionSyncStatus(txnSync.id, 'failed', mappingValidation.errors.join(', '));
          errors.push({
            transaction_id: txn.id,
            errors: mappingValidation.errors,
          });
          continue;
        }

        // Skip low confidence if threshold set
        if (txnMappings.categoryMapping?.confidence < settings.minConfidence) {
          await updateTransactionSyncStatus(
            txnSync.id,
            'skipped',
            `Low confidence (${txnMappings.categoryMapping.confidence}%)`
          );
          await incrementJobCounter(jobId, 'skipped_transactions');
          continue;
        }

        // Handle missing vendor/customer (create if needed)
        if (txn.normalized_merchant && !txnMappings.merchantMapping) {
          try {
            const isIncome = txn.amount > 0;
            let newEntity;

            if (isIncome) {
              // Create customer
              newEntity = await createCustomer(userId, {
                DisplayName: txn.normalized_merchant,
                Active: true,
              });
              txnMappings.merchantMapping = {
                qb_customer_id: newEntity.Id,
                qb_customer_name: newEntity.DisplayName,
              };
            } else {
              // Create vendor
              newEntity = await createVendor(userId, {
                DisplayName: txn.normalized_merchant,
                Active: true,
              });
              txnMappings.merchantMapping = {
                qb_vendor_id: newEntity.Id,
                qb_vendor_name: newEntity.DisplayName,
              };
            }
          } catch (createError) {
            console.error('Failed to create vendor/customer:', createError);
            // Continue without merchant mapping
          }
        }

        // Convert transaction
        const converted = convertTransaction(txn, txnMappings, settings);
        convertedTransactions.push({
          ...converted,
          _transactionSyncId: txnSync.id,
          _originalTransaction: txn,
        });
      } catch (error) {
        console.error('Error converting transaction:', error);
        await updateTransactionSyncStatus(txnSync.id, 'failed', error.message);
        errors.push({
          transaction_id: txn.id,
          error: error.message,
        });
      }
    }

    // Batch sync to QuickBooks
    const results = await batchSyncToQuickBooks(userId, convertedTransactions, jobId);

    // Update job status
    const finalStatus = errors.length === transactions.length ? 'failed'
      : errors.length > 0 ? 'partial'
      : 'completed';

    await updateJobStatus(jobId, finalStatus, errors);

    // Update last synced timestamp
    await updateLastSynced(userId);

    return {
      jobId,
      status: finalStatus,
      total: transactions.length,
      synced: results.successful,
      failed: results.failed,
      skipped: results.skipped,
      errors,
    };
  } catch (error) {
    console.error('Sync job failed:', error);
    await updateJobStatus(jobId, 'failed', [{ error: error.message }]);
    throw error;
  }
}

/**
 * Batch sync transactions to QuickBooks
 * @param {string} userId - User ID
 * @param {Array} transactions - Converted transactions
 * @param {string} jobId - Sync job ID
 * @returns {Promise<Object>} Sync results
 */
async function batchSyncToQuickBooks(userId, transactions, jobId) {
  const BATCH_SIZE = 25;
  let successful = 0;
  let failed = 0;
  let skipped = 0;

  // Process in batches
  for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
    const batch = transactions.slice(i, i + BATCH_SIZE);

    // Sync batch
    const results = await batchCreateTransactions(userId, batch);

    // Process results
    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      const txn = batch[j];

      if (result.success) {
        // Update transaction sync record
        const qbTxn = result.result;
        const qbLink = getQuickBooksLink(qbTxn, userId);

        await updateTransactionSyncStatus(
          txn._transactionSyncId,
          'synced',
          null,
          qbTxn.Id,
          txn.type,
          qbLink
        );

        await incrementJobCounter(jobId, 'synced_transactions');
        successful++;
      } else {
        // Update with error
        await updateTransactionSyncStatus(
          txn._transactionSyncId,
          'failed',
          result.error
        );

        await incrementJobCounter(jobId, 'failed_transactions');
        failed++;
      }
    }

    // Delay between batches to respect rate limits
    if (i + BATCH_SIZE < transactions.length) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
    }
  }

  return { successful, failed, skipped };
}

/**
 * Update sync job status
 * @param {string} jobId - Job ID
 * @param {string} status - New status
 * @param {Array} errors - Optional error log
 */
async function updateJobStatus(jobId, status, errors = []) {
  const updates = {
    status,
  };

  if (status === 'completed' || status === 'failed' || status === 'partial') {
    updates.completed_at = new Date();
  }

  if (errors.length > 0) {
    updates.error_log = errors;
  }

  await supabase
    .from('quickbooks_sync_jobs')
    .update(updates)
    .eq('id', jobId);
}

/**
 * Update transaction sync status
 */
async function updateTransactionSyncStatus(
  syncId,
  status,
  errorMessage = null,
  qbTransactionId = null,
  qbTransactionType = null,
  qbLink = null
) {
  const updates = {
    status,
    error_message: errorMessage,
    qb_transaction_id: qbTransactionId,
    qb_transaction_type: qbTransactionType,
    qb_link: qbLink,
  };

  if (status === 'synced') {
    updates.synced_at = new Date();
  }

  await supabase
    .from('quickbooks_transaction_syncs')
    .update(updates)
    .eq('id', syncId);
}

/**
 * Increment job counter
 */
async function incrementJobCounter(jobId, field) {
  await supabase.rpc('increment_sync_counter', {
    job_id: jobId,
    counter_field: field,
  });

  // Fallback if RPC doesn't exist
  const { data } = await supabase
    .from('quickbooks_sync_jobs')
    .select(field)
    .eq('id', jobId)
    .single();

  if (data) {
    await supabase
      .from('quickbooks_sync_jobs')
      .update({ [field]: (data[field] || 0) + 1 })
      .eq('id', jobId);
  }
}

/**
 * Get QuickBooks transaction link
 */
function getQuickBooksLink(qbTransaction, userId) {
  const environment = process.env.QUICKBOOKS_ENVIRONMENT || 'sandbox';
  const baseUrl = environment === 'production'
    ? 'https://app.qbo.intuit.com/app'
    : 'https://app.sandbox.qbo.intuit.com/app';

  const type = qbTransaction.Purchase ? 'purchase'
    : qbTransaction.Deposit ? 'deposit'
    : qbTransaction.JournalEntry ? 'journal'
    : 'transaction';

  const id = qbTransaction.Purchase?.Id
    || qbTransaction.Deposit?.Id
    || qbTransaction.JournalEntry?.Id
    || qbTransaction.Id;

  // Note: realmId would need to be fetched from connection
  return `${baseUrl}/${type}?txnId=${id}`;
}

/**
 * Get sync job status
 * @param {string} jobId - Job ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Job status
 */
export async function getSyncJobStatus(jobId, userId) {
  const { data: job, error } = await supabase
    .from('quickbooks_sync_jobs')
    .select('*')
    .eq('id', jobId)
    .eq('user_id', userId)
    .single();

  if (error || !job) {
    throw new Error('Sync job not found');
  }

  // Get transaction sync details
  const { data: transactionSyncs } = await supabase
    .from('quickbooks_transaction_syncs')
    .select('*')
    .eq('sync_job_id', jobId);

  return {
    ...job,
    progress: job.total_transactions > 0
      ? Math.round(((job.synced_transactions + job.failed_transactions + job.skipped_transactions) / job.total_transactions) * 100)
      : 0,
    transactionSyncs,
  };
}

/**
 * Retry failed transactions in a job
 * @param {string} jobId - Job ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Retry results
 */
export async function retryFailedTransactions(jobId, userId) {
  // Get failed transaction syncs
  const { data: failedSyncs } = await supabase
    .from('quickbooks_transaction_syncs')
    .select('*')
    .eq('sync_job_id', jobId)
    .eq('status', 'failed');

  if (!failedSyncs || failedSyncs.length === 0) {
    return { message: 'No failed transactions to retry' };
  }

  // Reset their status to pending
  await supabase
    .from('quickbooks_transaction_syncs')
    .update({
      status: 'pending',
      error_message: null,
      retry_count: supabase.sql`retry_count + 1`,
    })
    .in('id', failedSyncs.map(s => s.id));

  // Update job status back to processing
  await updateJobStatus(jobId, 'processing');

  // Reprocess the job
  return processSyncJob(jobId, userId);
}

/**
 * Cancel a sync job
 * @param {string} jobId - Job ID
 * @param {string} userId - User ID
 */
export async function cancelSyncJob(jobId, userId) {
  await supabase
    .from('quickbooks_sync_jobs')
    .update({ status: 'failed', error_log: [{ error: 'Cancelled by user' }] })
    .eq('id', jobId)
    .eq('user_id', userId);

  return { success: true };
}

/**
 * Get sync job history for user
 * @param {string} userId - User ID
 * @param {number} limit - Number of jobs to return
 * @returns {Promise<Array>} Sync job history
 */
export async function getSyncJobHistory(userId, limit = 20) {
  const { data, error } = await supabase
    .from('quickbooks_sync_jobs')
    .select('*, files(filename)')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error('Failed to fetch sync history');
  }

  return data || [];
}

export default {
  createSyncJob,
  processSyncJob,
  getSyncJobStatus,
  retryFailedTransactions,
  cancelSyncJob,
  getSyncJobHistory,
};
