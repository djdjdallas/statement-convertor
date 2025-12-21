import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle, Upload, Download, FileText } from 'lucide-react'

export default function Hero() {
  return (
    <div className="relative bg-white">
      <div className="mx-auto max-w-7xl lg:grid lg:grid-cols-12 lg:gap-x-8 lg:px-8">
        <div className="px-4 py-12 sm:px-6 sm:py-16 lg:col-span-7 lg:px-0 lg:py-24 xl:col-span-6">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            Convert PDF Bank Statements to 
            <span className="text-blue-600"> Excel, CSV & Xero</span>
          </h1>
          <p className="mt-6 text-xl text-gray-500">
            Transform your PDF bank statements into organized Excel and CSV files in seconds. 
            Export directly to Google Sheets and Xero. Secure, accurate, and designed for professionals who value their time.
          </p>
          
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link href="/auth/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Start Converting Now
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                See How It Works
              </Button>
            </Link>
          </div>

          <div className="mt-8">
            <div className="flex items-center">
              <div className="flex -space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-8 w-8 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <div className="ml-3">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-gray-600">Trusted by 200+ professionals</p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">10K+</div>
              <div className="text-sm text-gray-500">Files Converted</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">97%</div>
              <div className="text-sm text-gray-500">Accuracy Rate</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">&lt;30s</div>
              <div className="text-sm text-gray-500">Processing Time</div>
            </div>
          </div>
        </div>
        
        <div className="relative lg:col-span-5 lg:flex lg:items-center xl:col-span-6">
          <div className="mx-auto w-full max-w-md px-4 sm:max-w-2xl sm:px-6 lg:max-w-none lg:px-0">
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 border-0 shadow-xl">
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Simple 3-Step Process</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500">
                        <Upload className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">1. Upload PDF</h4>
                      <p className="text-sm text-gray-500">Drag & drop your bank statement</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">2. AI Processing</h4>
                      <p className="text-sm text-gray-500">Our AI extracts transaction data</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500">
                        <Download className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">3. Download or Export</h4>
                      <p className="text-sm text-gray-500">Get Excel, CSV, or export to Google Sheets & Xero</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Security:</span>
                    <span className="flex items-center text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Bank-level encryption
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}