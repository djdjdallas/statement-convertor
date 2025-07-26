import "./globals.css";

export const metadata = {
  title: "Bank Statement Converter - Convert PDF to Excel & CSV",
  description: "Easily convert your PDF bank statements to Excel and CSV formats. Secure, fast, and accurate financial data extraction.",
  keywords: "bank statement converter, PDF to Excel, PDF to CSV, financial data, bank statement parser",
};

import { AuthProvider } from '@/contexts/AuthContext'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
