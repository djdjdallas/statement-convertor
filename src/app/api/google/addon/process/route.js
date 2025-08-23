import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enhancedBankStatementParser } from '@/lib/enhanced-pdf-parser';
// import { generateExcel } from '@/lib/excel-generator';
// import { generateCSV } from '@/lib/csv-generator';
import * as XLSX from 'xlsx';
import { Parser } from 'json2csv';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.ADDON_JWT_SECRET || process.env.JWT_SECRET || 'your-addon-secret-key';

export async function POST(request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded;
    
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get request data
    const { fileName, fileContent, mimeType, exportFormat, fileSize } = await request.json();
    
    if (!fileName || !fileContent || !mimeType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Validate file size (10MB limit)
    if (fileSize > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }
    
    // Validate mime type
    if (mimeType !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
    }
    
    const supabase = await createClient();
    
    // Create file record
    const { data: file, error: fileError } = await supabase
      .from('files')
      .insert({
        user_id: decoded.userId,
        file_name: fileName,
        file_size: fileSize,
        file_type: mimeType,
        status: 'processing',
        source: 'google_addon',
        extraction_method: 'ai_enhanced'
      })
      .select()
      .single();
    
    if (fileError) {
      console.error('Error creating file record:', fileError);
      return NextResponse.json({ error: 'Failed to create file record' }, { status: 500 });
    }
    
    try {
      // Convert base64 to buffer
      const fileBuffer = Buffer.from(fileContent, 'base64');
      
      // Parse PDF with AI enhancement
      const { transactions } = await enhancedBankStatementParser.parsePDF(fileBuffer, true);
      
      // Update file status
      await supabase
        .from('files')
        .update({
          status: 'completed',
          transaction_count: transactions.length,
          ai_enhanced: true
        })
        .eq('id', file.id);
      
      // Generate export file
      let exportBuffer;
      let exportMimeType;
      let exportFileName;
      
      if (exportFormat === 'csv') {
        // Generate CSV
        const fields = ['date', 'description', 'amount', 'category', 'subcategory'];
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(transactions);
        exportBuffer = Buffer.from(csv, 'utf-8');
        exportMimeType = 'text/csv';
        exportFileName = fileName.replace('.pdf', '_converted.csv');
      } else {
        // Generate Excel
        const worksheet = XLSX.utils.json_to_sheet(transactions);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
        exportBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        exportMimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        exportFileName = fileName.replace('.pdf', '_converted.xlsx');
      }
      
      // Convert buffer to base64 for response
      const exportContent = exportBuffer.toString('base64');
      
      // Create export record
      await supabase
        .from('exports')
        .insert({
          file_id: file.id,
          user_id: decoded.userId,
          export_format: exportFormat,
          export_size: exportBuffer.length,
          exported_at: new Date().toISOString()
        });
      
      return NextResponse.json({
        success: true,
        fileId: file.id,
        fileName: exportFileName,
        fileContent: exportContent,
        mimeType: exportMimeType,
        transactionCount: transactions.length,
        processingTime: Date.now() - new Date(file.created_at).getTime()
      });
      
    } catch (processingError) {
      console.error('Processing error:', processingError);
      
      // Update file status to failed
      await supabase
        .from('files')
        .update({
          status: 'failed',
          error_message: processingError.message
        })
        .eq('id', file.id);
      
      return NextResponse.json({ 
        error: 'Failed to process file',
        details: processingError.message 
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}