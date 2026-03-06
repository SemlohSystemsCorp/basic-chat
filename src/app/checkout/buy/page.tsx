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
import { ArrowLeft, Check, Lock, Loader2, Shield } from "lucide-react";
import { createClient } from "~/lib/supabase/client";
import { Button } from "~/components/ui/button";
import { Navbar } from "~/components/navbar";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

const PLANS: Record<
  string,
  { name: string; price: string; features: string[] }
> = {
  pro: {
    name: "Pro",
    price: "$12/month",
    features: [
      "Unlimited meeting duration",
      "Up to 25 participants",
      "Screen sharing",
      "In-call chat",
      "Meeting recordings",
      "Custom branding",
    ],
  },
  team: {
    name: "Team",
    price: "$30/month",
    features: [
      "Everything in Pro",
      "Up to 100 participants",
      "Admin dashboard",
      "Team analytics",
      "Priority support",
      "SSO (coming soon)",
    ],
  },
};

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

    // Confirm the SetupIntent to save the payment method
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

    // Now activate the subscription with the saved payment method
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

  const planInfo = PLANS[plan];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="rounded border border-border bg-card p-5">
        <h3 className="font-semibold text-foreground mb-1">
          {planInfo.name} plan
        </h3>
        <p className="text-2xl font-bold text-foreground">{planInfo.price}</p>
        <ul className="mt-4 space-y-2">
          {planInfo.features.map((f) => (
            <li
              key={f}
              className="flex items-start gap-2 text-sm text-muted-foreground"
            >
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {f}
            </li>
          ))}
        </ul>
      </div>

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

function CheckoutBuyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "pro";
  const supabase = createClient();

  const [clientSecret, setClientSecret] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      if (!PLANS[plan]) {
        router.push("/checkout");
        return;
      }

      setUserId(user.id);

      try {
        const res = await fetch("/api/stripe/create-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan,
            userId: user.id,
            email: user.email,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to initialize checkout");
          setLoading(false);
          return;
        }

        setClientSecret(data.clientSecret);
        setCustomerId(data.customerId);
      } catch {
        setError("Something went wrong. Please try again.");
      }
      setLoading(false);
    }

    init();
  }, [supabase, router, plan]);

  return (
    <div>
      <Navbar />
      <div className="mx-auto max-w-lg px-6 py-10">
        <Link
          href="/checkout"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to plans
        </Link>

        <h1 className="text-2xl font-bold tracking-tight text-foreground mb-6">
          Complete your purchase
        </h1>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="rounded border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
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
              plan={plan}
              customerId={customerId}
              userId={userId}
            />
          </Elements>
        ) : null}
      </div>
    </div>
  );
}

export default function CheckoutBuyPage() {
  return (
    <Suspense>
      <CheckoutBuyContent />
    </Suspense>
  );
}
