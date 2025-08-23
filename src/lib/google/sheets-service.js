import { google } from 'googleapis';
import { getAuthenticatedClient } from './auth';
import { 
  withGoogleErrorHandling, 
  GOOGLE_ERROR_CODES,
  createErrorResponse,
  parseGoogleError
} from './error-handler';

const SHEETS_MIME_TYPE = 'application/vnd.google-apps.spreadsheet';
const STATEMENT_FOLDER_NAME = 'Statement Converter';

class GoogleSheetsService {
  constructor(userId, isServerSide = false) {
    this.userId = userId;
    this.isServerSide = isServerSide;
    this.sheets = null;
    this.drive = null;
  }

  async initialize() {
    return withGoogleErrorHandling(async () => {
      const auth = await getAuthenticatedClient(this.userId, this.isServerSide);
      if (!auth) {
        const error = new Error('No Google authentication found');
        error.code = GOOGLE_ERROR_CODES.INVALID_CREDENTIALS;
        throw error;
      }
      this.sheets = google.sheets({ version: 'v4', auth });
      this.drive = google.drive({ version: 'v3', auth });
      return this;
    }, {
      context: { userId: this.userId, operation: 'initializeSheetsService' }
    });
  }

  /**
   * Create a new Google Sheets file with transaction data and AI insights
   */
  async createStatementSheet(transactions, insights, metadata) {
    return withGoogleErrorHandling(async () => {
      const { fileName = 'Statement Export', bankName = 'Bank' } = metadata;
      
      // Create a new spreadsheet
      const spreadsheet = await this.sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title: `${fileName} - ${new Date().toLocaleDateString()}`,
            locale: 'en_US',
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          sheets: [
            {
              properties: {
                title: 'Transactions',
                gridProperties: { frozenRowCount: 1 },
                tabColor: { red: 0.2, green: 0.4, blue: 0.8 }
              }
            },
            {
              properties: {
                title: 'Summary',
                tabColor: { red: 0.2, green: 0.8, blue: 0.4 }
              }
            },
            {
              properties: {
                title: 'AI Insights',
                tabColor: { red: 0.8, green: 0.2, blue: 0.8 }
              }
            },
            {
              properties: {
                title: 'Analytics',
                tabColor: { red: 0.8, green: 0.6, blue: 0.2 }
              }
            }
          ]
        }
      });

      const spreadsheetId = spreadsheet.data.spreadsheetId;
      
      // Get the sheet IDs from the created spreadsheet
      const sheetIds = {
        transactions: spreadsheet.data.sheets[0].properties.sheetId,
        summary: spreadsheet.data.sheets[1].properties.sheetId,
        insights: spreadsheet.data.sheets[2].properties.sheetId,
        analytics: spreadsheet.data.sheets[3].properties.sheetId
      };

      // Prepare transaction data
      const transactionHeaders = [
        'Date', 'Description', 'Normalized Merchant', 'Category', 'Subcategory',
        'Amount', 'Balance', 'Type', 'Confidence %', 'AI Reasoning', 'Anomaly'
      ];

      const transactionRows = transactions.map(tx => [
        tx.date,
        tx.description,
        tx.normalized_merchant || tx.description,
        tx.category,
        tx.subcategory || '',
        tx.transaction_type === 'debit' ? -Math.abs(tx.amount) : Math.abs(tx.amount),
        tx.balance || '',
        tx.transaction_type,
        tx.confidence || '',
        tx.ai_reasoning || '',
        tx.anomaly_data ? 'Yes' : ''
      ]);

      // Add transactions data
      await this.updateSheet(spreadsheetId, 'Transactions!A1', [transactionHeaders, ...transactionRows]);

      // Format transactions sheet
      await this.formatTransactionSheet(spreadsheetId, transactions.length + 1, sheetIds.transactions);

      // Add summary data
      await this.addSummarySheet(spreadsheetId, transactions, insights, sheetIds.summary);

      // Add AI insights
      await this.addAIInsightsSheet(spreadsheetId, insights, transactions, sheetIds.insights);

      // Add analytics sheet with charts
      await this.addAnalyticsSheet(spreadsheetId, transactions, insights, sheetIds.analytics);

      // Move to Statement Converter folder
      const folderId = await this.getOrCreateFolder();
      if (folderId) {
        await this.drive.files.update({
          fileId: spreadsheetId,
          addParents: folderId,
          fields: 'id, parents'
        });
      }

      // Get the final spreadsheet info
      const fileInfo = await this.drive.files.get({
        fileId: spreadsheetId,
        fields: 'id, name, webViewLink, size, createdTime'
      });

      return {
        id: fileInfo.data.id,
        name: fileInfo.data.name,
        webViewLink: fileInfo.data.webViewLink,
        size: fileInfo.data.size,
        createdTime: fileInfo.data.createdTime
      };

    }, {
      context: { 
        operation: 'createStatementSheet', 
        transactionCount: transactions.length,
        metadata 
      }
    });
  }

  /**
   * Update sheet with data
   */
  async updateSheet(spreadsheetId, range, values) {
    return withGoogleErrorHandling(async () => {
      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values }
      });
    }, {
      context: { operation: 'updateSheet', spreadsheetId, range }
    });
  }

  /**
   * Format the transaction sheet
   */
  async formatTransactionSheet(spreadsheetId, rowCount, sheetId) {
    const requests = [
      // Format header row
      {
        repeatCell: {
          range: {
            sheetId: sheetId,
            startRowIndex: 0,
            endRowIndex: 1
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.2, green: 0.4, blue: 0.8 },
              textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true }
            }
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat)'
        }
      },
      // Format amount column as currency
      {
        repeatCell: {
          range: {
            sheetId: sheetId,
            startColumnIndex: 5,
            endColumnIndex: 6,
            startRowIndex: 1,
            endRowIndex: rowCount
          },
          cell: {
            userEnteredFormat: {
              numberFormat: {
                type: 'CURRENCY',
                pattern: '$#,##0.00'
              }
            }
          },
          fields: 'userEnteredFormat.numberFormat'
        }
      },
      // Format balance column as currency
      {
        repeatCell: {
          range: {
            sheetId: sheetId,
            startColumnIndex: 6,
            endColumnIndex: 7,
            startRowIndex: 1,
            endRowIndex: rowCount
          },
          cell: {
            userEnteredFormat: {
              numberFormat: {
                type: 'CURRENCY',
                pattern: '$#,##0.00'
              }
            }
          },
          fields: 'userEnteredFormat.numberFormat'
        }
      },
      // Format confidence column as percentage
      {
        repeatCell: {
          range: {
            sheetId: sheetId,
            startColumnIndex: 8,
            endColumnIndex: 9,
            startRowIndex: 1,
            endRowIndex: rowCount
          },
          cell: {
            userEnteredFormat: {
              numberFormat: {
                type: 'PERCENT',
                pattern: '0%'
              }
            }
          },
          fields: 'userEnteredFormat.numberFormat'
        }
      },
      // Auto-resize columns
      {
        autoResizeDimensions: {
          dimensions: {
            sheetId: sheetId,
            dimension: 'COLUMNS',
            startIndex: 0,
            endIndex: 11
          }
        }
      },
      // Add conditional formatting for amounts (negative = red, positive = green)
      {
        addConditionalFormatRule: {
          rule: {
            ranges: [{
              sheetId: sheetId,
              startColumnIndex: 5,
              endColumnIndex: 6,
              startRowIndex: 1,
              endRowIndex: rowCount
            }],
            booleanRule: {
              condition: {
                type: 'NUMBER_LESS',
                values: [{ userEnteredValue: '0' }]
              },
              format: {
                textFormat: { foregroundColor: { red: 0.8, green: 0, blue: 0 } }
              }
            }
          }
        }
      },
      {
        addConditionalFormatRule: {
          rule: {
            ranges: [{
              sheetId: sheetId,
              startColumnIndex: 5,
              endColumnIndex: 6,
              startRowIndex: 1,
              endRowIndex: rowCount
            }],
            booleanRule: {
              condition: {
                type: 'NUMBER_GREATER',
                values: [{ userEnteredValue: '0' }]
              },
              format: {
                textFormat: { foregroundColor: { red: 0, green: 0.6, blue: 0 } }
              }
            }
          }
        }
      }
    ];

    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests }
    });
  }

  /**
   * Add summary sheet with key metrics
   */
  async addSummarySheet(spreadsheetId, transactions, insights, sheetId) {
    const totalCredits = transactions
      .filter(t => t.transaction_type === 'credit')
      .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
    
    const totalDebits = transactions
      .filter(t => t.transaction_type === 'debit')
      .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);

    const highConfidence = transactions.filter(t => t.confidence >= 90).length;
    const anomalies = transactions.filter(t => t.anomaly_data).length;
    const avgConfidence = transactions.filter(t => t.confidence)
      .reduce((sum, t) => sum + t.confidence, 0) / transactions.filter(t => t.confidence).length || 0;

    const summaryData = [
      ['Financial Summary', ''],
      ['', ''],
      ['Metric', 'Value'],
      ['Total Transactions', transactions.length],
      ['Total Income', `=TEXT(${totalCredits},"$#,##0.00")`],
      ['Total Expenses', `=TEXT(-${totalDebits},"$#,##0.00")`],
      ['Net Cash Flow', `=TEXT(${totalCredits - totalDebits},"$#,##0.00")`],
      ['', ''],
      ['AI Analysis', ''],
      ['AI Processed', transactions.filter(t => t.confidence).length],
      ['High Confidence (90%+)', highConfidence],
      ['Average Confidence', `${avgConfidence.toFixed(0)}%`],
      ['Anomalies Detected', anomalies],
      ['', ''],
      ['Category Breakdown', ''],
      ['Category', 'Amount']
    ];

    // Add category breakdown
    const categoryTotals = {};
    transactions.forEach(t => {
      const category = t.category || 'Uncategorized';
      if (!categoryTotals[category]) categoryTotals[category] = 0;
      categoryTotals[category] += t.transaction_type === 'debit' ? -Math.abs(t.amount) : Math.abs(t.amount);
    });

    Object.entries(categoryTotals)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .forEach(([category, amount]) => {
        summaryData.push([category, `=TEXT(${amount},"$#,##0.00")`]);
      });

    await this.updateSheet(spreadsheetId, 'Summary!A1', summaryData);

    // Format summary sheet
    await this.formatSummarySheet(spreadsheetId, summaryData.length, sheetId);
  }

  /**
   * Format summary sheet
   */
  async formatSummarySheet(spreadsheetId, rowCount, sheetId) {
    const requests = [
      // Title formatting
      {
        mergeCells: {
          range: {
            sheetId: sheetId,
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: 2
          }
        }
      },
      {
        repeatCell: {
          range: {
            sheetId: sheetId,
            startRowIndex: 0,
            endRowIndex: 1
          },
          cell: {
            userEnteredFormat: {
              textFormat: { fontSize: 18, bold: true },
              horizontalAlignment: 'CENTER'
            }
          },
          fields: 'userEnteredFormat(textFormat,horizontalAlignment)'
        }
      },
      // Headers formatting
      {
        repeatCell: {
          range: {
            sheetId: sheetId,
            startRowIndex: 2,
            endRowIndex: 3
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
              textFormat: { bold: true }
            }
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat)'
        }
      },
      {
        repeatCell: {
          range: {
            sheetId: sheetId,
            startRowIndex: 8,
            endRowIndex: 9
          },
          cell: {
            userEnteredFormat: {
              textFormat: { bold: true, fontSize: 12 }
            }
          },
          fields: 'userEnteredFormat.textFormat'
        }
      },
      {
        repeatCell: {
          range: {
            sheetId: sheetId,
            startRowIndex: 14,
            endRowIndex: 15
          },
          cell: {
            userEnteredFormat: {
              textFormat: { bold: true, fontSize: 12 }
            }
          },
          fields: 'userEnteredFormat.textFormat'
        }
      },
      {
        repeatCell: {
          range: {
            sheetId: sheetId,
            startRowIndex: 15,
            endRowIndex: 16
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
              textFormat: { bold: true }
            }
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat)'
        }
      },
      // Auto-resize columns
      {
        autoResizeDimensions: {
          dimensions: {
            sheetId: sheetId,
            dimension: 'COLUMNS',
            startIndex: 0,
            endIndex: 2
          }
        }
      }
    ];

    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests }
    });
  }

  /**
   * Add AI insights sheet
   */
  async addAIInsightsSheet(spreadsheetId, insights, transactions, sheetId) {
    const insightsData = [
      ['AI-Powered Financial Insights'],
      [''],
      ['Summary'],
      [insights?.summary || 'No AI insights available'],
      [''],
      ['Top Spending Categories']
    ];

    // Add top categories
    if (insights?.topCategories) {
      insights.topCategories.slice(0, 5).forEach(cat => {
        insightsData.push([`${cat.category}: $${cat.amount?.toLocaleString()} (${cat.percentage?.toFixed(1)}%)`]);
      });
    }

    insightsData.push([''], ['Spending Trends']);
    if (insights?.trends) {
      insights.trends.forEach(trend => {
        insightsData.push([`• ${trend}`]);
      });
    }

    insightsData.push([''], ['Anomalies Detected']);
    const anomalies = transactions.filter(t => t.anomaly_data);
    if (anomalies.length > 0) {
      anomalies.slice(0, 5).forEach(tx => {
        let anomaly;
        try {
          anomaly = typeof tx.anomaly_data === 'string' ? JSON.parse(tx.anomaly_data) : tx.anomaly_data;
        } catch (e) {
          anomaly = null;
        }
        if (anomaly) {
          insightsData.push([`• ${tx.description} ($${tx.amount}) - ${anomaly.description}`]);
        }
      });
    } else {
      insightsData.push(['No anomalies detected']);
    }

    insightsData.push([''], ['AI Recommendations']);
    if (insights?.recommendations) {
      insights.recommendations.forEach(rec => {
        insightsData.push([`• ${rec}`]);
      });
    }

    insightsData.push([''], ['Savings Opportunities']);
    if (insights?.savingsOpportunities) {
      insights.savingsOpportunities.forEach(opp => {
        insightsData.push([`• ${opp}`]);
      });
    }

    await this.updateSheet(spreadsheetId, 'AI Insights!A1', insightsData);

    // Format AI insights sheet
    await this.formatAIInsightsSheet(spreadsheetId, sheetId);
  }

  /**
   * Format AI insights sheet
   */
  async formatAIInsightsSheet(spreadsheetId, sheetId) {
    const requests = [
      // Title formatting
      {
        repeatCell: {
          range: {
            sheetId: sheetId,
            startRowIndex: 0,
            endRowIndex: 1
          },
          cell: {
            userEnteredFormat: {
              textFormat: { fontSize: 18, bold: true },
              horizontalAlignment: 'CENTER'
            }
          },
          fields: 'userEnteredFormat(textFormat,horizontalAlignment)'
        }
      },
      // Section headers
      {
        repeatCell: {
          range: {
            sheetId: sheetId,
            startRowIndex: 2,
            endRowIndex: 3
          },
          cell: {
            userEnteredFormat: {
              textFormat: { fontSize: 14, bold: true },
              backgroundColor: { red: 0.8, green: 0.2, blue: 0.8, alpha: 0.1 }
            }
          },
          fields: 'userEnteredFormat(textFormat,backgroundColor)'
        }
      },
      // Wrap text for all cells
      {
        repeatCell: {
          range: { sheetId: sheetId },
          cell: {
            userEnteredFormat: { wrapStrategy: 'WRAP' }
          },
          fields: 'userEnteredFormat.wrapStrategy'
        }
      },
      // Set column width
      {
        updateDimensionProperties: {
          range: {
            sheetId: sheetId,
            dimension: 'COLUMNS',
            startIndex: 0,
            endIndex: 1
          },
          properties: { pixelSize: 600 },
          fields: 'pixelSize'
        }
      }
    ];

    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests }
    });
  }

  /**
   * Add analytics sheet with charts
   */
  async addAnalyticsSheet(spreadsheetId, transactions, insights, sheetId) {
    // Prepare data for charts
    const monthlyData = {};
    const categoryData = {};

    transactions.forEach(tx => {
      // Monthly aggregation
      const month = tx.date.substring(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expenses: 0 };
      }
      if (tx.transaction_type === 'credit') {
        monthlyData[month].income += Math.abs(tx.amount);
      } else {
        monthlyData[month].expenses += Math.abs(tx.amount);
      }

      // Category aggregation
      const category = tx.category || 'Uncategorized';
      if (!categoryData[category]) categoryData[category] = 0;
      categoryData[category] += tx.transaction_type === 'debit' ? Math.abs(tx.amount) : 0;
    });

    // Create data tables for charts
    const chartData = [
      ['Monthly Cash Flow Analysis'],
      [''],
      ['Month', 'Income', 'Expenses', 'Net'],
    ];

    Object.entries(monthlyData).sort().forEach(([month, data]) => {
      chartData.push([
        month,
        data.income,
        data.expenses,
        data.income - data.expenses
      ]);
    });

    chartData.push([''], [''], ['Category Spending'], ['Category', 'Amount']);

    Object.entries(categoryData)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([category, amount]) => {
        chartData.push([category, amount]);
      });

    await this.updateSheet(spreadsheetId, 'Analytics!A1', chartData);

    // Create charts
    await this.createCharts(spreadsheetId, chartData.length, sheetId);
  }

  /**
   * Create charts in the analytics sheet
   */
  async createCharts(spreadsheetId, dataRows, sheetId) {
    const requests = [
      // Monthly cash flow chart
      {
        addChart: {
          chart: {
            spec: {
              title: 'Monthly Cash Flow Trend',
              basicChart: {
                chartType: 'COLUMN',
                legendPosition: 'BOTTOM_LEGEND',
                axis: [
                  {
                    position: 'BOTTOM_AXIS',
                    title: 'Month'
                  },
                  {
                    position: 'LEFT_AXIS',
                    title: 'Amount ($)'
                  }
                ],
                domains: [{
                  domain: {
                    sourceRange: {
                      sources: [{
                        sheetId: sheetId,
                        startRowIndex: 2,
                        endRowIndex: dataRows,
                        startColumnIndex: 0,
                        endColumnIndex: 1
                      }]
                    }
                  }
                }],
                series: [
                  {
                    series: {
                      sourceRange: {
                        sources: [{
                          sheetId: sheetId,
                          startRowIndex: 2,
                          endRowIndex: dataRows,
                          startColumnIndex: 1,
                          endColumnIndex: 2
                        }]
                      }
                    },
                    targetAxis: 'LEFT_AXIS',
                    color: { red: 0.2, green: 0.6, blue: 0.2 }
                  },
                  {
                    series: {
                      sourceRange: {
                        sources: [{
                          sheetId: sheetId,
                          startRowIndex: 2,
                          endRowIndex: dataRows,
                          startColumnIndex: 2,
                          endColumnIndex: 3
                        }]
                      }
                    },
                    targetAxis: 'LEFT_AXIS',
                    color: { red: 0.8, green: 0.2, blue: 0.2 }
                  }
                ],
                headerCount: 1
              }
            },
            position: {
              overlayPosition: {
                anchorCell: {
                  sheetId: sheetId,
                  rowIndex: 1,
                  columnIndex: 5
                },
                widthPixels: 600,
                heightPixels: 400
              }
            }
          }
        }
      },
      // Category pie chart
      {
        addChart: {
          chart: {
            spec: {
              title: 'Spending by Category',
              pieChart: {
                legendPosition: 'RIGHT_LEGEND',
                domain: {
                  sourceRange: {
                    sources: [{
                      sheetId: sheetId,
                      startRowIndex: dataRows - 10,
                      endRowIndex: dataRows,
                      startColumnIndex: 0,
                      endColumnIndex: 1
                    }]
                  }
                },
                series: {
                  sourceRange: {
                    sources: [{
                      sheetId: sheetId,
                      startRowIndex: dataRows - 10,
                      endRowIndex: dataRows,
                      startColumnIndex: 1,
                      endColumnIndex: 2
                    }]
                  }
                },
                pieHole: 0.4
              }
            },
            position: {
              overlayPosition: {
                anchorCell: {
                  sheetId: sheetId,
                  rowIndex: 25,
                  columnIndex: 5
                },
                widthPixels: 500,
                heightPixels: 400
              }
            }
          }
        }
      }
    ];

    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests }
    });
  }

  /**
   * Get or create the Statement Converter folder
   */
  async getOrCreateFolder() {
    return withGoogleErrorHandling(async () => {
      const response = await this.drive.files.list({
        q: `name='${STATEMENT_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
        spaces: 'drive'
      });

      if (response.data.files && response.data.files.length > 0) {
        return response.data.files[0].id;
      }

      const folderMetadata = {
        name: STATEMENT_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder'
      };

      const folder = await this.drive.files.create({
        resource: folderMetadata,
        fields: 'id'
      });

      return folder.data.id;
    }, {
      context: { operation: 'getOrCreateFolder', folderName: STATEMENT_FOLDER_NAME },
      throwOnError: false // Return null on error
    });
  }
}

/**
 * Factory function to create and initialize a GoogleSheetsService instance
 */
export async function createSheetsService(userId, isServerSide = false) {
  const service = new GoogleSheetsService(userId, isServerSide);
  await service.initialize();
  return service;
}

export { GoogleSheetsService };