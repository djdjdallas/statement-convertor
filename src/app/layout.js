import "./globals.css";

export const metadata = {
  title: "Statement Desk - Convert PDF to Excel & CSV",
  description: "Easily convert your PDF bank statements to Excel and CSV formats. Secure, fast, and accurate financial data extraction.",
  keywords: "statement desk, bank statement converter, PDF to Excel, PDF to CSV, financial data, bank statement parser",
};

import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from '@/components/ui/toaster'
import AnalyticsProvider from '@/components/AnalyticsProvider'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import PostHogProvider from '@/components/PostHogProvider'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* Only load Google Analytics in production */}
        {process.env.NODE_ENV === 'production' && (
          <GoogleAnalytics ga_id={process.env.NEXT_PUBLIC_GA_ID} />
        )}

        <AuthProvider>
          <PostHogProvider>
            <AnalyticsProvider>
              {children}
            </AnalyticsProvider>
          </PostHogProvider>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
