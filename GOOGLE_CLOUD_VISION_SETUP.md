# Google Cloud Vision API Setup Guide

This guide will help you configure Google Cloud Vision API for OCR (Optical Character Recognition) of scanned PDFs.

## Overview

The OCR feature is **automatically used as a fallback** when a scanned/image-based PDF is detected. It does NOT run for text-based PDFs (which are free and instant).

**Cost:** ~$1.50 per 1,000 pages
**Speed:** <1 second per page
**Accuracy:** 95-98%

---

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your **Project ID** (you'll need it later)

---

## Step 2: Enable Vision API

1. In Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for **"Cloud Vision API"**
3. Click on it and click **ENABLE**
4. Wait a few seconds for it to activate

---

## Step 3: Create Service Account (Recommended Method)

### 3.1 Create the Service Account

1. Go to **IAM & Admin** → **Service Accounts**
2. Click **CREATE SERVICE ACCOUNT**
3. Fill in details:
   - **Name:** `statement-desk-ocr`
   - **Description:** `Service account for PDF OCR processing`
4. Click **CREATE AND CONTINUE**

### 3.2 Grant Permissions

1. Select role: **Cloud Vision AI User**
   (Or **Basic** → **Editor** if you can't find it)
2. Click **CONTINUE**
3. Click **DONE**

### 3.3 Create and Download Key

1. Find your new service account in the list
2. Click the **three dots (⋮)** on the right
3. Select **Manage keys**
4. Click **ADD KEY** → **Create new key**
5. Choose **JSON** format
6. Click **CREATE**
7. **Save the downloaded JSON file securely** (it contains credentials!)

---

## Step 4: Configure Your Application

### Option A: Using Service Account JSON (Recommended)

1. **Rename** the downloaded JSON file to something simple:
   ```bash
   mv ~/Downloads/statement-desk-*.json google-cloud-credentials.json
   ```

2. **Move** it to a secure location (NOT in your git repo!):
   ```bash
   # Create a credentials directory outside your project
   mkdir -p ~/.google-cloud
   mv google-cloud-credentials.json ~/.google-cloud/
   ```

3. **Add to `.env.local`**:
   ```bash
   # Google Cloud Vision API (for scanned PDF OCR)
   GOOGLE_APPLICATION_CREDENTIALS=/Users/yourusername/.google-cloud/google-cloud-credentials.json
   ```

   Replace `/Users/yourusername/` with your actual home directory path.

4. **For Vercel (Production)**:
   - You can't use file paths in Vercel
   - Instead, use Option B (API Key) OR
   - Convert JSON to base64 and set as environment variable:
     ```bash
     # Run this command locally
     cat ~/.google-cloud/google-cloud-credentials.json | base64
     ```
   - Copy the output
   - In Vercel, set environment variable:
     ```bash
     GOOGLE_CLOUD_CREDENTIALS_BASE64=<paste-base64-here>
     ```
   - Update `src/lib/pdf-ocr.js` to decode it (see Option C below)

### Option B: Using API Key (Simpler for Production)

1. Go to **APIs & Services** → **Credentials**
2. Click **CREATE CREDENTIALS** → **API key**
3. Copy the generated API key
4. Click **RESTRICT KEY** (important for security!)
5. Under **API restrictions**, select:
   - **Restrict key**
   - Check **Cloud Vision API**
6. Click **SAVE**

7. **Add to `.env.local`**:
   ```bash
   # Google Cloud Vision API Key
   GOOGLE_CLOUD_VISION_KEY=AIza...your-key-here
   ```

8. **For Vercel**: Add the same variable in Vercel Dashboard → Settings → Environment Variables

### Option C: Base64 Credentials for Vercel (Most Secure)

If you want to use service account JSON in Vercel:

1. **Encode your JSON file:**
   ```bash
   cat ~/.google-cloud/google-cloud-credentials.json | base64 | tr -d '\n' > credentials-base64.txt
   ```

2. **Add to Vercel Environment Variables:**
   ```bash
   GOOGLE_CLOUD_CREDENTIALS_BASE64=<contents-of-credentials-base64.txt>
   ```

3. **Update `pdf-ocr.js`** to decode it:
   ```javascript
   // In getVisionClient() function
   const credentials = process.env.GOOGLE_CLOUD_CREDENTIALS_BASE64
     ? JSON.parse(Buffer.from(process.env.GOOGLE_CLOUD_CREDENTIALS_BASE64, 'base64').toString())
     : undefined

   visionClient = new vision.ImageAnnotatorClient({
     credentials: credentials,
     keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
     apiKey: process.env.GOOGLE_CLOUD_VISION_KEY
   })
   ```

---

## Step 5: Enable Billing (Required)

⚠️ **Important:** Cloud Vision API requires a billing account.

1. Go to **Billing** in Google Cloud Console
2. Click **LINK A BILLING ACCOUNT**
3. Follow the prompts to add a payment method
4. Google Cloud offers **$300 free credit** for new users (lasts 90 days)

**Note:** You won't be charged unless you exceed the free tier:
- First 1,000 pages/month: **FREE**
- After 1,000: **$1.50 per 1,000 pages**

---

## Step 6: Test the Integration

### Local Testing

1. **Restart your dev server:**
   ```bash
   npm run dev
   ```

2. **Upload a scanned PDF** to your app

3. **Check the console logs:**
   ```
   PDF appears to be scanned/image-based. Extracted text: 4 chars from 2 pages
   🔍 OCR is available. Attempting to extract text from scanned PDF...
   💰 OCR Cost Estimate: $0.0030 for 2 pages
   OCR Progress: 1/2 pages processed
   OCR Progress: 2/2 pages processed
   ✅ OCR successful! Extracted 4523 characters
   ```

### Production Testing (Vercel)

1. **Set environment variable in Vercel:**
   - Go to Vercel Dashboard
   - Select your project
   - Settings → Environment Variables
   - Add `GOOGLE_CLOUD_VISION_KEY` or `GOOGLE_CLOUD_CREDENTIALS_BASE64`

2. **Redeploy:**
   ```bash
   git push origin main
   ```

3. **Test with a scanned PDF**

---

## Troubleshooting

### Error: "Google Cloud Vision credentials not configured"

**Solution:** Make sure you've set one of:
- `GOOGLE_APPLICATION_CREDENTIALS=/path/to/json`
- `GOOGLE_CLOUD_VISION_KEY=AIza...`
- `GOOGLE_CLOUD_CREDENTIALS_BASE64=...`

### Error: "Google Cloud Vision API not authenticated"

**Causes:**
- JSON file path is incorrect
- JSON file is malformed
- API key is invalid
- Service account doesn't have Vision API permissions

**Solutions:**
1. Check the file path exists: `ls $GOOGLE_APPLICATION_CREDENTIALS`
2. Verify JSON is valid: `cat $GOOGLE_APPLICATION_CREDENTIALS | jq`
3. Regenerate API key or service account key
4. Make sure service account has "Cloud Vision AI User" role

### Error: "Google Cloud Vision API quota exceeded"

**Solutions:**
- You've exceeded the free 1,000 pages/month
- Check your usage: Cloud Console → APIs & Services → Dashboard
- Upgrade your billing account or wait for quota reset (monthly)

### Error: "Invalid image format for OCR"

**Causes:**
- PDF is corrupted
- PDF uses unsupported compression

**Solutions:**
- Try re-downloading the PDF
- Try converting to PDF/A format using Adobe Acrobat
- Use a different PDF from your bank

### OCR extracts garbled text

**Causes:**
- Low-quality scan (< 300 DPI)
- Poor image quality
- Handwritten text
- Non-English text without language hint

**Solutions:**
- Use higher quality scans (300+ DPI recommended)
- Ensure good lighting and no blur
- For non-English: Update `pdf-ocr.js` to specify language

---

## Cost Management

### Set Budget Alerts

1. Go to **Billing** → **Budgets & alerts**
2. Click **CREATE BUDGET**
3. Set threshold: **$10/month** (covers ~6,700 pages)
4. Add your email for alerts

### Monitor Usage

1. Go to **APIs & Services** → **Dashboard**
2. Click **Cloud Vision API**
3. View usage charts and trends

### Limit Pages Processed

In `enhanced-pdf-parser.js`, the OCR is limited to **20 pages** per PDF:

```javascript
const ocrText = await performPDFOCR(pdfBuffer, {
  maxPages: 20, // Adjust this to control costs
  onProgress: (page, total) => {
    console.log(`OCR Progress: ${page}/${total} pages processed`)
  }
})
```

---

## Security Best Practices

1. **Never commit credentials to git:**
   ```bash
   # Add to .gitignore
   echo "google-cloud-credentials.json" >> .gitignore
   echo ".google-cloud/" >> .gitignore
   ```

2. **Rotate keys regularly:**
   - Create new service account key every 90 days
   - Delete old keys

3. **Use least privilege:**
   - Only grant "Cloud Vision AI User" role
   - Don't use "Owner" or "Editor" roles

4. **Restrict API keys:**
   - Add HTTP referrer restrictions for web
   - Limit to only Cloud Vision API

---

## Alternative: Disable OCR (Free Option)

If you don't want to pay for OCR, you can keep it disabled:

1. **Don't set any Google Cloud Vision environment variables**
2. **Users will see:** "This PDF appears to be a scanned document. Please upload a text-based PDF."
3. **Guide users** to download statements directly from their bank (these are usually text-based)

---

## Need Help?

- [Google Cloud Vision Documentation](https://cloud.google.com/vision/docs)
- [Vision API Pricing](https://cloud.google.com/vision/pricing)
- [Service Account Authentication](https://cloud.google.com/docs/authentication/getting-started)

---

**Last Updated:** January 2025
**API Version:** Cloud Vision API v1
**Estimated Cost:** $1.50 per 1,000 pages (first 1,000 pages/month free)
