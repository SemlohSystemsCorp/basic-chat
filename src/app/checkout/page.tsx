"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Check, ArrowLeft, Lock, Loader2, Shield } from "lucide-react";
import { createClient } from "~/lib/supabase/client";
import { Button } from "~/components/ui/button";
import { Navbar } from "~/components/navbar";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

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

function PaymentForm({
  plan,
  customerId,
  userId,
}: {
  plan: string;
  customerId: string;
  userId: string;
}) {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  const planInfo = PLANS.find((p) => p.id === plan)!;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setError("");
    setProcessing(true);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || "Payment failed");
      setProcessing(false);
      return;
    }

    const { error: confirmError, setupIntent } = await stripe.confirmSetup({
      elements,
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message || "Payment setup failed");
      setProcessing(false);
      return;
    }

    if (!setupIntent || setupIntent.status !== "succeeded") {
      setError("Payment setup did not complete. Please try again.");
      setProcessing(false);
      return;
    }

    try {
      const res = await fetch("/api/stripe/activate-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          userId,
          customerId,
          paymentMethodId: setupIntent.payment_method,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to activate subscription");
        setProcessing(false);
        return;
      }

      router.push("/settings/billing?success=true");
    } catch {
      setError("Something went wrong. Please try again.");
      setProcessing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div>
        <h3 className="font-semibold text-foreground mb-3">Payment details</h3>
        <div className="rounded border border-border bg-card p-4">
          <PaymentElement />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={!stripe || processing}
      >
        {processing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Lock className="mr-2 h-4 w-4" />
            Subscribe to {planInfo.name}
          </>
        )}
      </Button>

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Shield className="h-3.5 w-3.5" />
        Payments secured by Stripe. Cancel anytime.
      </div>
    </form>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPlan = searchParams.get("plan") || "";
  const supabase = createClient();

  const [selectedPlan, setSelectedPlan] = useState(initialPlan);
  const [clientSecret, setClientSecret] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [userId, setUserId] = useState("");
  const [loadingSetup, setLoadingSetup] = useState(false);
  const [setupError, setSetupError] = useState("");

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
    }
    load();
  }, [supabase, router]);

  async function handleSelectPlan(planId: string) {
    if (planId === "free" || planId === selectedPlan) return;

    setSelectedPlan(planId);
    setClientSecret("");
    setSetupError("");
    setLoadingSetup(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const res = await fetch("/api/stripe/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planId,
          userId: user.id,
          email: user.email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSetupError(data.error || "Failed to initialize checkout");
        setLoadingSetup(false);
        return;
      }

      setClientSecret(data.clientSecret);
      setCustomerId(data.customerId);
    } catch {
      setSetupError("Something went wrong. Please try again.");
    }
    setLoadingSetup(false);
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
              className={`relative flex flex-col rounded border p-6 transition-colors ${
                plan.id === selectedPlan || (plan.popular && !selectedPlan)
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
              ) : plan.id === selectedPlan ? (
                <Button className="w-full" variant="default" disabled>
                  Selected
                </Button>
              ) : (
                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                >
                  Upgrade to {plan.name}
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Payment form appears below after selecting a plan */}
        {selectedPlan && selectedPlan !== "free" && (
          <div className="mx-auto mt-12 max-w-lg">
            {loadingSetup ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : setupError ? (
              <div className="rounded border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                {setupError}
              </div>
            ) : clientSecret ? (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: "night",
                    variables: {
                      colorPrimary: "hsl(142, 71%, 45%)",
                      colorBackground: "hsl(0, 0%, 9%)",
                      colorText: "hsl(0, 0%, 95%)",
                      colorTextSecondary: "hsl(0, 0%, 64%)",
                      borderRadius: "4px",
                      colorDanger: "hsl(0, 84%, 60%)",
                      fontFamily: "Inter, system-ui, sans-serif",
                    },
                    rules: {
                      ".Input": {
                        border: "1px solid hsl(0, 0%, 15%)",
                        backgroundColor: "hsl(0, 0%, 9%)",
                      },
                      ".Input:focus": {
                        border: "1px solid hsl(142, 71%, 45%)",
                        boxShadow: "0 0 0 1px hsla(142, 71%, 45%, 0.3)",
                      },
                    },
                  },
                }}
              >
                <PaymentForm
                  plan={selectedPlan}
                  customerId={customerId}
                  userId={userId}
                />
              </Elements>
            ) : null}
          </div>
        )}

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
      <CheckoutContent />
    </Suspense>
  );
}
