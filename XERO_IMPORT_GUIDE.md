# Xero Import Guide - Finding Your Imported Transactions

## Where to Find Imported Transactions in Xero

1. **Log into your Xero account**
   - Go to https://go.xero.com/Dashboard/

2. **Navigate to Banking**
   - Click on "Banking" in the main navigation menu
   - Select "Bank accounts"

3. **Select Your Bank Account**
   - Find the bank account you imported transactions to
   - Click on the account name

4. **View Transactions**
   - You should see tabs like "For review", "Reconciled", "All"
   - Imported transactions appear in the "All" tab
   - They may also appear in "Reconciled" if imported as reconciled

5. **Identify Imported Transactions**
   - Look for transactions with your import reference ID
   - Check the dates match your statement dates
   - Amounts should match your original statement

## Demo Account Notes

- ✅ **Demo accounts DO support bank transaction imports**
- ⚠️ Demo data resets every 28 days
- ⚠️ Some features may be limited in demo mode

## Troubleshooting

### Transactions Not Showing Up?

1. **Check the correct bank account**
   - Ensure you're looking at the same account you selected during import

2. **Refresh the page**
   - Sometimes Xero needs a moment to display new transactions

3. **Check the date range**
   - Make sure your view includes the dates of your imported transactions

4. **Look in Account Transactions**
   - Go to: Accounting → Account Transactions
   - Search for the account code used (usually 400 for expenses)

### Still Can't Find Them?

Run the import again with the improved logging. You should see:
- Sample transaction details being sent
- Batch processing information
- Import completion summary with transaction IDs

The logs will show exactly what's being sent to Xero and whether it's successful.

## Next Steps

1. Try importing again with the updated code
2. Check the console logs for detailed information
3. Note any Xero transaction IDs returned
4. Search for those IDs in Xero's transaction list