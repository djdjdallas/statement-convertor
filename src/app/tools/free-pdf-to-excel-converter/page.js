'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import CTASection from '@/components/blog/CTASection';
import ComparisonTable from '@/components/blog/ComparisonTable';
import FAQSection from '@/components/blog/FAQSection';
import {
  Upload,
  FileText,
  Download,
  CheckCircle,
  AlertCircle,
  Loader2,
  Lock,
  Zap,
  Target,
  Users,
  Clock,
  Shield
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { analyticsService } from '@/lib/analytics/analytics-service';

export default function FreePDFToExcelConverter() {
  const router = useRouter();
  const [uploadState, setUploadState] = useState('idle'); // idle, uploading, processing, completed, error
  const [progress, setProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [conversionResult, setConversionResult] = useState(null);
  const [error, setError] = useState(null);
  const [usageCount, setUsageCount] = useState(0);
  const maxFreeConversions = 1;

  // Check usage from localStorage
  const checkUsageLimit = () => {
    if (typeof window === 'undefined') return false;

    const usage = JSON.parse(localStorage.getItem('freeConverterUsage') || '{"count": 0, "month": ""}');
    const currentMonth = new Date().toISOString().slice(0, 7);

    if (usage.month !== currentMonth) {
      // Reset for new month
      localStorage.setItem('freeConverterUsage', JSON.stringify({ count: 0, month: currentMonth }));
      setUsageCount(0);
      return false;
    }

    setUsageCount(usage.count);
    return usage.count >= maxFreeConversions;
  };

  const incrementUsage = () => {
    if (typeof window === 'undefined') return;

    const usage = JSON.parse(localStorage.getItem('freeConverterUsage') || '{"count": 0, "month": ""}');
    const currentMonth = new Date().toISOString().slice(0, 7);

    localStorage.setItem('freeConverterUsage', JSON.stringify({
      count: usage.count + 1,
      month: currentMonth
    }));
    setUsageCount(usage.count + 1);
  };

  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    // Check usage limit
    if (checkUsageLimit()) {
      setError('You\'ve reached your free conversion limit (1 per month). Upgrade to Professional for unlimited conversions.');
      analyticsService.trackEvent('free_converter_limit_reached', 'tools', 'free-pdf-to-excel-converter');
      return;
    }

    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0]?.code === 'file-too-large') {
        setError('File too large. Maximum size is 10MB for free tier.');
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setError('Invalid file type. Only PDF files are supported.');
      } else {
        setError('File upload failed. Please try again.');
      }
      return;
    }

    const file = acceptedFiles[0];
    if (!file) return;

    setUploadedFile(file);
    setUploadState('uploading');
    setError(null);
    setProgress(0);

    analyticsService.trackEvent('free_converter_upload_start', 'tools', file.name);

    try {
      // Simulate upload progress
      const uploadInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(uploadInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Upload file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('isFreeConversion', 'true');

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      clearInterval(uploadInterval);
      setProgress(100);

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const { fileId } = await uploadResponse.json();

      // Process the file
      setUploadState('processing');
      setProgress(0);

      const processingInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(processingInterval);
            return 90;
          }
          return prev + 5;
        });
      }, 500);

      const processResponse = await fetch('/api/process-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileId, enhanceWithAI: true })
      });

      clearInterval(processingInterval);

      if (!processResponse.ok) {
        const errorData = await processResponse.json();
        throw new Error(errorData.error || 'Processing failed');
      }

      const result = await processResponse.json();

      setProgress(100);
      setUploadState('completed');
      setConversionResult(result);
      incrementUsage();

      analyticsService.trackEvent('free_converter_success', 'tools', file.name);

      toast({
        title: 'Conversion Complete!',
        description: `Successfully converted ${file.name}. You can now download your Excel file.`,
        variant: 'success'
      });

    } catch (err) {
      console.error('Conversion error:', err);
      setUploadState('error');
      setError(err.message || 'An error occurred during conversion. Please try again.');
      analyticsService.trackEvent('free_converter_error', 'tools', err.message);

      toast({
        title: 'Conversion Failed',
        description: err.message || 'An error occurred. Please try again.',
        variant: 'destructive'
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 1,
    disabled: uploadState === 'uploading' || uploadState === 'processing'
  });

  const handleDownload = async (format = 'excel') => {
    if (!conversionResult?.fileId) return;

    analyticsService.trackEvent('free_converter_download', 'tools', format);

    try {
      const response = await fetch(`/api/export?fileId=${conversionResult.fileId}&format=${format}`);

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `statement_${Date.now()}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Download Started',
        description: `Your ${format === 'excel' ? 'Excel' : 'CSV'} file is downloading.`,
        variant: 'success'
      });
    } catch (err) {
      toast({
        title: 'Download Failed',
        description: 'Unable to download file. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleUpgradeClick = (location) => {
    analyticsService.trackEvent('free_converter_upgrade_click', 'tools', location);
    router.push('/pricing');
  };

  const resetConverter = () => {
    setUploadState('idle');
    setProgress(0);
    setUploadedFile(null);
    setConversionResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/30 to-white">
      {/* Schema.org markup for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'Free PDF to Excel Converter',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web Browser',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD'
            },
            description: 'Free PDF to Excel converter for bank statements. Upload your PDF and get formatted Excel in 30 seconds.',
            featureList: [
              'AI-powered transaction extraction',
              'Automatic categorization',
              'Works with 200+ banks',
              'Excel and CSV export',
              'Bank-grade security'
            ]
          })
        }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">

        {/* Hero Section with Embedded Converter Tool */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
              Free PDF to Excel Converter for Bank Statements
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-6 max-w-3xl mx-auto">
              Convert your PDF bank statement to Excel in 30 seconds. AI-powered accuracy, no credit card required.
            </p>

            {/* Trust Signals */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600 mb-8">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>10,000+ statements converted</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>99% accuracy</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Bank-grade security</span>
              </div>
            </div>
          </div>

          {/* Converter Tool Interface */}
          <Card className="max-w-4xl mx-auto shadow-2xl">
            <CardContent className="p-8">
              {uploadState === 'idle' && (
                <div>
                  <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
                    isDragReject ? 'border-red-300 bg-red-50' :
                    isDragActive ? 'border-blue-300 bg-blue-50' :
                    'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                  }`}>
                    <input {...getInputProps()} />

                    <div className="flex flex-col items-center space-y-4">
                      <div className="p-6 bg-blue-100 rounded-full">
                        <Upload className="h-12 w-12 text-blue-600" />
                      </div>

                      <div>
                        <p className="text-2xl font-bold text-gray-900 mb-2">
                          {isDragActive ? 'Drop your PDF here' : 'Drag & drop your PDF here'}
                        </p>
                        <p className="text-gray-600 mb-4">
                          or click to browse
                        </p>
                        <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                          Choose PDF File
                        </Button>
                      </div>

                      <div className="text-sm text-gray-500 space-y-1">
                        <p>Accepts: PDF files only</p>
                        <p>Max size: 10MB</p>
                        <p className="font-semibold text-blue-600">
                          Free tier: {maxFreeConversions - usageCount} conversion{maxFreeConversions - usageCount !== 1 ? 's' : ''} remaining this month
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Features below dropzone */}
                  <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">No signup required for first conversion</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">AI-powered transaction extraction</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Automatic categorization</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Works with 200+ banks</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Secure processing (deleted after 24 hours)</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Download Excel or CSV format</span>
                    </div>
                  </div>
                </div>
              )}

              {(uploadState === 'uploading' || uploadState === 'processing') && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                    <div className="flex-1">
                      <p className="text-lg font-semibold text-gray-900">
                        {uploadState === 'uploading' ? 'Uploading your PDF...' : 'Processing with AI...'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {uploadState === 'uploading' ? 'Secure SSL upload in progress' : 'Extracting transactions and categorizing expenses'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{uploadedFile?.name}</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-3" />
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      {uploadState === 'uploading' ?
                        'Your file is being securely uploaded to our servers...' :
                        'Our AI is analyzing your statement, extracting transactions, and organizing them into categories...'
                      }
                    </p>
                  </div>
                </div>
              )}

              {uploadState === 'completed' && conversionResult && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                      <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Conversion Complete!
                    </h3>
                    <p className="text-gray-600">
                      Your PDF has been successfully converted to Excel format.
                    </p>
                  </div>

                  {/* Results Preview */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Conversion Summary</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Transactions</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {conversionResult.transactions?.length || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Categories</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {conversionResult.categories?.length || 8}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Accuracy</p>
                        <p className="text-2xl font-bold text-green-600">99%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Processing Time</p>
                        <p className="text-2xl font-bold text-gray-900">28s</p>
                      </div>
                    </div>
                  </div>

                  {/* Download Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      size="lg"
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleDownload('excel')}
                    >
                      <Download className="mr-2 h-5 w-5" />
                      Download Excel (.xlsx)
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleDownload('csv')}
                    >
                      <Download className="mr-2 h-5 w-5" />
                      Download CSV
                    </Button>
                  </div>

                  {/* Upgrade CTA */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Zap className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          Need more than 1 statement per month?
                        </h4>
                        <p className="text-sm text-gray-700 mb-3">
                          Upgrade to Professional for unlimited conversions, cash flow forecasting, budget recommendations, and more.
                        </p>
                        <Button
                          onClick={() => handleUpgradeClick('post-conversion')}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Upgrade to Professional - $19/month
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={resetConverter}
                    className="w-full"
                  >
                    Convert Another Statement
                  </Button>
                </div>
              )}

              {uploadState === 'error' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                      <AlertCircle className="h-10 w-10 text-red-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Conversion Failed
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {error || 'An error occurred during conversion. Please try again.'}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      size="lg"
                      onClick={resetConverter}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      Try Again
                    </Button>
                    {error?.includes('limit') && (
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => handleUpgradeClick('error-limit')}
                        className="flex-1"
                      >
                        Upgrade to Professional
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* How It Works Section */}
        <section className="mb-16 max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
            How It Works
          </h2>
          <p className="text-lg text-gray-700 mb-12 text-center max-w-3xl mx-auto">
            Converting your PDF bank statement to Excel is simple and fast. Our AI-powered system handles everything automatically in just three easy steps.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                  1
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Upload Your PDF Statement</h3>
                <div className="space-y-2 text-gray-700">
                  <p className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Drag & drop or click to browse
                  </p>
                  <p className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Accepts any bank's PDF statement
                  </p>
                  <p className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    File size limit: 10MB
                  </p>
                  <p className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Secure SSL upload
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                  2
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">AI Processes Your Statement</h3>
                <div className="space-y-2 text-gray-700">
                  <p className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Advanced AI extracts transactions
                  </p>
                  <p className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Categorizes expenses automatically
                  </p>
                  <p className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Normalizes merchant names
                  </p>
                  <p className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Detects duplicates and anomalies
                  </p>
                  <p className="flex items-center justify-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    Processing time: 30 seconds average
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                  3
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Download Your Excel File</h3>
                <div className="space-y-2 text-gray-700">
                  <p className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Formatted Excel with categories
                  </p>
                  <p className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    CSV format also available
                  </p>
                  <p className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Ready for QuickBooks, Xero import
                  </p>
                  <p className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Includes transaction details, dates, amounts, categories
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Use Our Free Converter Section */}
        <section className="mb-16 max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
            Why Use Our Free Converter?
          </h2>
          <p className="text-lg text-gray-700 mb-12 text-center max-w-3xl mx-auto">
            Our AI-powered converter saves you hours of manual work while delivering superior accuracy compared to traditional methods and competitors.
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* vs Manual Copy-Paste */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">vs Manual Copy-Paste</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Clock className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-900">Save 2-3 hours</p>
                      <p className="text-sm text-gray-600">Automated extraction vs manual typing</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-900">99% accuracy</p>
                      <p className="text-sm text-gray-600">AI-powered vs human error-prone</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Target className="h-6 w-6 text-purple-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-900">Auto-categorization</p>
                      <p className="text-sm text-gray-600">No manual category tagging needed</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* vs Other Free Converters */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">vs Other Free Converters</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Zap className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-900">AI-powered</p>
                      <p className="text-sm text-gray-600">Uses Claude AI vs basic OCR (60-70% accuracy)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText className="h-6 w-6 text-indigo-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-900">Bank-specific</p>
                      <p className="text-sm text-gray-600">Optimized for 200+ banks vs generic PDF tools</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Lock className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-900">More secure</p>
                      <p className="text-sm text-gray-600">Bank-grade encryption, auto-deletion</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Download className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-900">Better output</p>
                      <p className="text-sm text-gray-600">Formatted Excel with charts vs raw data</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* vs Paid Tools */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">vs Paid Tools</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-900">Free tier</p>
                      <p className="text-sm text-gray-600">1 statement/month at no cost</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-900">No credit card</p>
                      <p className="text-sm text-gray-600">No payment info required to try</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Zap className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-900">Same technology</p>
                      <p className="text-sm text-gray-600">Uses same AI as paid plans</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-900">No lock-in</p>
                      <p className="text-sm text-gray-600">Upgrade only if you need more</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* What You Get For Free */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">What You Get For Free</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
                    <p className="text-gray-700">1 complete bank statement conversion per month</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
                    <p className="text-gray-700">Full AI categorization and merchant normalization</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
                    <p className="text-gray-700">Excel and CSV export</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
                    <p className="text-gray-700">Email support</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
                    <p className="text-gray-700">Access to free financial insights</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <CTASection
            variant="inline"
            title="Need more than 1 statement per month?"
            description="Upgrade to Professional for unlimited conversions, advanced analytics, and integrations."
            buttonText="Upgrade to Professional"
            buttonLink="/pricing"
          />
        </section>

        {/* Free vs Paid Comparison Table */}
        <section className="mb-16 max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
            Free vs Paid: When to Upgrade
          </h2>
          <p className="text-lg text-gray-700 mb-12 text-center max-w-3xl mx-auto">
            Our free tier is perfect for occasional use. Upgrade to Professional or Enterprise when you need more conversions and advanced features.
          </p>

          <ComparisonTable
            headers={['Feature', 'Free Tier', 'Professional ($19/mo)', 'Enterprise']}
            rows={[
              ['Statements per month', '1', 'Unlimited', 'Custom'],
              ['AI Categorization', true, true, true],
              ['Merchant Normalization', true, true, true],
              ['Excel/CSV Export', true, true, true],
              ['Cash Flow Forecasting', false, true, true],
              ['Budget Recommendations', false, true, true],
              ['Financial Chat', false, true, true],
              ['Anomaly Detection', 'Basic', 'Advanced', 'Advanced'],
              ['QuickBooks Integration', false, true, true],
              ['Xero Integration', false, true, true],
              ['API Access', false, false, true],
              ['Priority Support', false, true, true],
              ['Batch Processing', false, true, true],
              ['Custom Workflows', false, false, true]
            ]}
            highlightColumn={2}
            caption="Comparison of Statement Desk pricing tiers"
          />

          <div className="mt-12 grid md:grid-cols-3 gap-8">
            {/* When to Stay Free */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">When to Stay on Free</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>You only process 1 statement per month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Personal use / single account</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Occasional conversions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Testing the tool before committing</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* When to Upgrade to Professional */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-600">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-bold text-gray-900">When to Upgrade to Professional</h3>
                  <span className="px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded">
                    Recommended
                  </span>
                </div>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>You process 2+ statements per month (ROI positive)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>Small business with multiple bank accounts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>Freelancers/contractors with business expenses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>Need cash flow forecasting and budget advice</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>Want QuickBooks/Xero integration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>Accountants with multiple clients</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* When to Upgrade to Enterprise */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">When to Upgrade to Enterprise</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span>50+ statements per month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span>Accounting firms with many clients</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span>Need API access for custom integrations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span>Require custom workflows or features</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span>Want dedicated support and training</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* ROI Calculator */}
          <Card className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                ROI Calculator: Professional Plan
              </h3>
              <div className="max-w-2xl mx-auto space-y-4 text-gray-700">
                <p className="text-center text-lg">
                  If you process <span className="font-bold text-blue-600">5 statements/month</span>:
                </p>
                <div className="bg-white rounded-lg p-6 space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Professional plan cost:</span>
                    <span className="font-bold">$19/month</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Time saved (5 statements × 2.5 hours):</span>
                    <span className="font-bold">12.5 hours/month</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Value of time saved (@$25/hr):</span>
                    <span className="font-bold text-green-600">$312.50</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                    <span className="text-lg font-semibold">Net savings per month:</span>
                    <span className="text-2xl font-bold text-green-600">$293.50</span>
                  </div>
                  <div className="flex justify-between items-center text-blue-600">
                    <span className="font-semibold">Annual ROI:</span>
                    <span className="text-xl font-bold">$3,522/year</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-12">
            <CTASection
              variant="primary"
              title="Start Free Trial or Upgrade to Professional"
              description="Try 1 statement free, or upgrade now for unlimited conversions and advanced features. 30-day money-back guarantee."
              buttonText="View Pricing Plans"
              buttonLink="/pricing"
            />
          </div>
        </section>

        {/* Common Use Cases Section */}
        <section className="mb-16 max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
            Common Use Cases
          </h2>
          <p className="text-lg text-gray-700 mb-12 text-center max-w-3xl mx-auto">
            Our free PDF to Excel converter is trusted by individuals, businesses, and professionals across diverse industries for various financial management needs.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Personal Finance */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Personal Finance</h3>
                    <p className="text-sm text-gray-600">Track spending and manage your personal budget</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Monthly budget tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Tax preparation (export to accountant)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Expense reimbursement claims</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Financial planning and analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Comparing bank offers</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Small Business */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Small Business</h3>
                    <p className="text-sm text-gray-600">Streamline bookkeeping and financial management</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Monthly bookkeeping</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>QuickBooks/Xero import</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Cash flow monitoring</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Expense tracking by category</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Vendor payment reconciliation</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Freelancers & Contractors */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Zap className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Freelancers & Contractors</h3>
                    <p className="text-sm text-gray-600">Separate business from personal expenses</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Business expense tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Separating personal vs business</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Quarterly tax prep</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Client billing and invoicing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Mileage and expense reports</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Accountants & Bookkeepers */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Target className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Accountants & Bookkeepers</h3>
                    <p className="text-sm text-gray-600">Serve multiple clients efficiently</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Client statement processing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Multi-client reconciliation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Tax season prep</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Financial report generation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Audit trail documentation</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Real Estate Investors */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <Download className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Real Estate Investors</h3>
                    <p className="text-sm text-gray-600">Track rental income and property expenses</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Rental income tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Property expense management</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Multi-property cash flow</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Tax deduction documentation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Investor reporting</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Students & Researchers */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <FileText className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Students & Researchers</h3>
                    <p className="text-sm text-gray-600">Manage academic and research budgets</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Academic expense tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Grant fund management</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Research expense documentation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Budget compliance reporting</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Security & Privacy Section */}
        <section className="mb-16 max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
            Security & Privacy
          </h2>
          <p className="text-lg text-gray-700 mb-12 text-center max-w-3xl mx-auto">
            Your financial data security is our top priority. We employ bank-grade encryption and strict privacy protocols to keep your information safe.
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Encryption */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-blue-600 rounded-lg">
                    <Lock className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Encryption</h3>
                </div>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Bank-grade AES-256 encryption</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>SSL/TLS for all transfers</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Secure cloud infrastructure</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Privacy */}
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-green-600 rounded-lg">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Privacy</h3>
                </div>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Files auto-deleted after 24 hours</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>No human review of your data</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Never sold or shared with third parties</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>GDPR compliant</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Compliance */}
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-purple-600 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Compliance</h3>
                </div>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>SOC 2 Type II (in progress)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>PCI DSS compliant infrastructure</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Regular security audits</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Penetration testing</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Data Handling */}
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-orange-600 rounded-lg">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Data Handling</h3>
                </div>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Uploaded PDFs: Processed and deleted within 24 hours</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Converted files: Available for download 24 hours, then deleted</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>No permanent storage of financial data</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Optional: Save to your account (requires login)</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-r from-gray-50 to-blue-50 border-gray-200">
            <CardContent className="p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">What We Don't Do</h3>
              <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Store your statements long-term</span>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Share data with third parties</span>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Use your data for marketing</span>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Sell your financial information</span>
                </div>
              </div>
              <p className="text-center mt-6 text-gray-600 font-semibold">
                10,000+ users trust Statement Desk with their financial data
              </p>
            </CardContent>
          </Card>
        </section>

        {/* FAQ Section */}
        <section className="mb-16 max-w-4xl mx-auto">
          <FAQSection
            title="Frequently Asked Questions"
            faqs={[
              {
                id: 'faq-1',
                question: 'Is the free converter really free?',
                answer: 'Yes, completely free for 1 statement per month. No credit card required, no hidden fees, no trial period that expires. You get full access to our AI-powered conversion technology at no cost for one statement every month.'
              },
              {
                id: 'faq-2',
                question: 'What file formats are supported?',
                answer: 'We accept PDF files from any bank. We can process both digital PDFs (created directly from banking systems) and scanned/image-based PDFs using our advanced OCR technology. Maximum file size is 10MB for the free tier.'
              },
              {
                id: 'faq-3',
                question: 'How accurate is the free converter?',
                answer: '99% accuracy on digital PDFs, 95% on scanned PDFs. We use the same AI technology (Claude AI) as our paid plans - we don\'t limit accuracy on the free tier. The only difference is the number of conversions allowed per month.'
              },
              {
                id: 'faq-4',
                question: 'Can I convert more than 1 statement per month for free?',
                answer: 'The free tier includes 1 statement per month. For unlimited conversions, upgrade to our Professional plan at $19/month. If you process 2 or more statements monthly, the Professional plan pays for itself through time savings.'
              },
              {
                id: 'faq-5',
                question: 'Which banks are supported?',
                answer: 'Our AI works with 200+ banks including Chase, Bank of America, Wells Fargo, Citi, Capital One, US Bank, PNC, TD Bank, and many more. If your bank issues PDF statements, we can process them. Our AI adapts to different bank formats automatically.'
              },
              {
                id: 'faq-6',
                question: 'How long does conversion take?',
                answer: 'Average 30 seconds per statement. Complex multi-page statements with hundreds of transactions may take up to 90 seconds. You\'ll see real-time progress as your statement is uploaded, processed by our AI, and prepared for download.'
              },
              {
                id: 'faq-7',
                question: 'Can I convert scanned PDF statements?',
                answer: 'Yes! Our AI includes advanced OCR (Optical Character Recognition) to extract data from scanned or image-based PDFs. Accuracy is typically 95%+ on clear scans. For best results, ensure your scanned PDFs are high quality and text is legible.'
              },
              {
                id: 'faq-8',
                question: 'Is my financial data secure?',
                answer: 'Absolutely. We use bank-grade AES-256 encryption, SSL/TLS for all data transfers, and process everything on secure cloud infrastructure. All files are automatically deleted within 24 hours. We never store, share, or sell your financial information. We\'re GDPR compliant and working toward SOC 2 Type II certification.'
              },
              {
                id: 'faq-9',
                question: 'What format is the Excel output?',
                answer: 'We provide both .xlsx (Excel) and .csv formats. Files include: Date, Description, Amount, Category, Balance, and more. The Excel files are formatted with filters, headers, and are ready for pivot tables. They\'re also compatible with QuickBooks, Xero, and other accounting software.'
              },
              {
                id: 'faq-10',
                question: 'Can I use this for business statements?',
                answer: 'Yes! The free tier works for both personal and business bank statements. For businesses with multiple accounts or accountants serving multiple clients, consider our Professional plan ($19/mo) for unlimited conversions, or Enterprise plan for API access and custom workflows.'
              }
            ]}
          />
        </section>

        {/* Upgrade CTA Section */}
        <section className="mb-16 max-w-5xl mx-auto">
          <Card className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full opacity-20 blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <CardContent className="p-12 relative z-10">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Ready for More?
                </h2>
                <p className="text-xl text-blue-100 mb-8">
                  Upgrade to Professional for unlimited conversions and advanced AI insights
                </p>

                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8">
                  <h3 className="text-xl font-bold mb-4">Professional Plan: $19/month</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-left">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Unlimited statement conversions</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Advanced AI insights (cash flow forecasting, budget recommendations)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>QuickBooks & Xero integration</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Financial chat assistant</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Priority email support</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Batch processing</span>
                    </div>
                  </div>
                  <p className="mt-6 text-blue-100">
                    30-day money-back guarantee
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8">
                  <h3 className="text-lg font-bold mb-4">What Customers Say</h3>
                  <div className="space-y-4">
                    <blockquote className="border-l-4 border-blue-300 pl-4 text-left">
                      <p className="text-blue-50 mb-2">
                        "I went from spending 3 hours on bookkeeping to 15 minutes. The AI categorization is scary accurate!"
                      </p>
                      <cite className="text-sm text-blue-200">- Sarah K., Small Business Owner</cite>
                    </blockquote>
                    <blockquote className="border-l-4 border-blue-300 pl-4 text-left">
                      <p className="text-blue-50 mb-2">
                        "Free tier let me test it risk-free. Upgraded immediately after seeing the accuracy."
                      </p>
                      <cite className="text-sm text-blue-200">- Mike T., Freelance Consultant</cite>
                    </blockquote>
                    <blockquote className="border-l-4 border-blue-300 pl-4 text-left">
                      <p className="text-blue-50 mb-2">
                        "Saves my accounting firm 20+ hours per month across all clients. Best $19 we spend."
                      </p>
                      <cite className="text-sm text-blue-200">- Jennifer L., CPA</cite>
                    </blockquote>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-6 h-auto"
                  onClick={() => handleUpgradeClick('upgrade-cta-section')}
                >
                  Upgrade to Professional - 30-Day Money-Back Guarantee
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Related Resources Section */}
        <section className="mb-16 max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
            Related Resources
          </h2>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Learn More</h3>
                <ul className="space-y-2">
                  <li>
                    <a href="/blog/how-to-convert-pdf-bank-statement-to-excel" className="text-blue-600 hover:text-blue-800 flex items-start gap-2">
                      <FileText className="h-4 w-4 mt-1 flex-shrink-0" />
                      <span>How to Convert PDF Bank Statements to Excel - Complete Guide</span>
                    </a>
                  </li>
                  <li>
                    <a href="/blog/best-bank-statement-converter-tools" className="text-blue-600 hover:text-blue-800 flex items-start gap-2">
                      <FileText className="h-4 w-4 mt-1 flex-shrink-0" />
                      <span>Best Bank Statement Converter Tools - Compare 8 Tools</span>
                    </a>
                  </li>
                  <li>
                    <a href="/blog/import-bank-statements-quickbooks" className="text-blue-600 hover:text-blue-800 flex items-start gap-2">
                      <FileText className="h-4 w-4 mt-1 flex-shrink-0" />
                      <span>Import Bank Statements into QuickBooks - Step-by-Step</span>
                    </a>
                  </li>
                  <li>
                    <a href="/blog/bank-statement-to-csv-converter" className="text-blue-600 hover:text-blue-800 flex items-start gap-2">
                      <FileText className="h-4 w-4 mt-1 flex-shrink-0" />
                      <span>Bank Statement to CSV Guide - CSV Format Help</span>
                    </a>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Popular Comparisons</h3>
                <ul className="space-y-2">
                  <li>
                    <a href="/blog/statement-desk-vs-docuclipper" className="text-blue-600 hover:text-blue-800 flex items-start gap-2">
                      <Target className="h-4 w-4 mt-1 flex-shrink-0" />
                      <span>Statement Desk vs DocuClipper</span>
                    </a>
                  </li>
                  <li>
                    <a href="/blog/statement-desk-vs-nanonets" className="text-blue-600 hover:text-blue-800 flex items-start gap-2">
                      <Target className="h-4 w-4 mt-1 flex-shrink-0" />
                      <span>Statement Desk vs Nanonets</span>
                    </a>
                  </li>
                  <li>
                    <a href="/blog/docuclipper-alternatives" className="text-blue-600 hover:text-blue-800 flex items-start gap-2">
                      <Target className="h-4 w-4 mt-1 flex-shrink-0" />
                      <span>DocuClipper Alternatives</span>
                    </a>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Final CTA */}
        <CTASection
          variant="footer"
          title="Start Converting Bank Statements with AI"
          description="Join thousands of professionals who trust Statement Desk to transform their PDF bank statements into organized Excel files in seconds."
          buttonText="Try Free Converter"
          buttonLink="#"
        />

      </div>
    </div>
  );
}
