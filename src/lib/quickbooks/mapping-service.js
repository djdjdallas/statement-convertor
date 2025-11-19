/**
 * QuickBooks Mapping Service
 *
 * AI-powered mapping between Statement Desk categories/merchants
 * and QuickBooks Chart of Accounts/Vendors/Customers
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Generate AI-powered category to account mappings
 * @param {Array} categories - List of Statement Desk categories
 * @param {Array} qbAccounts - QuickBooks Chart of Accounts
 * @param {string} connectionId - QB connection ID
 * @returns {Promise<Array>} Suggested mappings with confidence scores
 */
export async function generateCategoryMappings(categories, qbAccounts, connectionId) {
  // Filter QB accounts to relevant types (Expense, Income, Other Expense)
  const relevantAccounts = qbAccounts.filter(acc =>
    ['Expense', 'Income', 'Other Expense', 'Cost of Goods Sold', 'Other Income'].includes(acc.AccountType)
  );

  const prompt = `You are an expert accountant helping map transaction categories to QuickBooks Chart of Accounts.

TRANSACTION CATEGORIES (from bank statements):
${categories.map((cat, i) => `${i + 1}. ${cat}`).join('\n')}

AVAILABLE QUICKBOOKS ACCOUNTS:
${relevantAccounts.map(acc => `- ${acc.Name} (Type: ${acc.AccountType}, ID: ${acc.Id})`).join('\n')}

TASK: Map each transaction category to the most appropriate QuickBooks account.

GUIDELINES:
1. Match based on standard accounting practices
2. Expense categories → Expense or Other Expense accounts
3. Income categories → Income accounts
4. Be specific when possible (e.g., "Groceries" → "Food & Beverage" rather than generic "Expense")
5. Assign confidence scores (0-100) based on match quality
6. If no good match exists, suggest creating a new account

OUTPUT FORMAT (JSON array):
[
  {
    "category": "Category Name",
    "qb_account_id": "123",
    "qb_account_name": "Account Name",
    "qb_account_type": "Expense",
    "confidence": 95,
    "reasoning": "Brief explanation of why this mapping makes sense",
    "create_new_account": false
  }
]

Return ONLY the JSON array, no additional text.`;

  try {
    const message = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-3-7-sonnet-20250219',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].text;

    // Extract JSON from response (sometimes Claude wraps it in markdown)
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const mappings = JSON.parse(jsonMatch[0]);

    // Add metadata
    return mappings.map(mapping => ({
      ...mapping,
      auto_mapped: true,
      connection_id: connectionId,
    }));
  } catch (error) {
    console.error('Error generating category mappings:', error);
    throw new Error('Failed to generate category mappings with AI');
  }
}

/**
 * Generate merchant to vendor/customer mappings
 * @param {Array} merchants - List of normalized merchant names
 * @param {Array} qbVendors - QuickBooks vendors
 * @param {Array} qbCustomers - QuickBooks customers
 * @param {string} connectionId - QB connection ID
 * @returns {Promise<Array>} Suggested mappings
 */
export async function generateMerchantMappings(merchants, qbVendors, qbCustomers, connectionId) {
  const prompt = `You are matching merchant names from bank statements to QuickBooks vendors and customers.

MERCHANTS FROM STATEMENTS:
${merchants.map((m, i) => `${i + 1}. ${m}`).join('\n')}

QUICKBOOKS VENDORS:
${qbVendors.slice(0, 100).map(v => `- ${v.DisplayName} (ID: ${v.Id})`).join('\n')}

QUICKBOOKS CUSTOMERS:
${qbCustomers.slice(0, 100).map(c => `- ${c.DisplayName} (ID: ${c.Id})`).join('\n')}

TASK: For each merchant, determine:
1. If it matches an existing vendor (for expenses)
2. If it matches an existing customer (for income)
3. If it should create a new vendor/customer
4. What type of entity it should be (vendor vs customer)

GUIDELINES:
- Most merchants are vendors (you pay them)
- Customers are businesses/people who pay you
- Use fuzzy matching (e.g., "WALMART #1234" matches "Walmart")
- If no match, suggest creating new vendor with cleaned name
- Confidence score 0-100

OUTPUT FORMAT (JSON array):
[
  {
    "merchant": "Original Merchant Name",
    "mapping_type": "vendor",
    "qb_vendor_id": "123",
    "qb_vendor_name": "Vendor Name",
    "qb_customer_id": null,
    "qb_customer_name": null,
    "confidence": 85,
    "create_new": false,
    "suggested_name": "Cleaned Merchant Name",
    "reasoning": "Why this mapping makes sense"
  }
]

Return ONLY the JSON array, no additional text.`;

  try {
    const message = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-3-7-sonnet-20250219',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const mappings = JSON.parse(jsonMatch[0]);

    return mappings.map(mapping => ({
      normalized_merchant: mapping.merchant,
      mapping_type: mapping.mapping_type,
      qb_vendor_id: mapping.qb_vendor_id,
      qb_vendor_name: mapping.qb_vendor_name,
      qb_customer_id: mapping.qb_customer_id,
      qb_customer_name: mapping.qb_customer_name,
      auto_created: mapping.create_new,
      connection_id: connectionId,
    }));
  } catch (error) {
    console.error('Error generating merchant mappings:', error);
    throw new Error('Failed to generate merchant mappings with AI');
  }
}

/**
 * Save category mappings to database
 * @param {string} connectionId - QB connection ID
 * @param {Array} mappings - Category mappings to save
 * @returns {Promise<Array>} Saved mappings
 */
export async function saveCategoryMappings(connectionId, mappings) {
  const records = mappings.map(m => ({
    connection_id: connectionId,
    category: m.category,
    subcategory: m.subcategory || null,
    qb_account_id: m.qb_account_id,
    qb_account_name: m.qb_account_name,
    qb_account_type: m.qb_account_type,
    auto_mapped: m.auto_mapped || false,
    confidence: m.confidence || 0,
  }));

  const { data, error } = await supabase
    .from('quickbooks_category_mappings')
    .upsert(records, {
      onConflict: 'connection_id,category,subcategory',
      ignoreDuplicates: false,
    })
    .select();

  if (error) {
    console.error('Error saving category mappings:', error);
    throw new Error('Failed to save category mappings');
  }

  return data;
}

/**
 * Save merchant mappings to database
 * @param {string} connectionId - QB connection ID
 * @param {Array} mappings - Merchant mappings to save
 * @returns {Promise<Array>} Saved mappings
 */
export async function saveMerchantMappings(connectionId, mappings) {
  const records = mappings.map(m => ({
    connection_id: connectionId,
    normalized_merchant: m.normalized_merchant,
    qb_vendor_id: m.qb_vendor_id,
    qb_vendor_name: m.qb_vendor_name,
    qb_customer_id: m.qb_customer_id,
    qb_customer_name: m.qb_customer_name,
    mapping_type: m.mapping_type,
    auto_created: m.auto_created || false,
  }));

  const { data, error } = await supabase
    .from('quickbooks_merchant_mappings')
    .upsert(records, {
      onConflict: 'connection_id,normalized_merchant',
      ignoreDuplicates: false,
    })
    .select();

  if (error) {
    console.error('Error saving merchant mappings:', error);
    throw new Error('Failed to save merchant mappings');
  }

  return data;
}

/**
 * Get all category mappings for a connection
 * @param {string} connectionId - QB connection ID
 * @returns {Promise<Array>} Category mappings
 */
export async function getCategoryMappings(connectionId) {
  const { data, error } = await supabase
    .from('quickbooks_category_mappings')
    .select('*')
    .eq('connection_id', connectionId)
    .order('category');

  if (error) {
    console.error('Error fetching category mappings:', error);
    throw new Error('Failed to fetch category mappings');
  }

  return data || [];
}

/**
 * Get all merchant mappings for a connection
 * @param {string} connectionId - QB connection ID
 * @returns {Promise<Array>} Merchant mappings
 */
export async function getMerchantMappings(connectionId) {
  const { data, error } = await supabase
    .from('quickbooks_merchant_mappings')
    .select('*')
    .eq('connection_id', connectionId)
    .order('normalized_merchant');

  if (error) {
    console.error('Error fetching merchant mappings:', error);
    throw new Error('Failed to fetch merchant mappings');
  }

  return data || [];
}

/**
 * Delete a category mapping
 * @param {string} mappingId - Mapping ID to delete
 * @returns {Promise<boolean>} Success status
 */
export async function deleteCategoryMapping(mappingId) {
  const { error } = await supabase
    .from('quickbooks_category_mappings')
    .delete()
    .eq('id', mappingId);

  if (error) {
    console.error('Error deleting category mapping:', error);
    throw new Error('Failed to delete category mapping');
  }

  return true;
}

/**
 * Delete a merchant mapping
 * @param {string} mappingId - Mapping ID to delete
 * @returns {Promise<boolean>} Success status
 */
export async function deleteMerchantMapping(mappingId) {
  const { error } = await supabase
    .from('quickbooks_merchant_mappings')
    .delete()
    .eq('id', mappingId);

  if (error) {
    console.error('Error deleting merchant mapping:', error);
    throw new Error('Failed to delete merchant mapping');
  }

  return true;
}

/**
 * Get unique categories from user's transactions
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Unique categories
 */
export async function getUserCategories(userId) {
  const { data, error } = await supabase
    .from('transactions')
    .select('category, subcategory')
    .eq('user_id', userId)
    .not('category', 'is', null);

  if (error) {
    console.error('Error fetching user categories:', error);
    throw new Error('Failed to fetch categories');
  }

  // Get unique categories
  const uniqueCategories = [...new Set(data.map(t => t.category))];
  return uniqueCategories.filter(Boolean);
}

/**
 * Get unique merchants from user's transactions
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Unique normalized merchants
 */
export async function getUserMerchants(userId) {
  const { data, error } = await supabase
    .from('transactions')
    .select('normalized_merchant')
    .eq('user_id', userId)
    .not('normalized_merchant', 'is', null);

  if (error) {
    console.error('Error fetching user merchants:', error);
    throw new Error('Failed to fetch merchants');
  }

  // Get unique merchants
  const uniqueMerchants = [...new Set(data.map(t => t.normalized_merchant))];
  return uniqueMerchants.filter(Boolean);
}

/**
 * Validate mappings before sync
 * @param {string} connectionId - QB connection ID
 * @param {Array} transactions - Transactions to validate
 * @returns {Promise<Object>} Validation results
 */
export async function validateMappings(connectionId, transactions) {
  const categoryMappings = await getCategoryMappings(connectionId);
  const merchantMappings = await getMerchantMappings(connectionId);

  const categoryMap = {};
  categoryMappings.forEach(m => {
    categoryMap[m.category] = m;
  });

  const merchantMap = {};
  merchantMappings.forEach(m => {
    merchantMap[m.normalized_merchant] = m;
  });

  const results = {
    total: transactions.length,
    valid: 0,
    unmappedCategories: new Set(),
    unmappedMerchants: new Set(),
    lowConfidence: [],
  };

  transactions.forEach(txn => {
    let isValid = true;

    // Check category mapping
    if (!categoryMap[txn.category]) {
      results.unmappedCategories.add(txn.category);
      isValid = false;
    } else if (categoryMap[txn.category].confidence < 70) {
      results.lowConfidence.push({
        type: 'category',
        value: txn.category,
        confidence: categoryMap[txn.category].confidence,
      });
    }

    // Check merchant mapping (optional but recommended)
    if (txn.normalized_merchant && !merchantMap[txn.normalized_merchant]) {
      results.unmappedMerchants.add(txn.normalized_merchant);
    }

    if (isValid) {
      results.valid++;
    }
  });

  return {
    ...results,
    unmappedCategories: Array.from(results.unmappedCategories),
    unmappedMerchants: Array.from(results.unmappedMerchants),
    coverage: (results.valid / results.total * 100).toFixed(1),
    ready: results.unmappedCategories.length === 0,
  };
}

/**
 * Get mapping statistics
 * @param {string} connectionId - QB connection ID
 * @returns {Promise<Object>} Mapping statistics
 */
export async function getMappingStats(connectionId) {
  const categoryMappings = await getCategoryMappings(connectionId);
  const merchantMappings = await getMerchantMappings(connectionId);

  return {
    totalCategoryMappings: categoryMappings.length,
    autoMappedCategories: categoryMappings.filter(m => m.auto_mapped).length,
    manualMappedCategories: categoryMappings.filter(m => !m.auto_mapped).length,
    avgCategoryConfidence: categoryMappings.length > 0
      ? (categoryMappings.reduce((sum, m) => sum + m.confidence, 0) / categoryMappings.length).toFixed(1)
      : 0,
    totalMerchantMappings: merchantMappings.length,
    autoCreatedVendors: merchantMappings.filter(m => m.auto_created).length,
  };
}

export default {
  generateCategoryMappings,
  generateMerchantMappings,
  saveCategoryMappings,
  saveMerchantMappings,
  getCategoryMappings,
  getMerchantMappings,
  deleteCategoryMapping,
  deleteMerchantMapping,
  getUserCategories,
  getUserMerchants,
  validateMappings,
  getMappingStats,
};
