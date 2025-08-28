import Link from 'next/link';

export default function LegalLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Legal pages header navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-white/20 shadow-lg sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link 
                href="/"
                className="flex items-center space-x-2 text-gray-900 hover:text-gray-700 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="font-medium">Back to Statement Desk</span>
              </Link>
              
              <div className="hidden sm:flex sm:space-x-8">
                <Link 
                  href="/privacy" 
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors inline-flex items-center"
                >
                  Privacy Policy
                </Link>
                <Link 
                  href="/terms" 
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors inline-flex items-center"
                >
                  Terms of Service
                </Link>
              </div>
            </div>
            
            <div className="flex items-center">
              <Link 
                href="/dashboard"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="bg-white/70 backdrop-blur-sm">
        {children}
      </div>
      
      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-md border-t border-white/20 mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="text-gray-600 text-sm">
              © 2025 Statement Desk, Inc. All rights reserved.
            </div>
            <div className="flex space-x-6 mt-4 sm:mt-0">
              <Link href="/privacy" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
                Terms
              </Link>
              <a href="mailto:support@statementdesk.com" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}