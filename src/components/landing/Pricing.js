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

export default function Pricing() {
  const [loading, setLoading] = useState({});
  const { user } = useAuth();

  const tiers = Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => ({
    id: key,
    ...tier,
    popular: key === "basic",
  }));

  const handleSubscribe = async (tierId) => {
    if (!user) {
      // Redirect to signup if not authenticated
      window.location.href = "/auth/signup";
      return;
    }

    if (tierId === "free") {
      // Free tier doesn't need payment
      window.location.href = "/dashboard";
      return;
    }

    try {
      setLoading((prev) => ({ ...prev, [tierId]: true }));
      await redirectToCheckout(tierId);
    } catch (error) {
      console.error("Subscription error:", error);
      alert(`Failed to start subscription: ${error.message}`);
    } finally {
      setLoading((prev) => ({ ...prev, [tierId]: false }));
    }
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
            Start for free, upgrade as you grow. All plans include our core
            conversion features.
          </p>
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
                    ${tier.price}
                  </span>
                  {tier.price > 0 && (
                    <span className="text-lg font-medium text-gray-500">
                      /month
                    </span>
                  )}
                </div>
                <CardDescription className="mt-2">
                  {tier.id === "free" && "Perfect for trying out our service"}
                  {tier.id === "basic" &&
                    "Best for regular users and small businesses"}
                  {tier.id === "premium" && "Advanced features for power users"}
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
                  {tier.id === "free" ? "Start Free" : "Get Started"}
                </Button>

                {tier.id !== "free" && (
                  <p className="text-center text-sm text-gray-500 mt-3">
                    Cancel anytime. No hidden fees.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 bg-gray-50 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Need a custom solution?
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            We offer enterprise plans with custom features, dedicated support,
            and volume discounts for organizations processing large numbers of
            statements.
          </p>
          <Button variant="outline" size="lg">
            Contact Sales
          </Button>
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
                We support PDF bank statements from all major banks. Export
                formats include Excel (.xlsx) and CSV.
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
                Do you offer refunds?
              </h5>
              <p className="text-sm text-gray-600">
                Yes, we offer a 30-day money-back guarantee for all paid plans.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
