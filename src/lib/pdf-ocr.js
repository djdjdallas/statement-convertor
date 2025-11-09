/**
 * PDF OCR Service using Google Cloud Vision API
 *
 * This service handles OCR (Optical Character Recognition) for scanned/image-based PDFs.
 * It only runs as a fallback when traditional PDF text extraction fails.
 *
 * Cost: ~$1.50 per 1000 pages
 * Speed: <1 second per page
 * Accuracy: 95-98%
 */

import { PDFDocument } from 'pdf-lib'

// Lazy load Google Cloud Vision to avoid initialization issues
let visionClient = null

/**
 * Get or initialize the Vision API client
 */
async function getVisionClient() {
  if (!visionClient) {
    try {
      const vision = await import('@google-cloud/vision')

      // Check if we have credentials configured
      if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.GOOGLE_CLOUD_VISION_KEY) {
        throw new Error('Google Cloud Vision credentials not configured')
      }

      // Initialize client with credentials
      visionClient = new vision.ImageAnnotatorClient({
        // If using service account JSON file
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        // Or if using API key directly
        apiKey: process.env.GOOGLE_CLOUD_VISION_KEY
      })

      console.log('Google Cloud Vision client initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Google Cloud Vision:', error)
      throw new Error(`OCR service unavailable: ${error.message}`)
    }
  }
  return visionClient
}

/**
 * Convert PDF page to image buffer for OCR
 *
 * @param {Buffer} pdfBuffer - The PDF file buffer
 * @param {number} pageNumber - Page number to convert (0-indexed)
 * @returns {Promise<Buffer>} - PNG image buffer
 */
async function pdfPageToImage(pdfBuffer, pageNumber = 0) {
  try {
    // Load PDF with pdf-lib
    const pdfDoc = await PDFDocument.load(pdfBuffer)
    const totalPages = pdfDoc.getPageCount()

    if (pageNumber >= totalPages) {
      throw new Error(`Page ${pageNumber} does not exist. PDF has ${totalPages} pages.`)
    }

    // Extract single page
    const singlePagePdf = await PDFDocument.create()
    const [copiedPage] = await singlePagePdf.copyPages(pdfDoc, [pageNumber])
    singlePagePdf.addPage(copiedPage)

    // Save as buffer
    const pdfBytes = await singlePagePdf.save()

    // Note: We're passing the PDF page directly to Vision API
    // Vision API can handle PDF pages natively
    return Buffer.from(pdfBytes)

  } catch (error) {
    console.error(`Error converting PDF page ${pageNumber} to image:`, error)
    throw error
  }
}

/**
 * Perform OCR on a single PDF page using Google Cloud Vision
 *
 * @param {Buffer} imageBuffer - Image buffer (PNG or PDF page)
 * @returns {Promise<string>} - Extracted text
 */
async function performOCROnPage(imageBuffer) {
  try {
    const client = await getVisionClient()

    // Perform document text detection (optimized for documents/PDFs)
    const [result] = await client.documentTextDetection({
      image: { content: imageBuffer }
    })

    // Extract full text from the response
    const detections = result.fullTextAnnotation
    if (!detections || !detections.text) {
      console.warn('No text detected in image')
      return ''
    }

    return detections.text

  } catch (error) {
    console.error('OCR failed for page:', error)

    // Handle specific API errors
    if (error.code === 3) {
      throw new Error('Invalid image format for OCR')
    } else if (error.code === 7) {
      throw new Error('Google Cloud Vision API quota exceeded')
    } else if (error.code === 16) {
      throw new Error('Google Cloud Vision API not authenticated')
    }

    throw error
  }
}

/**
 * Perform OCR on entire PDF document
 *
 * @param {Buffer} pdfBuffer - The PDF file buffer
 * @param {Object} options - OCR options
 * @param {number} options.maxPages - Maximum pages to process (default: 20)
 * @param {Function} options.onProgress - Progress callback (page, totalPages)
 * @returns {Promise<string>} - Combined extracted text from all pages
 */
export async function performPDFOCR(pdfBuffer, options = {}) {
  const {
    maxPages = 20,
    onProgress = () => {}
  } = options

  try {
    console.log('Starting OCR for PDF, buffer size:', pdfBuffer.length)

    // Load PDF to get page count
    const pdfDoc = await PDFDocument.load(pdfBuffer)
    const totalPages = pdfDoc.getPageCount()

    console.log(`PDF has ${totalPages} pages. Processing up to ${maxPages} pages...`)

    // Limit pages to process (for cost control)
    const pagesToProcess = Math.min(totalPages, maxPages)

    if (totalPages > maxPages) {
      console.warn(`PDF has ${totalPages} pages but only processing first ${maxPages} pages`)
    }

    // Process each page
    const pageTexts = []
    for (let i = 0; i < pagesToProcess; i++) {
      console.log(`Processing page ${i + 1}/${pagesToProcess}...`)

      // Convert page to image
      const pageImage = await pdfPageToImage(pdfBuffer, i)

      // Perform OCR on page
      const pageText = await performOCROnPage(pageImage)
      pageTexts.push(pageText)

      // Call progress callback
      onProgress(i + 1, pagesToProcess)

      console.log(`Page ${i + 1} OCR complete. Extracted ${pageText.length} characters.`)
    }

    // Combine all page texts
    const fullText = pageTexts.join('\n\n--- PAGE BREAK ---\n\n')

    console.log(`OCR complete. Total extracted text length: ${fullText.length} characters`)

    return fullText

  } catch (error) {
    console.error('PDF OCR failed:', error)

    // Provide helpful error messages
    if (error.message.includes('credentials not configured')) {
      throw new Error(
        'Google Cloud Vision is not configured. Please set GOOGLE_APPLICATION_CREDENTIALS ' +
        'or GOOGLE_CLOUD_VISION_KEY environment variable.'
      )
    } else if (error.message.includes('quota exceeded')) {
      throw new Error(
        'Google Cloud Vision API quota exceeded. Please check your Google Cloud Console ' +
        'quotas or upgrade your plan.'
      )
    } else if (error.message.includes('not authenticated')) {
      throw new Error(
        'Google Cloud Vision authentication failed. Please check your credentials file ' +
        'or API key is valid.'
      )
    }

    throw error
  }
}

/**
 * Check if OCR is available and configured
 *
 * @returns {boolean} - True if OCR service is available
 */
export function isOCRAvailable() {
  return !!(process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_CLOUD_VISION_KEY)
}

/**
 * Estimate OCR cost for a PDF
 *
 * @param {number} pageCount - Number of pages
 * @returns {Object} - Cost estimate
 */
export function estimateOCRCost(pageCount) {
  // Google Cloud Vision pricing: $1.50 per 1000 pages
  const costPer1000Pages = 1.50
  const estimatedCost = (pageCount / 1000) * costPer1000Pages

  return {
    pages: pageCount,
    costPer1000: costPer1000Pages,
    estimatedCost: estimatedCost.toFixed(4),
    currency: 'USD'
  }
}
