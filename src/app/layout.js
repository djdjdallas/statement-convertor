import "./globals.css";

export const metadata = {
  title: "Statement Desk - Convert PDF to Excel & CSV",
  description: "Easily convert your PDF bank statements to Excel and CSV formats. Secure, fast, and accurate financial data extraction.",
  keywords: "statement desk, bank statement converter, PDF to Excel, PDF to CSV, financial data, bank statement parser",
};

import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from '@/components/ui/toaster'
import AnalyticsProvider from '@/components/AnalyticsProvider'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AnalyticsProvider>
            {children}
          </AnalyticsProvider>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
