/**
 * QuickBooks Transaction Converter
 *
 * Converts Statement Desk transactions to QuickBooks transaction format
 * (Purchases, Deposits, Journal Entries)
 */

/**
 * Convert Statement Desk transaction to QuickBooks format
 * @param {Object} transaction - Statement Desk transaction
 * @param {Object} mappings - Category and merchant mappings
 * @param {Object} settings - Conversion settings
 * @returns {Object} QuickBooks transaction object with type
 */
export function convertTransaction(transaction, mappings, settings = {}) {
  const isDeposit = transaction.amount > 0;
  const amount = Math.abs(transaction.amount);

  // Validate required mappings
  if (!mappings.bankAccountId) {
    throw new Error('Bank account ID is required');
  }

  if (!mappings.categoryMapping?.qb_account_id) {
    throw new Error(`No QuickBooks account mapping for category: ${transaction.category}`);
  }

  // Determine transaction type and convert
  if (isDeposit) {
    return {
      type: 'deposit',
      data: convertToDeposit(transaction, amount, mappings, settings),
    };
  } else {
    return {
      type: 'purchase',
      data: convertToPurchase(transaction, amount, mappings, settings),
    };
  }
}

/**
 * Convert to QuickBooks Purchase (expense) transaction
 * @param {Object} transaction - Statement Desk transaction
 * @param {number} amount - Absolute amount
 * @param {Object} mappings - Mappings
 * @param {Object} settings - Settings
 * @returns {Object} QB Purchase object
 */
function convertToPurchase(transaction, amount, mappings, settings) {
  const purchase = {
    PaymentType: settings.paymentType || 'Cash',
    AccountRef: {
      value: mappings.bankAccountId,
    },
    TxnDate: formatDate(transaction.date),
    PrivateNote: buildPrivateNote(transaction, settings),
    Line: [
      {
        Amount: amount,
        DetailType: 'AccountBasedExpenseLineDetail',
        AccountBasedExpenseLineDetail: {
          AccountRef: {
            value: mappings.categoryMapping.qb_account_id,
            name: mappings.categoryMapping.qb_account_name,
          },
        },
        Description: buildDescription(transaction, settings),
      },
    ],
  };

  // Add vendor reference if mapped
  if (mappings.merchantMapping?.qb_vendor_id) {
    purchase.EntityRef = {
      value: mappings.merchantMapping.qb_vendor_id,
      name: mappings.merchantMapping.qb_vendor_name,
      type: 'Vendor',
    };
  }

  // Add class if specified in settings
  if (settings.classId) {
    purchase.Line[0].AccountBasedExpenseLineDetail.ClassRef = {
      value: settings.classId,
    };
  }

  return purchase;
}

/**
 * Convert to QuickBooks Deposit transaction
 * @param {Object} transaction - Statement Desk transaction
 * @param {number} amount - Absolute amount
 * @param {Object} mappings - Mappings
 * @param {Object} settings - Settings
 * @returns {Object} QB Deposit object
 */
function convertToDeposit(transaction, amount, mappings, settings) {
  const deposit = {
    TxnDate: formatDate(transaction.date),
    DepositToAccountRef: {
      value: mappings.bankAccountId,
    },
    PrivateNote: buildPrivateNote(transaction, settings),
    Line: [
      {
        Amount: amount,
        DetailType: 'DepositLineDetail',
        DepositLineDetail: {
          AccountRef: {
            value: mappings.categoryMapping.qb_account_id,
            name: mappings.categoryMapping.qb_account_name,
          },
        },
        Description: buildDescription(transaction, settings),
      },
    ],
  };

  // Add customer reference if mapped
  if (mappings.merchantMapping?.qb_customer_id) {
    deposit.Line[0].DepositLineDetail.Entity = {
      EntityRef: {
        value: mappings.merchantMapping.qb_customer_id,
        name: mappings.merchantMapping.qb_customer_name,
        type: 'Customer',
      },
    };
  }

  // Add class if specified
  if (settings.classId) {
    deposit.Line[0].DepositLineDetail.ClassRef = {
      value: settings.classId,
    };
  }

  return deposit;
}

/**
 * Format date for QuickBooks (YYYY-MM-DD)
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date
 */
function formatDate(date) {
  const d = new Date(date);

  // Check if date is valid
  if (isNaN(d.getTime())) {
    throw new Error(`Invalid date: ${date}`);
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Build transaction description
 * @param {Object} transaction - Transaction
 * @param {Object} settings - Settings
 * @returns {string} Description
 */
function buildDescription(transaction, settings) {
  if (settings.includeOriginalDescription !== false) {
    return transaction.description || transaction.normalized_merchant || 'Statement import';
  }

  return transaction.normalized_merchant || transaction.description || 'Statement import';
}

/**
 * Build private note with metadata
 * @param {Object} transaction - Transaction
 * @param {Object} settings - Settings
 * @returns {string} Private note
 */
function buildPrivateNote(transaction, settings) {
  const parts = [];

  parts.push('Imported from Statement Desk');

  if (transaction.id) {
    parts.push(`Transaction ID: ${transaction.id}`);
  }

  if (transaction.confidence) {
    parts.push(`Confidence: ${transaction.confidence}%`);
  }

  if (transaction.normalized_merchant && transaction.normalized_merchant !== transaction.description) {
    parts.push(`Original: ${transaction.description}`);
  }

  if (settings.includeFileReference && transaction.file_id) {
    parts.push(`File ID: ${transaction.file_id}`);
  }

  return parts.join(' | ');
}

/**
 * Validate transaction before conversion
 * @param {Object} transaction - Transaction to validate
 * @returns {Object} Validation result
 */
export function validateTransaction(transaction) {
  const errors = [];

  if (!transaction.date) {
    errors.push('Missing transaction date');
  }

  if (transaction.amount === undefined || transaction.amount === null) {
    errors.push('Missing transaction amount');
  }

  if (transaction.amount === 0) {
    errors.push('Transaction amount cannot be zero');
  }

  if (!transaction.category) {
    errors.push('Missing transaction category');
  }

  // Validate date format
  if (transaction.date) {
    const date = new Date(transaction.date);
    if (isNaN(date.getTime())) {
      errors.push('Invalid date format');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate mappings for transaction
 * @param {Object} transaction - Transaction
 * @param {Object} mappings - Available mappings
 * @returns {Object} Validation result
 */
export function validateMappings(transaction, mappings) {
  const errors = [];
  const warnings = [];

  if (!mappings.bankAccountId) {
    errors.push('No bank account selected');
  }

  if (!mappings.categoryMapping) {
    errors.push(`No mapping for category: ${transaction.category}`);
  }

  // Warnings for missing merchant mappings
  if (transaction.normalized_merchant && !mappings.merchantMapping) {
    warnings.push(`No vendor/customer mapping for merchant: ${transaction.normalized_merchant}`);
  }

  // Validate confidence threshold
  if (transaction.confidence && transaction.confidence < (mappings.minConfidence || 70)) {
    warnings.push(`Low confidence (${transaction.confidence}%) - review recommended`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Convert batch of transactions with validation
 * @param {Array} transactions - Array of transactions
 * @param {Object} mappings - Mappings for all transactions
 * @param {Object} settings - Conversion settings
 * @returns {Object} Conversion results
 */
export function convertTransactionBatch(transactions, mappings, settings = {}) {
  const results = {
    successful: [],
    failed: [],
    warnings: [],
  };

  for (const transaction of transactions) {
    try {
      // Validate transaction
      const validation = validateTransaction(transaction);
      if (!validation.valid) {
        results.failed.push({
          transaction,
          errors: validation.errors,
        });
        continue;
      }

      // Get mappings for this transaction
      const txnMappings = {
        bankAccountId: mappings.bankAccountId,
        categoryMapping: mappings.categoryMappings?.[transaction.category],
        merchantMapping: transaction.normalized_merchant
          ? mappings.merchantMappings?.[transaction.normalized_merchant]
          : null,
        minConfidence: settings.minConfidence,
      };

      // Validate mappings
      const mappingValidation = validateMappings(transaction, txnMappings);
      if (!mappingValidation.valid) {
        results.failed.push({
          transaction,
          errors: mappingValidation.errors,
        });
        continue;
      }

      // Add warnings if any
      if (mappingValidation.warnings.length > 0) {
        results.warnings.push({
          transaction,
          warnings: mappingValidation.warnings,
        });
      }

      // Convert transaction
      const converted = convertTransaction(transaction, txnMappings, settings);

      results.successful.push({
        original: transaction,
        converted,
        warnings: mappingValidation.warnings,
      });
    } catch (error) {
      results.failed.push({
        transaction,
        errors: [error.message],
      });
    }
  }

  return results;
}

/**
 * Create vendor data from merchant name
 * @param {string} merchantName - Normalized merchant name
 * @returns {Object} QB Vendor object
 */
export function createVendorData(merchantName) {
  return {
    DisplayName: merchantName,
    PrintOnCheckName: merchantName,
    Active: true,
  };
}

/**
 * Create customer data from merchant name
 * @param {string} merchantName - Normalized merchant name
 * @returns {Object} QB Customer object
 */
export function createCustomerData(merchantName) {
  return {
    DisplayName: merchantName,
    PrintOnCheckName: merchantName,
    Active: true,
  };
}

/**
 * Get QB transaction link
 * @param {Object} qbTransaction - QB transaction response
 * @param {string} companyId - QB company ID
 * @param {string} environment - sandbox or production
 * @returns {string} Deep link to transaction
 */
export function getTransactionLink(qbTransaction, companyId, environment = 'sandbox') {
  const baseUrl = environment === 'production'
    ? 'https://app.qbo.intuit.com/app'
    : 'https://app.sandbox.qbo.intuit.com/app';

  const entityType = qbTransaction.Purchase ? 'purchase'
    : qbTransaction.Deposit ? 'deposit'
      : qbTransaction.JournalEntry ? 'journal'
        : 'transaction';

  const entityId = qbTransaction.Purchase?.Id
    || qbTransaction.Deposit?.Id
    || qbTransaction.JournalEntry?.Id
    || qbTransaction.Id;

  return `${baseUrl}/${entityType}?txnId=${entityId}&realmId=${companyId}`;
}

export default {
  convertTransaction,
  validateTransaction,
  validateMappings,
  convertTransactionBatch,
  createVendorData,
  createCustomerData,
  getTransactionLink,
};
