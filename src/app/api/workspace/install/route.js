import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase-admin';
import { google } from 'googleapis';
import crypto from 'crypto';

// Google Workspace Marketplace license API
const licensing = google.licensing('v1');

export async function POST(request) {
  try {
    const headersList = headers();
    
    // Get installation data from request
    const body = await request.json();
    const {
      domain,
      adminEmail,
      installationType, // 'domain' or 'individual'
      licenseId,
      customerId,
      skuId,
      seats,
      planId
    } = body;

    // Validate required fields
    if (!domain || !adminEmail || !installationType) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          message: 'Domain, admin email, and installation type are required.',
          code: 'INVALID_REQUEST'
        },
        { status: 400 }
      );
    }

    // Verify the request is coming from Google (in production)
    if (process.env.NODE_ENV === 'production') {
      const authHeader = headersList.get('authorization');
      if (!authHeader || !verifyGoogleRequest(authHeader)) {
        return NextResponse.json(
          { 
            error: 'Unauthorized',
            message: 'Invalid authorization.',
            code: 'UNAUTHORIZED'
          },
          { status: 401 }
        );
      }
    }

    const adminSupabase = createAdminClient();

    // Check if domain is already installed
    const { data: existingInstall } = await adminSupabase
      .from('marketplace_installations')
      .select('*')
      .eq('domain', domain)
      .single();

    if (existingInstall && existingInstall.status === 'active') {
      return NextResponse.json(
        { 
          error: 'Domain already installed',
          message: 'This domain already has an active installation.',
          code: 'ALREADY_INSTALLED'
        },
        { status: 409 }
      );
    }

    // Create or update marketplace installation
    const installationData = {
      domain,
      admin_email: adminEmail,
      installation_type: installationType,
      customer_id: customerId || null,
      license_id: licenseId || null,
      sku_id: skuId || null,
      seats: seats || null,
      plan_id: planId || 'free',
      status: 'active',
      installed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: installation, error: installError } = await adminSupabase
      .from('marketplace_installations')
      .upsert(installationData, {
        onConflict: 'domain'
      })
      .select()
      .single();

    if (installError) {
      console.error('Error creating installation:', installError);
      throw new Error('Failed to create installation record');
    }

    // Create domain configuration
    const domainConfig = {
      domain,
      admin_email: adminEmail,
      installation_id: installation.id,
      default_plan: planId || 'free',
      settings: {
        installation_type: installationType,
        seats: seats || null,
        features: getFeaturesByPlan(planId || 'free'),
        restrictions: getRestrictionsByPlan(planId || 'free')
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: configError } = await adminSupabase
      .from('domain_configurations')
      .upsert(domainConfig, {
        onConflict: 'domain'
      });

    if (configError) {
      console.error('Error creating domain configuration:', configError);
      // Continue even if config creation fails
    }

    // For domain-wide installations, set up OAuth consent
    if (installationType === 'domain') {
      try {
        // Create service account credentials for domain-wide delegation
        const serviceAccountData = {
          domain,
          installation_id: installation.id,
          delegation_enabled: true,
          scopes: [
            'https://www.googleapis.com/auth/drive.file',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile'
          ],
          created_at: new Date().toISOString()
        };

        await adminSupabase
          .from('domain_service_accounts')
          .insert(serviceAccountData);

      } catch (delegationError) {
        console.error('Error setting up domain delegation:', delegationError);
        // Continue even if delegation setup fails
      }
    }

    // Send welcome email to admin
    await sendWelcomeEmail(adminEmail, domain, installationType);

    // Log installation event
    await adminSupabase
      .from('marketplace_events')
      .insert({
        event_type: 'installation',
        domain,
        installation_id: installation.id,
        event_data: {
          installation_type: installationType,
          plan_id: planId || 'free',
          admin_email: adminEmail
        },
        created_at: new Date().toISOString()
      });

    // Return success response with setup instructions
    const setupInstructions = getSetupInstructions(installationType, domain);

    return NextResponse.json({
      success: true,
      data: {
        installationId: installation.id,
        domain,
        installationType,
        status: 'active',
        setupInstructions,
        nextSteps: [
          installationType === 'domain' 
            ? 'Configure domain-wide delegation in Google Admin Console'
            : 'Users can now sign in with their Google accounts',
          'Access Statement Desk from Google Workspace launcher',
          'Configure team settings in the admin panel'
        ],
        adminDashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/domain/${domain}`
      }
    });

  } catch (error) {
    console.error('Workspace installation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Installation failed',
        message: error.message || 'Unable to complete Workspace installation.',
        code: 'INSTALL_ERROR'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check installation status
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');
    const installationId = searchParams.get('installationId');

    if (!domain && !installationId) {
      return NextResponse.json(
        { 
          error: 'Missing parameters',
          message: 'Either domain or installationId is required.',
          code: 'INVALID_REQUEST'
        },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    // Query installation
    let query = adminSupabase
      .from('marketplace_installations')
      .select(`
        *,
        domain_configurations (
          settings,
          default_plan
        )
      `);

    if (domain) {
      query = query.eq('domain', domain);
    } else {
      query = query.eq('id', installationId);
    }

    const { data: installation, error } = await query.single();

    if (error || !installation) {
      return NextResponse.json(
        { 
          error: 'Installation not found',
          message: 'No installation found for the specified domain or ID.',
          code: 'NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Get usage statistics
    const { data: stats } = await adminSupabase
      .from('domain_usage_stats')
      .select('*')
      .eq('domain', installation.domain)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        installation: {
          id: installation.id,
          domain: installation.domain,
          status: installation.status,
          installationType: installation.installation_type,
          installedAt: installation.installed_at,
          planId: installation.plan_id,
          seats: installation.seats,
          adminEmail: installation.admin_email
        },
        configuration: installation.domain_configurations?.[0] || null,
        usage: stats || {
          activeUsers: 0,
          totalFiles: 0,
          storageUsed: 0
        }
      }
    });

  } catch (error) {
    console.error('Error checking installation:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to check installation',
        message: error.message || 'Unable to retrieve installation status.',
        code: 'CHECK_ERROR'
      },
      { status: 500 }
    );
  }
}

// Helper function to verify Google requests
function verifyGoogleRequest(authHeader) {
  // In production, implement proper verification of Google's service account
  // This is a placeholder - implement actual verification logic
  return authHeader.startsWith('Bearer ');
}

// Helper function to get features by plan
function getFeaturesByPlan(planId) {
  const features = {
    free: {
      maxFilesPerMonth: 10,
      aiProcessing: true,
      exportFormats: ['csv', 'excel'],
      analytics: 'basic',
      support: 'community'
    },
    starter: {
      maxFilesPerMonth: 100,
      aiProcessing: true,
      exportFormats: ['csv', 'excel', 'quickbooks'],
      analytics: 'advanced',
      support: 'email',
      googleDriveIntegration: true,
      teamSharing: true
    },
    professional: {
      maxFilesPerMonth: 'unlimited',
      aiProcessing: true,
      exportFormats: ['csv', 'excel', 'quickbooks', 'xero', 'sage'],
      analytics: 'premium',
      support: 'priority',
      googleDriveIntegration: true,
      teamSharing: true,
      apiAccess: true,
      customBranding: true
    },
    enterprise: {
      maxFilesPerMonth: 'unlimited',
      aiProcessing: true,
      exportFormats: 'all',
      analytics: 'enterprise',
      support: 'dedicated',
      googleDriveIntegration: true,
      teamSharing: true,
      apiAccess: true,
      customBranding: true,
      sso: true,
      auditLogs: true,
      dataResidency: true
    }
  };

  return features[planId] || features.free;
}

// Helper function to get restrictions by plan
function getRestrictionsByPlan(planId) {
  const restrictions = {
    free: {
      dailyFileLimit: 5,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      retentionDays: 30
    },
    starter: {
      dailyFileLimit: 50,
      maxFileSize: 50 * 1024 * 1024, // 50MB
      retentionDays: 90
    },
    professional: {
      dailyFileLimit: 500,
      maxFileSize: 100 * 1024 * 1024, // 100MB
      retentionDays: 365
    },
    enterprise: {
      dailyFileLimit: null, // No limit
      maxFileSize: 500 * 1024 * 1024, // 500MB
      retentionDays: null // Custom retention
    }
  };

  return restrictions[planId] || restrictions.free;
}

// Helper function to get setup instructions
function getSetupInstructions(installationType, domain) {
  if (installationType === 'domain') {
    return {
      title: 'Domain-wide Installation Setup',
      steps: [
        {
          step: 1,
          title: 'Configure Domain-wide Delegation',
          description: 'In Google Admin Console, grant Statement Desk access to user data',
          link: `https://admin.google.com/ac/owl/domainwidedelegation`
        },
        {
          step: 2,
          title: 'Add OAuth Scopes',
          description: 'Add the required OAuth scopes for Statement Desk',
          scopes: [
            'https://www.googleapis.com/auth/drive.file'
          ]
        },
        {
          step: 3,
          title: 'Notify Users',
          description: 'Inform your team that Statement Desk is now available',
          template: `Statement Desk has been installed for ${domain}. Access it from your Google Workspace apps.`
        }
      ]
    };
  } else {
    return {
      title: 'Individual Installation Setup',
      steps: [
        {
          step: 1,
          title: 'Sign In',
          description: 'Sign in with your Google Workspace account',
          link: `${process.env.NEXT_PUBLIC_APP_URL}/auth/google`
        },
        {
          step: 2,
          title: 'Grant Permissions',
          description: 'Allow Statement Desk to access your Google Drive and Sheets'
        },
        {
          step: 3,
          title: 'Start Using',
          description: 'Upload your first bank statement PDF to get started'
        }
      ]
    };
  }
}

// Helper function to send welcome email
async function sendWelcomeEmail(email, domain, installationType) {
  // This would integrate with your email service
  // For now, just log it
  console.log('Sending welcome email:', {
    to: email,
    domain,
    installationType,
    timestamp: new Date().toISOString()
  });
  
  // In production, implement actual email sending
  // using SendGrid, AWS SES, or similar service
}