"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { Check, ArrowLeft, Loader2 } from "lucide-react";
import { createClient } from "~/lib/supabase/client";
import { Button } from "~/components/ui/button";
import { Navbar } from "~/components/navbar";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    features: [
      "1-hour meeting limit",
      "Up to 4 participants",
      "Screen sharing",
      "In-call chat",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$12",
    period: "/month",
    popular: true,
    features: [
      "Unlimited meeting duration",
      "Up to 25 participants",
      "Screen sharing",
      "In-call chat",
      "Meeting recordings",
      "Custom branding",
    ],
  },
  {
    id: "team",
    name: "Team",
    price: "$30",
    period: "/month",
    features: [
      "Everything in Pro",
      "Up to 100 participants",
      "Admin dashboard",
      "Team analytics",
      "Priority support",
      "SSO (coming soon)",
    ],
  },
];

function CheckoutForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPlan = searchParams.get("plan") || "";
  const supabase = createClient();
  const [loading, setLoading] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }
      setUserId(user.id);
      setEmail(user.email || "");
    }
    load();
  }, [supabase, router]);

  async function handleCheckout(planId: string) {
    if (planId === "free") return;
    setLoading(planId);

    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId, userId, email }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("No checkout URL returned");
        setLoading(null);
      }
    } catch {
      setLoading(null);
    }
  }

  return (
    <div>
      <Navbar />
      <div className="mx-auto max-w-5xl px-6 py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
            Choose your plan
          </h1>
          <p className="text-muted-foreground">
            Start free, upgrade when you need more
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-xl border p-6 transition-colors ${
                plan.id === selectedPlan || plan.popular
                  ? "border-primary bg-card shadow-sm"
                  : "border-border bg-card"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                  Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground">
                  {plan.name}
                </h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {plan.period}
                  </span>
                </div>
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-foreground"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>

              {plan.id === "free" ? (
                <Button variant="outline" disabled className="w-full">
                  Current plan
                </Button>
              ) : (
                <Button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={loading === plan.id}
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                >
                  {loading === plan.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redirecting...
                    </>
                  ) : (
                    `Upgrade to ${plan.name}`
                  )}
                </Button>
              )}
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Payments are processed securely by Stripe. Cancel anytime.
        </p>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutForm />
    </Suspense>
  );
}
