import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Upload, 
  Settings, 
  Download, 
  ArrowRight,
  FileText,
  Table,
  Shield
} from 'lucide-react'

const steps = [
  {
    step: '01',
    icon: Upload,
    title: 'Upload Your PDF',
    description: 'Simply drag and drop your PDF bank statement or click to browse. We support files up to 50MB.',
    details: [
      'Drag & drop interface',
      'Support for all major banks',
      'Secure file upload',
      'Multiple file formats accepted'
    ]
  },
  {
    step: '02',
    icon: Settings,
    title: 'AI Processing',
    description: 'Our advanced AI analyzes your statement and extracts all transaction data with 97% accuracy.',
    details: [
      'Smart data extraction',
      'Automatic categorization',
      'Date and amount parsing',
      'Balance reconciliation'
    ]
  },
  {
    step: '03',
    icon: Download,
    title: 'Download Results',
    description: 'Get your formatted Excel or CSV file instantly. Ready for accounting software or analysis.',
    details: [
      'Excel & CSV formats',
      'Clean, organized data',
      'Instant download',
      'Compatible with all tools'
    ]
  }
]

export default function HowItWorks() {
  return (
    <div id="how-it-works" className="py-16 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base font-semibold uppercase tracking-wide text-blue-600">How It Works</h2>
          <p className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
            Convert your statements in 3 simple steps
          </p>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
            Our streamlined process makes it easy to convert any PDF bank statement into structured data.
          </p>
        </div>

        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.step} className="relative">
                <Card className="h-full bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardContent className="p-8">
                    <div className="flex items-center mb-6">
                      <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mr-4">
                        <step.icon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        {step.step}
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      {step.title}
                    </h3>
                    
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {step.description}
                    </p>
                    
                    <ul className="space-y-2">
                      {step.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-center text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-3"></div>
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="p-8 lg:p-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                See the difference
              </h3>
              <p className="text-gray-600 mb-6">
                Transform messy PDF statements into clean, organized data that's ready for analysis.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-red-500 mr-3" />
                  <span className="text-gray-700">Before: Unstructured PDF data</span>
                </div>
                <div className="flex items-center">
                  <Table className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">After: Clean Excel/CSV format</span>
                </div>
                <div className="flex items-center">
                  <Shield className="w-5 h-5 text-blue-500 mr-3" />
                  <span className="text-gray-700">Secure: Automatic file deletion</span>
                </div>
              </div>
              
              <Link href="/auth/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Try It Now - Free
                </Button>
              </Link>
            </div>
            
            <div className="bg-gray-50 p-8 lg:p-12 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-32 bg-red-100 rounded-lg mb-4 mx-auto flex items-center justify-center">
                  <FileText className="w-12 h-12 text-red-600" />
                </div>
                <ArrowRight className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                <div className="w-24 h-32 bg-green-100 rounded-lg mx-auto flex items-center justify-center">
                  <Table className="w-12 h-12 text-green-600" />
                </div>
                <p className="text-sm text-gray-600 mt-4">
                  PDF to Excel/CSV
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to get started?
          </h3>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who trust our platform to convert their bank statements quickly and securely.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg">
                Start Free Trial
              </Button>
            </Link>
            <Link href="#pricing">
              <Button size="lg" variant="outline">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}