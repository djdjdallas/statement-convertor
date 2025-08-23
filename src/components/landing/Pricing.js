"use client";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2 } from "lucide-react";
import { SUBSCRIPTION_TIERS } from "@/lib/subscription-tiers";
import { redirectToCheckout } from "@/lib/stripe-client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export default function Pricing() {
  const [loading, setLoading] = useState({});
  const [billingPeriod, setBillingPeriod] = useState("monthly");
  const { user } = useAuth();

  const tiers = Object.entries(SUBSCRIPTION_TIERS)
    .filter(([key]) => key !== 'enterprise') // Enterprise shown separately
    .map(([key, tier]) => ({
      id: key,
      ...tier,
      popular: key === "professional",
      displayPrice: tier.price === 'Custom' ? 'Custom' : 
        billingPeriod === 'yearly' && tier.price > 0 ? 
          Math.floor(tier.price * 12 * 0.8) : // 20% discount on yearly
          tier.price
    }));

  const handleSubscribe = async (tierId) => {
    if (!user) {
      // Redirect to signup with appropriate plan parameters
      if (tierId === "free") {
        window.location.href = "/auth/signup?plan=free";
      } else {
        window.location.href = `/auth/signup?plan=trial&tier=${tierId}&trial=true`;
      }
      return;
    }

    if (tierId === "free") {
      // Free tier doesn't need payment
      window.location.href = "/dashboard";
      return;
    }

    try {
      setLoading((prev) => ({ ...prev, [tierId]: true }));
      await redirectToCheckout(tierId, billingPeriod);
    } catch (error) {
      console.error("Subscription error:", error);
      toast({
        title: "Subscription Failed",
        description: error.message || "Failed to start subscription. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading((prev) => ({ ...prev, [tierId]: false }));
    }
  };

  const handleContactSales = () => {
    window.location.href = "mailto:sales@statementconverter.com?subject=Enterprise%20Plan%20Inquiry";
  };

  return (
    <div id="pricing" className="py-16 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base font-semibold uppercase tracking-wide text-blue-600">
            Pricing
          </h2>
          <p className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
            Choose the right plan for you
          </p>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
            Start with our 14-day free trial. No credit card required.
          </p>
        </div>

        {/* Billing period toggle */}
        <div className="mt-8 flex justify-center">
          <div className="relative bg-gray-100 rounded-full p-1 flex">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                billingPeriod === "monthly"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("yearly")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                billingPeriod === "yearly"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Yearly
              <Badge className="ml-2 bg-green-100 text-green-800" variant="secondary">
                Save 20%
              </Badge>
            </button>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {tiers.map((tier) => (
            <Card
              key={tier.id}
              className={`relative ${
                tier.popular ? "ring-2 ring-blue-500 shadow-xl" : "shadow-lg"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white px-4 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {tier.name}
                </CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">
                    ${typeof tier.displayPrice === 'number' ? tier.displayPrice : tier.displayPrice}
                  </span>
                  {tier.price > 0 && (
                    <span className="text-lg font-medium text-gray-500">
                      /{billingPeriod === 'yearly' ? 'year' : 'month'}
                    </span>
                  )}
                </div>
                <CardDescription className="mt-2">
                  {tier.id === "free" && "Perfect for trying out our service"}
                  {tier.id === "professional" &&
                    "Best for regular users and small businesses"}
                  {tier.id === "business" && "Advanced features for growing teams"}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0">
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSubscribe(tier.id)}
                  disabled={loading[tier.id]}
                  className={`w-full ${
                    tier.popular ? "bg-blue-600 hover:bg-blue-700" : ""
                  }`}
                  variant={tier.popular ? "default" : "outline"}
                >
                  {loading[tier.id] && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {!user ? (
                    tier.id === "free" ? "Start Free" : "Start 14-Day Trial"
                  ) : (
                    tier.id === "free" ? "Go to Dashboard" : "Upgrade Now"
                  )}
                </Button>

                {tier.id !== "free" && (
                  <p className="text-center text-sm text-gray-500 mt-3">
                    14-day free trial • Cancel anytime
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Enterprise section */}
        <div className="mt-16 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8">
          <div className="text-center max-w-3xl mx-auto">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Enterprise Plan
            </h3>
            <p className="text-lg text-gray-600 mb-6">
              Need unlimited conversions, custom integrations, or on-premise deployment? 
              Our Enterprise plan is tailored to meet your organization's specific needs.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-left">
              {SUBSCRIPTION_TIERS.enterprise.features.slice(0, 6).map((feature, index) => (
                <div key={index} className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
            <Button onClick={handleContactSales} size="lg" className="bg-blue-600 hover:bg-blue-700">
              Contact Sales
            </Button>
          </div>
        </div>

        <div className="mt-12 text-center">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Frequently Asked Questions
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
            <div>
              <h5 className="font-medium text-gray-900 mb-2">
                Can I change plans anytime?
              </h5>
              <p className="text-sm text-gray-600">
                Yes, you can upgrade or downgrade your plan at any time. Changes
                take effect immediately.
              </p>
            </div>
            <div>
              <h5 className="font-medium text-gray-900 mb-2">
                What file formats are supported?
              </h5>
              <p className="text-sm text-gray-600">
                We support PDF bank statements from 200+ banks with AI-powered
                recognition. Export to Excel, CSV, and more.
              </p>
            </div>
            <div>
              <h5 className="font-medium text-gray-900 mb-2">
                Is my data secure?
              </h5>
              <p className="text-sm text-gray-600">
                Absolutely. We use bank-level encryption and automatically
                delete files after processing.
              </p>
            </div>
            <div>
              <h5 className="font-medium text-gray-900 mb-2">
                Do you offer a free trial?
              </h5>
              <p className="text-sm text-gray-600">
                Yes! All paid plans include a 14-day free trial. No credit card
                required to start.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}