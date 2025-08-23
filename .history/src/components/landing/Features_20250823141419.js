"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Shield,
  Zap,
  FileSpreadsheet,
  Clock,
  RefreshCcw,
  Users,
  CheckCircle,
  Smartphone,
  Cloud,
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast Processing",
    description:
      "Convert your PDF bank statements to Excel or CSV in under 30 seconds with our advanced AI technology.",
  },
  {
    icon: Shield,
    title: "Bank-Level Security",
    description:
      "Your financial data is protected with end-to-end encryption and automatic file deletion after processing.",
  },
  {
    icon: FileSpreadsheet,
    title: "Multiple Export Formats",
    description:
      "Export your data as Excel (.xlsx) or CSV files, perfectly formatted for accounting software and analysis.",
  },
  {
    icon: Cloud,
    title: "Google Workspace Integration",
    description:
      "Seamlessly work with your financial data across Google's productivity suite. Export directly to Google Sheets and Drive.",
  },
  {
    icon: CheckCircle,
    title: "99.9% Accuracy",
    description:
      "Our AI accurately extracts dates, descriptions, amounts, and balances from all major bank formats.",
  },
  {
    icon: RefreshCcw,
    title: "Bulk Processing",
    description:
      "Upload and convert multiple bank statements at once to save time on large batches of files.",
  },
  {
    icon: Smartphone,
    title: "Mobile Friendly",
    description:
      "Convert your statements on any device - desktop, tablet, or mobile. Works seamlessly everywhere.",
  },
  {
    icon: Clock,
    title: "24/7 Availability",
    description:
      "Access our converter anytime, anywhere. No software installation required, just upload and convert.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Share converted files with your team or accountant directly from your dashboard with secure links.",
  },
];

export default function Features() {
  return (
    <div id="features" className="py-16 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base font-semibold uppercase tracking-wide text-blue-600">
            Features
          </h2>
          <p className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
            Everything you need to convert bank statements
          </p>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
            Built for professionals who demand accuracy, security, and speed
            when working with financial data.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="bg-white hover:shadow-lg transition-shadow duration-300"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 py-12 sm:px-12">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Supports All Major Banks
              </h3>
              <p className="text-gray-600 mb-8">
                Our AI recognizes and accurately processes statements from
                hundreds of financial institutions
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
                {[
                  {
                    name: "Chase",
                    logo: "/images/banks/chase.png",
                    alt: "Chase Bank",
                  },
                  {
                    name: "Bank of America",
                    logo: "/images/banks/Bank-of-America-Emblem.png",
                    alt: "Bank of America",
                  },
                  {
                    name: "Wells Fargo",
                    logo: "/images/banks/wells-fargo.png",
                    alt: "Wells Fargo",
                  },
                  {
                    name: "Citibank",
                    logo: "/images/banks/citi-bank2.png",
                    alt: "Citibank",
                  },
                  {
                    name: "Capital One",
                    logo: "/images/banks/Capital_One_logo.svg.png",
                    alt: "Capital One",
                  },
                  {
                    name: "US Bank",
                    logo: "/images/banks/us-bank.png",
                    alt: "US Bank",
                  },
                ].map((bank) => (
                  <div
                    key={bank.name}
                    className="flex items-center justify-center p-4"
                  >
                    <img
                      src={bank.logo}
                      alt={bank.alt}
                      className="h-12 w-auto object-contain filter grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>

              <p className="mt-8 text-sm text-gray-500">
                + 200 more banks and credit unions supported
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
