import { XeroClient } from 'xero-node'

export class XeroService {
  constructor(state = null) {
    const config = {
      clientId: process.env.XERO_CLIENT_ID,
      clientSecret: process.env.XERO_CLIENT_SECRET,
      redirectUris: [process.env.XERO_REDIRECT_URI],
      scopes: process.env.XERO_SCOPES?.split(' ') || [
        'openid',
        'profile',
        'email',
        'accounting.transactions',
        'accounting.settings',
        'accounting.contacts',
        'accounting.attachments',
        'offline_access'
      ]
    }
    
    if (state) {
      config.state = state
    }
    
    this.client = new XeroClient(config)
    this.isInitialized = false
  }

  async initialize() {
    if (!this.isInitialized) {
      await this.client.initialize()
      this.isInitialized = true
    }
  }

  async getAuthUrl() {
    await this.initialize()
    const consentUrl = await this.client.buildConsentUrl()
    return consentUrl
  }

  async handleCallback(callbackUrl) {
    await this.initialize()
    const tokenSet = await this.client.apiCallback(callbackUrl)
    await this.client.updateTenants()
    
    return {
      tokenSet,
      tenants: this.client.tenants
    }
  }

  async refreshAccessToken(refreshToken) {
    try {
      // Ensure client is initialized
      await this.initialize()
      
      // Set the current token set with the refresh token
      await this.client.setTokenSet({
        refresh_token: refreshToken,
        // Add dummy values for required fields
        access_token: 'expired',
        expires_in: 0
      })
      
      // Use the client's refreshToken method
      const newTokenSet = await this.client.refreshToken()
      
      return {
        access_token: newTokenSet.access_token,
        refresh_token: newTokenSet.refresh_token,
        expires_in: newTokenSet.expires_in,
        id_token: newTokenSet.id_token,
        token_type: newTokenSet.token_type
      }
    } catch (error) {
      console.error('Token refresh error:', error)
      
      // Check for invalid_grant error which means refresh token has expired
      if (error.message?.includes('invalid_grant')) {
        throw new Error('Refresh token has expired. Please reconnect your Xero account.')
      }
      
      throw error
    }
  }

  async ensureValidToken(accessToken, refreshToken, tenantId) {
    try {
      // Ensure client is initialized
      await this.initialize()
      
      // First, try to refresh the token proactively
      // This avoids making a failed API call first
      console.log('Refreshing token proactively...')
      
      try {
        const newTokens = await this.refreshAccessToken(refreshToken)
        
        // Set the new token on the client
        await this.client.setTokenSet({
          access_token: newTokens.access_token,
          refresh_token: newTokens.refresh_token,
          expires_in: newTokens.expires_in,
          id_token: newTokens.id_token,
          token_type: newTokens.token_type
        })
        
        console.log('Token refreshed successfully')
        
        return {
          accessToken: newTokens.access_token,
          refreshToken: newTokens.refresh_token,
          newTokens
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError.message)
        
        // If refresh fails with invalid_grant, the refresh token has expired
        if (refreshError.message?.includes('expired')) {
          throw refreshError
        }
        
        // Otherwise, try using the existing token (might still be valid)
        console.log('Trying existing token...')
        await this.client.setTokenSet({
          access_token: accessToken,
          refresh_token: refreshToken
        })
        
        // Test if it works
        try {
          await this.client.accountingApi.getOrganisations('')
          return { accessToken, refreshToken }
        } catch (testError) {
          // Both refresh and existing token failed
          throw new Error('Unable to obtain valid access token. Please reconnect your Xero account.')
        }
      }
    } catch (error) {
      console.error('Error in ensureValidToken:', error)
      throw error
    }
  }

  async getOrganizations(accessToken, refreshToken) {
    const tokens = await this.ensureValidToken(accessToken, refreshToken)
    
    try {
      // Set the token to ensure it's fresh
      await this.client.setTokenSet({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken
      })
      
      const response = await this.client.accountingApi.getOrganisations()
      
      return {
        organizations: response.body,
        newTokens: tokens.newTokens
      }
    } catch (error) {
      console.error('Get organizations error:', error)
      throw error
    }
  }

  async getAccounts(accessToken, refreshToken, tenantId, accountType = 'BANK') {
    // Ensure client is initialized
    await this.initialize()
    
    const tokens = await this.ensureValidToken(accessToken, refreshToken, tenantId)
    
    try {
      const where = accountType && accountType !== 'ALL' ? `Type=="${accountType}"` : undefined
      const response = await this.client.accountingApi.getAccounts(
        tenantId,
        undefined, // ifModifiedSince
        where,
        undefined // order
      )
      
      return {
        accounts: response.body.accounts || [],
        newTokens: tokens.newTokens
      }
    } catch (error) {
      console.error('Get accounts error:', error)
      throw error
    }
  }

  async importTransactions(accessToken, refreshToken, tenantId, bankAccountId, transactions, options = {}) {
    // Ensure client is initialized
    await this.initialize()
    
    const tokens = await this.ensureValidToken(accessToken, refreshToken)
    
    try {
      // Fetch valid account codes from Xero
      let validAccountCodes = []
      let defaultAccountCode = '400' // fallback
      
      try {
        const accountsResult = await this.getAccounts(tokens.accessToken, tokens.refreshToken || refreshToken, tenantId, 'ALL')
        const accounts = accountsResult.accounts
        
        // Update tokens if refreshed during account fetch
        if (accountsResult.newTokens) {
          tokens.newTokens = accountsResult.newTokens
        }
        
        // For bank transactions, we need accounts that can be used in transactions
        // Filter for active accounts of type EXPENSE, REVENUE, etc (not BANK accounts)
        const usableAccounts = accounts.filter(acc => 
          acc.status === 'ACTIVE' && 
          ['EXPENSE', 'REVENUE', 'DIRECTCOSTS', 'OVERHEADS', 'SALES'].includes(acc.type)
        )
        
        validAccountCodes = usableAccounts.map(acc => acc.code)
        
        // Find a suitable default account code
        // Try to find a general expense account first
        defaultAccountCode = usableAccounts.find(acc => 
          acc.type === 'EXPENSE' && acc.code.startsWith('4')
        )?.code || validAccountCodes[0] || '400'
        
      } catch (accountError) {
        console.error('Failed to fetch Xero accounts, using defaults:', accountError)
        // Continue with default mapping if account fetch fails
      }
      
      // Convert transactions to Xero format
      const bankTransactions = transactions.map(transaction => {
        const xeroTransaction = {
          type: transaction.amount < 0 ? 'SPEND' : 'RECEIVE',
          contact: {
            name: transaction.normalized_merchant || transaction.merchant || 'Unknown'
          },
          date: new Date(transaction.date).toISOString().split('T')[0],
          bankAccount: {
            accountID: bankAccountId
          },
          lineItems: [{
            description: transaction.description || transaction.merchant || 'Transaction',
            quantity: 1,
            unitAmount: Math.abs(transaction.amount),
            accountCode: this.mapCategoryToAccountCode(transaction.category, validAccountCodes) || defaultAccountCode,
            taxType: 'NONE' // Add tax type - required by Xero
          }],
          reference: options.reference || transaction.id,
          status: 'AUTHORISED',
          lineAmountTypes: 'Inclusive' // Specify that amounts include tax
        }
        
        // Log first few transactions for debugging
        if (transactions.indexOf(transaction) < 3) {
          console.log('Sample Xero transaction:', {
            type: xeroTransaction.type,
            contact: xeroTransaction.contact.name,
            date: xeroTransaction.date,
            amount: xeroTransaction.lineItems[0].unitAmount,
            accountCode: xeroTransaction.lineItems[0].accountCode,
            reference: xeroTransaction.reference
          })
        }
        
        return xeroTransaction
      })

      // Import in batches of 50 (Xero limit)
      const batchSize = 50
      const results = []
      const bankTransactionIds = []

      console.log(`Importing ${bankTransactions.length} transactions in batches of ${batchSize}`)

      for (let i = 0; i < bankTransactions.length; i += batchSize) {
        const batch = bankTransactions.slice(i, i + batchSize)
        console.log(`Processing batch ${Math.floor(i/batchSize) + 1}: ${batch.length} transactions`)
        
        const response = await this.client.accountingApi.createBankTransactions(
          tenantId,
          { bankTransactions: batch }
        )
        
        console.log('Batch response:', {
          hasBody: !!response.body,
          hasBankTransactions: !!response.body?.bankTransactions,
          count: response.body?.bankTransactions?.length || 0,
          firstTransaction: response.body?.bankTransactions?.[0]
        })
        
        results.push(response.body)
        
        // Collect bank transaction IDs
        if (response.body?.bankTransactions) {
          const batchIds = response.body.bankTransactions
            .filter(bt => bt.bankTransactionID)
            .map(bt => bt.bankTransactionID)
          
          bankTransactionIds.push(...batchIds)
          console.log(`Added ${batchIds.length} transaction IDs from this batch`)
        }
      }

      const importSummary = {
        success: true,
        bankTransactionIds,
        summary: {
          total: transactions.length,
          imported: bankTransactionIds.length,
          batches: results.length
        },
        newTokens: tokens.newTokens
      }
      
      console.log('Import completed:', {
        totalTransactions: importSummary.summary.total,
        importedCount: importSummary.summary.imported,
        success: importSummary.success,
        sampleIds: bankTransactionIds.slice(0, 3)
      })
      
      return importSummary

    } catch (error) {
      console.error('Import transactions error:', error)
      throw error
    }
  }

  mapCategoryToAccountCode(category, validAccountCodes = []) {
    // Map categories to Xero account codes
    // Use valid account codes if provided, otherwise use defaults
    const categoryMap = {
      'Food & Dining': '400',
      'Transportation': '401',
      'Shopping': '402',
      'Entertainment': '403',
      'Bills & Utilities': '404',
      'Healthcare': '405',
      'Education': '406',
      'Travel': '407',
      'Business': '408',
      'Other': '410'
    }

    const mappedCode = categoryMap[category] || '410'
    
    // If we have valid account codes, check if the mapped code exists
    if (validAccountCodes.length > 0) {
      // If the mapped code is valid, use it
      if (validAccountCodes.includes(mappedCode)) {
        return mappedCode
      }
      // Otherwise, return null to use the default account code
      return null
    }
    
    return mappedCode
  }

  async createInvoice(accessToken, refreshToken, tenantId, invoiceData) {
    await this.initialize()
    const tokens = await this.ensureValidToken(accessToken, refreshToken)
    
    try {
      const invoice = {
        type: 'ACCREC',
        contact: invoiceData.contact,
        date: invoiceData.date,
        dueDate: invoiceData.dueDate,
        lineItems: invoiceData.lineItems,
        reference: invoiceData.reference,
        status: 'DRAFT'
      }

      const response = await this.client.accountingApi.createInvoices(
        tenantId,
        { invoices: [invoice] }
      )

      return {
        invoice: response.body.invoices[0],
        newTokens: tokens.newTokens
      }

    } catch (error) {
      console.error('Create invoice error:', error)
      throw error
    }
  }
}