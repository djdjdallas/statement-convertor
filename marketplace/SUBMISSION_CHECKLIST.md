# Google Workspace Marketplace Submission Checklist

## Pre-Submission Requirements

### ✅ Google Cloud Console Configuration

#### OAuth Consent Screen
- [ ] User type set to "External"
- [ ] App name: "Statement Desk"
- [ ] User support email configured
- [ ] App logo uploaded (120x120 PNG)
- [ ] Application home page: https://statementdesk.com
- [ ] Privacy policy link: https://statementdesk.com/privacy
- [ ] Terms of service link: https://statementdesk.com/terms
- [ ] Authorized domain added: statementdesk.com
- [ ] Developer contact email configured

#### OAuth Scopes
- [ ] https://www.googleapis.com/auth/drive.file
- [ ] https://www.googleapis.com/auth/spreadsheets  
- [ ] https://www.googleapis.com/auth/userinfo.email
- [ ] https://www.googleapis.com/auth/userinfo.profile
- [ ] All scope justifications provided

#### APIs Enabled
- [ ] Google Drive API
- [ ] Google Sheets API
- [ ] Google Identity API
- [ ] Google Workspace Marketplace SDK

### ✅ Marketplace SDK Configuration

#### Basic Information
- [ ] Application name set
- [ ] Short description (max 80 chars)
- [ ] Long description provided
- [ ] Application icon uploaded (128x128 PNG)
- [ ] Category selected: PRODUCTIVITY

#### Installation Configuration  
- [ ] Individual install URL configured
- [ ] Domain install URL configured (if applicable)
- [ ] OAuth scopes match consent screen
- [ ] Visibility set to "Public"

#### Listing Assets
- [ ] 5 screenshots prepared (1280x800 recommended)
- [ ] Screenshot captions written
- [ ] Video demo created (optional but recommended)
- [ ] Support links configured

### ✅ Technical Implementation

#### Installation Flow
- [ ] Individual installation endpoint working
- [ ] Domain installation endpoint working  
- [ ] Marketplace token verification implemented
- [ ] Database schema deployed
- [ ] Error handling for all edge cases

#### OAuth Integration
- [ ] OAuth flow works from marketplace
- [ ] Refresh token handling implemented
- [ ] Token storage secure
- [ ] Revocation endpoint working

#### Google Services Integration
- [ ] Google Drive file access working
- [ ] Google Sheets export functional
- [ ] Proper error handling for API limits
- [ ] Rate limiting implemented

### ✅ Testing Checklist

#### Functional Testing
- [ ] Install from marketplace (test domain)
- [ ] OAuth flow completes successfully
- [ ] All features work post-installation
- [ ] Uninstall flow works correctly
- [ ] Re-installation works properly

#### Security Testing
- [ ] All endpoints require authentication
- [ ] CSRF protection enabled
- [ ] XSS prevention in place
- [ ] SQL injection prevention
- [ ] Rate limiting active

#### Performance Testing
- [ ] Load testing completed
- [ ] Response times < 3 seconds
- [ ] Can handle 100+ concurrent users
- [ ] Database queries optimized

### ✅ Documentation

#### User Documentation
- [ ] Getting started guide
- [ ] Feature documentation
- [ ] FAQ section
- [ ] Troubleshooting guide

#### Admin Documentation  
- [ ] Domain setup guide
- [ ] Configuration options
- [ ] User management guide
- [ ] Security best practices

#### Developer Documentation
- [ ] API documentation (if applicable)
- [ ] Integration guide
- [ ] Webhook documentation
- [ ] Rate limit documentation

### ✅ Legal & Compliance

#### Privacy & Security
- [ ] Privacy policy comprehensive
- [ ] GDPR compliance statement
- [ ] Data retention policy clear
- [ ] Security measures documented
- [ ] Third-party services disclosed

#### Terms of Service
- [ ] Terms of service complete
- [ ] Refund policy stated
- [ ] Limitation of liability
- [ ] Governing law specified
- [ ] Dispute resolution process

#### Google Policies
- [ ] API Terms of Service reviewed
- [ ] Marketplace policies reviewed
- [ ] No policy violations
- [ ] Brand guidelines followed

### ✅ Business Readiness

#### Support Infrastructure
- [ ] Support email monitored
- [ ] Help desk system ready
- [ ] Response time SLA defined
- [ ] Escalation process documented

#### Billing & Subscriptions
- [ ] Stripe integration tested
- [ ] Free trial flow working
- [ ] Upgrade/downgrade working
- [ ] Cancellation flow smooth

#### Analytics & Monitoring
- [ ] Google Analytics configured
- [ ] Error tracking enabled
- [ ] Performance monitoring active
- [ ] User metrics dashboard ready

## Submission Process

### 1. Final Review Checklist
- [ ] All URLs use HTTPS
- [ ] All URLs are production URLs
- [ ] No localhost references
- [ ] No test data in screenshots
- [ ] All features demonstrated work

### 2. OAuth Verification (if needed)
- [ ] Submit for OAuth verification
- [ ] Provide justification video
- [ ] Domain verification complete
- [ ] Privacy assessment done

### 3. Marketplace Submission
- [ ] Go to Google Workspace Marketplace SDK
- [ ] Click "Submit for Review"
- [ ] Fill review questionnaire completely
- [ ] Provide test account credentials
- [ ] Submit and note case number

### 4. During Review
- [ ] Monitor email for feedback
- [ ] Respond within 24 hours
- [ ] Make requested changes promptly
- [ ] Resubmit if needed

### 5. Post-Approval
- [ ] Announce to users
- [ ] Update website
- [ ] Monitor installations
- [ ] Gather user feedback
- [ ] Plan first update

## Common Rejection Reasons to Avoid

### Technical Issues
- ❌ Broken installation flow
- ❌ OAuth errors
- ❌ Missing error handling
- ❌ Slow performance
- ❌ Security vulnerabilities

### Policy Violations  
- ❌ Excessive scope requests
- ❌ Misleading description
- ❌ Missing privacy policy
- ❌ Unclear data usage
- ❌ Trademark violations

### User Experience
- ❌ Confusing onboarding
- ❌ Poor documentation
- ❌ No support contact
- ❌ Broken features
- ❌ Bad error messages

## Emergency Contacts

- **Marketplace Support**: https://developers.google.com/workspace/marketplace/support
- **OAuth Support**: https://developers.google.com/identity/protocols/oauth2/policies
- **API Support**: https://developers.google.com/workspace/support

## Review Timeline

- **Initial Review**: 3-5 business days
- **OAuth Verification**: 5-7 business days (if needed)
- **Resubmission**: 3-5 business days
- **Total Timeline**: 1-3 weeks typically

## Success Metrics to Track

- Installation rate
- Uninstallation rate  
- User activation rate
- Feature adoption
- Support ticket volume
- User satisfaction score

---

**Last Updated**: January 2025
**Version**: 1.0
**Owner**: Statement Desk Development Team