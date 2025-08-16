import { google } from 'googleapis'
import { getAuthenticatedClient } from './auth'
import { getOrCreateAppFolder } from './drive'

// Create a new Google Sheet
export async function createGoogleSheet(userId, title, data) {
  const oauth2Client = await getAuthenticatedClient(userId)
  const sheets = google.sheets({ version: 'v4', auth: oauth2Client })
  const drive = google.drive({ version: 'v3', auth: oauth2Client })
  
  try {
    // Get the app folder ID
    const folderId = await getOrCreateAppFolder(userId)
    
    // Create the spreadsheet
    const spreadsheet = await sheets.spreadsheets.create({
      resource: {
        properties: {
          title: title
        }
      }
    })
    
    const spreadsheetId = spreadsheet.data.spreadsheetId
    
    // Move the spreadsheet to our app folder
    await drive.files.update({
      fileId: spreadsheetId,
      addParents: folderId,
      fields: 'id, parents'
    })
    
    // If we have data, populate the sheet
    if (data && data.length > 0) {
      await updateSheetData(userId, spreadsheetId, 'A1', data)
    }
    
    // Format the sheet
    await formatSheet(userId, spreadsheetId)
    
    return {
      spreadsheetId: spreadsheetId,
      spreadsheetUrl: spreadsheet.data.spreadsheetUrl
    }
  } catch (error) {
    console.error('Error creating Google Sheet:', error)
    throw new Error('Failed to create Google Sheet')
  }
}

// Update data in a Google Sheet
export async function updateSheetData(userId, spreadsheetId, range, values) {
  const oauth2Client = await getAuthenticatedClient(userId)
  const sheets = google.sheets({ version: 'v4', auth: oauth2Client })
  
  try {
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: range,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: values
      }
    })
    
    return response.data
  } catch (error) {
    console.error('Error updating sheet data:', error)
    throw new Error('Failed to update Google Sheet data')
  }
}

// Format the sheet for better presentation
export async function formatSheet(userId, spreadsheetId) {
  const oauth2Client = await getAuthenticatedClient(userId)
  const sheets = google.sheets({ version: 'v4', auth: oauth2Client })
  
  try {
    const requests = [
      // Format header row
      {
        repeatCell: {
          range: {
            sheetId: 0,
            startRowIndex: 0,
            endRowIndex: 1
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: {
                red: 0.2,
                green: 0.4,
                blue: 0.8
              },
              horizontalAlignment: 'CENTER',
              textFormat: {
                foregroundColor: {
                  red: 1.0,
                  green: 1.0,
                  blue: 1.0
                },
                fontSize: 10,
                bold: true
              }
            }
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
        }
      },
      // Auto-resize columns
      {
        autoResizeDimensions: {
          dimensions: {
            sheetId: 0,
            dimension: 'COLUMNS',
            startIndex: 0,
            endIndex: 10
          }
        }
      },
      // Add borders
      {
        updateBorders: {
          range: {
            sheetId: 0,
            startRowIndex: 0,
            endRowIndex: 1000,
            startColumnIndex: 0,
            endColumnIndex: 10
          },
          top: {
            style: 'SOLID',
            width: 1,
            color: {
              red: 0.8,
              green: 0.8,
              blue: 0.8
            }
          },
          bottom: {
            style: 'SOLID',
            width: 1,
            color: {
              red: 0.8,
              green: 0.8,
              blue: 0.8
            }
          },
          left: {
            style: 'SOLID',
            width: 1,
            color: {
              red: 0.8,
              green: 0.8,
              blue: 0.8
            }
          },
          right: {
            style: 'SOLID',
            width: 1,
            color: {
              red: 0.8,
              green: 0.8,
              blue: 0.8
            }
          }
        }
      }
    ]
    
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetId,
      resource: {
        requests: requests
      }
    })
    
    return { success: true }
  } catch (error) {
    console.error('Error formatting sheet:', error)
    // Don't throw error for formatting issues
    return { success: false, error: error.message }
  }
}

// Append data to an existing sheet
export async function appendToSheet(userId, spreadsheetId, values) {
  const oauth2Client = await getAuthenticatedClient(userId)
  const sheets = google.sheets({ version: 'v4', auth: oauth2Client })
  
  try {
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: 'A1',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: values
      }
    })
    
    return response.data
  } catch (error) {
    console.error('Error appending to sheet:', error)
    throw new Error('Failed to append data to Google Sheet')
  }
}

// Get data from a sheet
export async function getSheetData(userId, spreadsheetId, range = 'A1:Z1000') {
  const oauth2Client = await getAuthenticatedClient(userId)
  const sheets = google.sheets({ version: 'v4', auth: oauth2Client })
  
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: range
    })
    
    return response.data.values || []
  } catch (error) {
    console.error('Error getting sheet data:', error)
    throw new Error('Failed to get data from Google Sheet')
  }
}

// Convert transaction data to sheet format
export function convertTransactionsToSheetFormat(transactions) {
  // Headers
  const headers = [
    'Date',
    'Description',
    'Amount',
    'Category',
    'Subcategory',
    'Type',
    'Merchant',
    'AI Confidence',
    'Notes'
  ]
  
  // Data rows
  const rows = transactions.map(transaction => [
    transaction.date,
    transaction.description,
    transaction.amount,
    transaction.category || '',
    transaction.subcategory || '',
    transaction.type || '',
    transaction.normalized_merchant || transaction.description,
    transaction.confidence ? `${transaction.confidence}%` : '',
    transaction.ai_reasoning || ''
  ])
  
  return [headers, ...rows]
}