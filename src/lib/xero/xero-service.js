import { XeroClient } from 'xero-node';
import { encrypt, decrypt } from '@/lib/encryption';

export class XeroService {
  constructor() {
    this.xero = new XeroClient({
      clientId: process.env.XERO_CLIENT_ID,
      clientSecret: process.env.XERO_CLIENT_SECRET,
      redirectUris: [process.env.XERO_REDIRECT_URI],
      scopes: [
        'openid', 
        'profile', 
        'email',
        'accounting.transactions',
        'accounting.contacts',
        'accounting.settings',
        'accounting.attachments',
        'offline_access'
      ]
    });
  }

  async getAuthUrl(state) {
    try {
      const consentUrl = await this.xero.buildConsentUrl();
      // Add state parameter to URL
      const url = new URL(consentUrl);
      url.searchParams.append('state', state);
      return url.toString();
    } catch (error) {
      console.error('Error building consent URL:', error);
      throw error;
    }
  }

  async handleCallback(code) {
    try {
      const tokenSet = await this.xero.apiCallback(code);
      const decodedIdToken = await this.xero.readIdToken();
      
      return { 
        tokenSet, 
        decodedIdToken,
        tenants: await this.xero.tenants
      };
    } catch (error) {
      console.error('Error handling callback:', error);
      throw error;
    }
  }

  async refreshAccessToken(refreshToken) {
    try {
      const validTokenSet = await this.xero.refreshWithRefreshToken(
        process.env.XERO_CLIENT_ID, 
        process.env.XERO_CLIENT_SECRET, 
        refreshToken
      );
      return validTokenSet;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }

  async setTokenSet(tokenSet) {
    await this.xero.setTokenSet(tokenSet);
  }

  async getOrganizations() {
    try {
      await this.xero.updateTenants();
      return this.xero.tenants;
    } catch (error) {
      console.error('Error getting organizations:', error);
      throw error;
    }
  }

  async getBankAccounts(tenantId) {
    try {
      const response = await this.xero.accountingApi.getAccounts(
        tenantId, 
        null, 
        'Type=="BANK"'
      );
      return response.body.accounts;
    } catch (error) {
      console.error('Error getting bank accounts:', error);
      throw error;
    }
  }

  async getChartOfAccounts(tenantId) {
    try {
      const response = await this.xero.accountingApi.getAccounts(tenantId);
      return response.body.accounts;
    } catch (error) {
      console.error('Error getting chart of accounts:', error);
      throw error;
    }
  }

  async createBankTransactions(tenantId, transactions) {
    try {
      const bankTransactions = {
        bankTransactions: transactions
      };
      
      const response = await this.xero.accountingApi.createBankTransactions(
        tenantId,
        bankTransactions,
        true // summarizeErrors
      );
      
      return response.body.bankTransactions;
    } catch (error) {
      console.error('Error creating bank transactions:', error);
      throw error;
    }
  }

  async checkForDuplicates(tenantId, bankAccountId, transactions) {
    try {
      const duplicates = [];
      
      // Check each transaction for potential duplicates
      for (const transaction of transactions) {
        const where = `BankAccount.AccountID=Guid("${bankAccountId}") AND Date=DateTime("${transaction.date}") AND Total=${Math.abs(transaction.amount)}`;
        
        const response = await this.xero.accountingApi.getBankTransactions(
          tenantId,
          null,
          where,
          null,
          1
        );
        
        if (response.body.bankTransactions && response.body.bankTransactions.length > 0) {
          duplicates.push({
            transaction,
            xeroMatch: response.body.bankTransactions[0]
          });
        }
      }
      
      return duplicates;
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      throw error;
    }
  }
}