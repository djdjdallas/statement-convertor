/**
 * QuickBooks API Client
 *
 * Wrapper around node-quickbooks for making authenticated API calls
 * with automatic token refresh and rate limiting.
 */

import QuickBooks from 'node-quickbooks';
import { getValidConnection } from './auth-service.js';

/**
 * Rate limiter to prevent exceeding QB API limits
 * QB limits: 500 requests/minute (burst), ~100 req/min sustained
 */
class RateLimiter {
  constructor(maxRequests = 90, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  async waitIfNeeded() {
    const now = Date.now();

    // Remove requests outside the current window
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      // Wait until oldest request expires
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);

      console.log(`Rate limit reached, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));

      // Recursively check again
      return this.waitIfNeeded();
    }

    this.requests.push(now);
  }
}

const rateLimiter = new RateLimiter();

/**
 * Get authenticated QuickBooks client for user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} QuickBooks client and connection info
 */
export async function getQBClient(userId) {
  const connection = await getValidConnection(userId);

  if (!connection) {
    throw new Error('No active QuickBooks connection found');
  }

  const qbo = new QuickBooks(
    process.env.QUICKBOOKS_CLIENT_ID,
    process.env.QUICKBOOKS_CLIENT_SECRET,
    connection.access_token,
    false, // no token secret needed for OAuth 2.0
    connection.company_id,
    process.env.QUICKBOOKS_ENVIRONMENT !== 'production', // use sandbox
    true, // enable debugging
    null, // minor version
    '2.0', // oauth version
    connection.refresh_token
  );

  return { qbo, connection };
}

/**
 * Make a QB API call with rate limiting and error handling
 * @param {string} userId - User ID
 * @param {Function} apiCall - Function that makes the API call
 * @returns {Promise<any>} API response
 */
export async function makeQBRequest(userId, apiCall) {
  await rateLimiter.waitIfNeeded();

  try {
    const { qbo } = await getQBClient(userId);
    const result = await apiCall(qbo);
    return result;
  } catch (error) {
    console.error('QuickBooks API error:', error);

    // Parse QB error
    if (error.fault) {
      const fault = error.fault.error[0];
      throw new Error(`QuickBooks error: ${fault.message} (${fault.code})`);
    }

    throw error;
  }
}

/**
 * Fetch Chart of Accounts from QuickBooks
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of accounts
 */
export async function fetchAccounts(userId) {
  return makeQBRequest(userId, (qbo) => {
    return new Promise((resolve, reject) => {
      qbo.findAccounts({
        fetchAll: true,
      }, (err, accounts) => {
        if (err) return reject(err);
        resolve(accounts.QueryResponse.Account || []);
      });
    });
  });
}

/**
 * Fetch vendors from QuickBooks
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of vendors
 */
export async function fetchVendors(userId) {
  return makeQBRequest(userId, (qbo) => {
    return new Promise((resolve, reject) => {
      qbo.findVendors({
        fetchAll: true,
      }, (err, vendors) => {
        if (err) return reject(err);
        resolve(vendors.QueryResponse.Vendor || []);
      });
    });
  });
}

/**
 * Fetch customers from QuickBooks
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of customers
 */
export async function fetchCustomers(userId) {
  return makeQBRequest(userId, (qbo) => {
    return new Promise((resolve, reject) => {
      qbo.findCustomers({
        fetchAll: true,
      }, (err, customers) => {
        if (err) return reject(err);
        resolve(customers.QueryResponse.Customer || []);
      });
    });
  });
}

/**
 * Get company information
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Company info
 */
export async function getCompanyInfo(userId) {
  return makeQBRequest(userId, (qbo) => {
    return new Promise((resolve, reject) => {
      qbo.getCompanyInfo(qbo.realmId, (err, companyInfo) => {
        if (err) return reject(err);
        resolve(companyInfo.CompanyInfo);
      });
    });
  });
}

/**
 * Create a vendor in QuickBooks
 * @param {string} userId - User ID
 * @param {Object} vendorData - Vendor details
 * @returns {Promise<Object>} Created vendor
 */
export async function createVendor(userId, vendorData) {
  return makeQBRequest(userId, (qbo) => {
    return new Promise((resolve, reject) => {
      qbo.createVendor(vendorData, (err, vendor) => {
        if (err) return reject(err);
        resolve(vendor.Vendor);
      });
    });
  });
}

/**
 * Create a customer in QuickBooks
 * @param {string} userId - User ID
 * @param {Object} customerData - Customer details
 * @returns {Promise<Object>} Created customer
 */
export async function createCustomer(userId, customerData) {
  return makeQBRequest(userId, (qbo) => {
    return new Promise((resolve, reject) => {
      qbo.createCustomer(customerData, (err, customer) => {
        if (err) return reject(err);
        resolve(customer.Customer);
      });
    });
  });
}

/**
 * Create a purchase (expense) transaction in QuickBooks
 * @param {string} userId - User ID
 * @param {Object} purchaseData - Purchase transaction data
 * @returns {Promise<Object>} Created purchase
 */
export async function createPurchase(userId, purchaseData) {
  return makeQBRequest(userId, (qbo) => {
    return new Promise((resolve, reject) => {
      qbo.createPurchase(purchaseData, (err, purchase) => {
        if (err) return reject(err);
        resolve(purchase.Purchase);
      });
    });
  });
}

/**
 * Create a deposit transaction in QuickBooks
 * @param {string} userId - User ID
 * @param {Object} depositData - Deposit transaction data
 * @returns {Promise<Object>} Created deposit
 */
export async function createDeposit(userId, depositData) {
  return makeQBRequest(userId, (qbo) => {
    return new Promise((resolve, reject) => {
      qbo.createDeposit(depositData, (err, deposit) => {
        if (err) return reject(err);
        resolve(deposit.Deposit);
      });
    });
  });
}

/**
 * Create a journal entry in QuickBooks
 * @param {string} userId - User ID
 * @param {Object} journalData - Journal entry data
 * @returns {Promise<Object>} Created journal entry
 */
export async function createJournalEntry(userId, journalData) {
  return makeQBRequest(userId, (qbo) => {
    return new Promise((resolve, reject) => {
      qbo.createJournalEntry(journalData, (err, journal) => {
        if (err) return reject(err);
        resolve(journal.JournalEntry);
      });
    });
  });
}

/**
 * Find transactions by date range
 * @param {string} userId - User ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} List of transactions
 */
export async function findTransactionsByDate(userId, startDate, endDate) {
  return makeQBRequest(userId, (qbo) => {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM Purchase WHERE TxnDate >= '${startDate}' AND TxnDate <= '${endDate}'`;

      qbo.reportBalanceSheet({ start_date: startDate, end_date: endDate }, (err, report) => {
        if (err) return reject(err);
        resolve(report);
      });
    });
  });
}

/**
 * Batch create transactions
 * @param {string} userId - User ID
 * @param {Array} transactions - Array of transaction objects with type and data
 * @returns {Promise<Array>} Results for each transaction
 */
export async function batchCreateTransactions(userId, transactions) {
  const results = [];

  // Process in batches of 25 to stay under rate limits
  const BATCH_SIZE = 25;

  for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
    const batch = transactions.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.allSettled(
      batch.map(async (txn) => {
        try {
          let result;

          switch (txn.type) {
            case 'purchase':
              result = await createPurchase(userId, txn.data);
              break;
            case 'deposit':
              result = await createDeposit(userId, txn.data);
              break;
            case 'journal':
              result = await createJournalEntry(userId, txn.data);
              break;
            default:
              throw new Error(`Unknown transaction type: ${txn.type}`);
          }

          return {
            success: true,
            transaction: txn,
            result,
          };
        } catch (error) {
          return {
            success: false,
            transaction: txn,
            error: error.message,
          };
        }
      })
    );

    results.push(...batchResults.map(r => r.value || { success: false, error: r.reason }));

    // Add delay between batches to respect rate limits
    if (i + BATCH_SIZE < transactions.length) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
    }
  }

  return results;
}

/**
 * Test QB connection
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Test result
 */
export async function testConnection(userId) {
  try {
    const companyInfo = await getCompanyInfo(userId);
    return {
      success: true,
      companyName: companyInfo.CompanyName,
      companyId: companyInfo.Id,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

export default {
  getQBClient,
  makeQBRequest,
  fetchAccounts,
  fetchVendors,
  fetchCustomers,
  getCompanyInfo,
  createVendor,
  createCustomer,
  createPurchase,
  createDeposit,
  createJournalEntry,
  findTransactionsByDate,
  batchCreateTransactions,
  testConnection,
};
