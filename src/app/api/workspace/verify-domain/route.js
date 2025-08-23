import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient as createAdminClient } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase/server';

// Initialize Google Admin SDK
const admin = google.admin('directory_v1');

export async function POST(request) {
  try {
    // Get user session
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          message: 'Please sign in to verify domain.',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const { domain, verificationMethod = 'dns' } = body;

    if (!domain) {
      return NextResponse.json(
        { 
          error: 'Invalid request',
          message: 'Domain is required.',
          code: 'DOMAIN_REQUIRED'
        },
        { status: 400 }
      );
    }

    // Check if user is admin of the domain
    const adminSupabase = createAdminClient();
    const { data: installation } = await adminSupabase
      .from('marketplace_installations')
      .select('*')
      .eq('domain', domain)
      .eq('admin_email', user.email)
      .single();

    if (!installation) {
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          message: 'You must be the domain admin to verify this domain.',
          code: 'NOT_DOMAIN_ADMIN'
        },
        { status: 403 }
      );
    }

    // Generate verification token
    const verificationToken = generateVerificationToken(domain);
    
    // Store verification attempt
    const { error: verifyError } = await adminSupabase
      .from('domain_verifications')
      .insert({
        domain,
        installation_id: installation.id,
        verification_method: verificationMethod,
        verification_token: verificationToken,
        status: 'pending',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      });

    if (verifyError) {
      console.error('Error storing verification:', verifyError);
      throw new Error('Failed to initiate verification');
    }

    // Return verification instructions based on method
    const instructions = getVerificationInstructions(verificationMethod, domain, verificationToken);

    return NextResponse.json({
      success: true,
      data: {
        domain,
        verificationMethod,
        verificationToken,
        instructions,
        expiresIn: '7 days'
      }
    });

  } catch (error) {
    console.error('Domain verification error:', error);
    
    return NextResponse.json(
      { 
        error: 'Verification failed',
        message: error.message || 'Unable to initiate domain verification.',
        code: 'VERIFY_ERROR'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check verification status
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json(
        { 
          error: 'Invalid request',
          message: 'Domain parameter is required.',
          code: 'DOMAIN_REQUIRED'
        },
        { status: 400 }
      );
    }

    // Get user session
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }

    const adminSupabase = createAdminClient();

    // Get latest verification attempt
    const { data: verification } = await adminSupabase
      .from('domain_verifications')
      .select('*')
      .eq('domain', domain)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!verification) {
      return NextResponse.json({
        success: true,
        data: {
          domain,
          verified: false,
          status: 'not_started',
          message: 'Domain verification has not been initiated.'
        }
      });
    }

    // Check if verification is expired
    const isExpired = new Date(verification.expires_at) < new Date();
    if (isExpired && verification.status === 'pending') {
      // Update status to expired
      await adminSupabase
        .from('domain_verifications')
        .update({ status: 'expired' })
        .eq('id', verification.id);
      
      verification.status = 'expired';
    }

    // If pending, check verification
    if (verification.status === 'pending') {
      const isVerified = await checkDomainVerification(
        domain, 
        verification.verification_method, 
        verification.verification_token
      );

      if (isVerified) {
        // Update verification status
        await adminSupabase
          .from('domain_verifications')
          .update({ 
            status: 'verified',
            verified_at: new Date().toISOString()
          })
          .eq('id', verification.id);

        // Update installation status
        await adminSupabase
          .from('marketplace_installations')
          .update({ 
            domain_verified: true,
            verified_at: new Date().toISOString()
          })
          .eq('domain', domain);

        verification.status = 'verified';
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        domain,
        verified: verification.status === 'verified',
        status: verification.status,
        verificationMethod: verification.verification_method,
        verifiedAt: verification.verified_at,
        expiresAt: verification.expires_at,
        message: getStatusMessage(verification.status)
      }
    });

  } catch (error) {
    console.error('Error checking verification:', error);
    
    return NextResponse.json(
      { 
        error: 'Check failed',
        message: error.message || 'Unable to check domain verification status.',
        code: 'CHECK_ERROR'
      },
      { status: 500 }
    );
  }
}

// Helper function to generate verification token
function generateVerificationToken(domain) {
  const crypto = require('crypto');
  const data = `${domain}-${process.env.GOOGLE_CLIENT_ID}-${Date.now()}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
}

// Helper function to get verification instructions
function getVerificationInstructions(method, domain, token) {
  const baseInstructions = {
    dns: {
      title: 'DNS Verification',
      description: 'Add a TXT record to your domain\'s DNS settings',
      steps: [
        {
          step: 1,
          action: 'Access your domain registrar or DNS provider',
          details: 'Log in to the service where you manage your domain\'s DNS records'
        },
        {
          step: 2,
          action: 'Add a new TXT record',
          details: 'Create a new TXT record with the following values:',
          record: {
            type: 'TXT',
            name: '_statement-desk-verification',
            value: `statement-desk-site-verification=${token}`,
            ttl: 3600
          }
        },
        {
          step: 3,
          action: 'Save the record',
          details: 'Save your DNS changes. It may take up to 48 hours to propagate.'
        },
        {
          step: 4,
          action: 'Verify',
          details: 'Click the "Check Verification" button once DNS has propagated.'
        }
      ]
    },
    html: {
      title: 'HTML File Verification',
      description: 'Upload an HTML file to your website',
      steps: [
        {
          step: 1,
          action: 'Download verification file',
          details: 'Download the verification HTML file',
          downloadUrl: `/api/workspace/verification-file?token=${token}`
        },
        {
          step: 2,
          action: 'Upload to your website',
          details: `Upload the file to: https://${domain}/statement-desk-verification.html`
        },
        {
          step: 3,
          action: 'Verify access',
          details: `Ensure the file is accessible at the URL above`
        },
        {
          step: 4,
          action: 'Verify',
          details: 'Click the "Check Verification" button once the file is uploaded.'
        }
      ]
    },
    meta: {
      title: 'Meta Tag Verification',
      description: 'Add a meta tag to your website\'s homepage',
      steps: [
        {
          step: 1,
          action: 'Edit your homepage HTML',
          details: 'Access the HTML source of your website\'s homepage'
        },
        {
          step: 2,
          action: 'Add meta tag',
          details: 'Add the following meta tag inside the <head> section:',
          code: `<meta name="statement-desk-verification" content="${token}" />`
        },
        {
          step: 3,
          action: 'Save and publish',
          details: 'Save your changes and ensure they are live on your website'
        },
        {
          step: 4,
          action: 'Verify',
          details: 'Click the "Check Verification" button once the changes are live.'
        }
      ]
    }
  };

  return baseInstructions[method] || baseInstructions.dns;
}

// Helper function to check domain verification
async function checkDomainVerification(domain, method, token) {
  try {
    switch (method) {
      case 'dns':
        return await checkDNSVerification(domain, token);
      case 'html':
        return await checkHTMLVerification(domain, token);
      case 'meta':
        return await checkMetaVerification(domain, token);
      default:
        return false;
    }
  } catch (error) {
    console.error('Verification check error:', error);
    return false;
  }
}

// Check DNS TXT record
async function checkDNSVerification(domain, token) {
  const dns = require('dns').promises;
  try {
    const records = await dns.resolveTxt(`_statement-desk-verification.${domain}`);
    const expectedValue = `statement-desk-site-verification=${token}`;
    
    return records.some(record => 
      record.join('').includes(expectedValue)
    );
  } catch (error) {
    return false;
  }
}

// Check HTML file verification
async function checkHTMLVerification(domain, token) {
  try {
    const response = await fetch(`https://${domain}/statement-desk-verification.html`);
    if (!response.ok) return false;
    
    const content = await response.text();
    return content.includes(token);
  } catch (error) {
    return false;
  }
}

// Check meta tag verification
async function checkMetaVerification(domain, token) {
  try {
    const response = await fetch(`https://${domain}`);
    if (!response.ok) return false;
    
    const html = await response.text();
    const metaRegex = new RegExp(`<meta[^>]*name=["']statement-desk-verification["'][^>]*content=["']${token}["'][^>]*>`, 'i');
    
    return metaRegex.test(html);
  } catch (error) {
    return false;
  }
}

// Get status message
function getStatusMessage(status) {
  const messages = {
    pending: 'Domain verification is pending. Please complete the verification steps.',
    verified: 'Domain has been successfully verified.',
    expired: 'Domain verification has expired. Please start a new verification.',
    failed: 'Domain verification failed. Please check your settings and try again.',
    not_started: 'Domain verification has not been initiated.'
  };
  
  return messages[status] || 'Unknown verification status.';
}