"use client";

import { Card } from "@/components/ui/card";

const integrations = [
  {
    name: "Google Sheets",
    logo: "/images/integrations/google-sheets.png",
    description: "Direct export to Google Sheets",
    available: true
  },
  {
    name: "Google Drive",
    logo: "/images/integrations/google-drive.png",
    description: "Save files to Google Drive",
    available: true
  },
  {
    name: "Xero",
    logo: "/images/integrations/xero.png",
    description: "Export transactions to Xero",
    available: true
  },
  {
    name: "QuickBooks",
    logo: "/images/integrations/quickbooks.png",
    description: "Coming Soon",
    available: false
  },
  {
    name: "FreshBooks",
    logo: "/images/integrations/freshbooks.png",
    description: "Coming Soon",
    available: false
  },
  {
    name: "Wave",
    logo: "/images/integrations/wave.png",
    description: "Coming Soon",
    available: false
  }
];

export default function Integrations() {
  return (
    <div id="integrations" className="py-16 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base font-semibold uppercase tracking-wide text-blue-600">
            Integrations
          </h2>
          <p className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
            Connect with your favorite tools
          </p>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
            Seamlessly export your converted data to the accounting and productivity tools you already use.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6">
          {integrations.map((integration) => (
            <Card
              key={integration.name}
              className={`relative overflow-hidden transition-all duration-300 ${
                integration.available 
                  ? "hover:shadow-lg hover:scale-105 cursor-pointer" 
                  : "opacity-60"
              }`}
            >
              <div className="p-6 text-center">
                <div className="h-16 w-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                  {/* Placeholder for logos - in production, use actual logos */}
                  <div className="text-xs font-semibold text-gray-600">
                    {integration.name.split(' ')[0]}
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {integration.name}
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  {integration.description}
                </p>
                {!integration.available && (
                  <div className="absolute inset-0 bg-gray-50 bg-opacity-50 flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600 bg-white px-2 py-1 rounded-full shadow-sm">
                      Coming Soon
                    </span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-600">
            Need a specific integration? 
            <a href="mailto:support@statementdesk.io" className="ml-1 text-blue-600 hover:underline">
              Let us know
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}