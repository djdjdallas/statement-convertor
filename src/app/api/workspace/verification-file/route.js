import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { 
          error: 'Invalid request',
          message: 'Verification token is required.',
          code: 'TOKEN_REQUIRED'
        },
        { status: 400 }
      );
    }

    // Generate HTML verification file content
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Statement Desk Domain Verification</title>
    <meta name="robots" content="noindex, nofollow">
</head>
<body>
    <h1>Statement Desk Domain Verification</h1>
    <p>This file is used to verify domain ownership for Statement Desk Google Workspace integration.</p>
    <p>Verification Token: ${token}</p>
    <p>Generated: ${new Date().toISOString()}</p>
    <!-- Statement Desk Verification: ${token} -->
</body>
</html>`;

    // Return HTML file as download
    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': 'attachment; filename="statement-desk-verification.html"',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Error generating verification file:', error);
    
    return NextResponse.json(
      { 
        error: 'File generation failed',
        message: error.message || 'Unable to generate verification file.',
        code: 'FILE_ERROR'
      },
      { status: 500 }
    );
  }
}