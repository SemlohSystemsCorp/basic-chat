"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { Check, CreditCard, AlertCircle } from "lucide-react";
import { createClient } from "~/lib/supabase/client";
import { Button } from "~/components/ui/button";
import type { Subscription } from "~/lib/types";

function BillingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [userId, setUserId] = useState("");

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

      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single();

      setSub(data);
      setLoading(false);
    }
    load();
  }, [supabase, router]);

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel your subscription?")) return;
    setCanceling(true);

    try {
      const res = await fetch("/api/stripe/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        const { data } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", userId)
          .single();
        setSub(data);
      }
    } catch {
      console.error("Failed to cancel");
    }
    setCanceling(false);
  }

  const plan = sub?.plan || "free";
  const isActive = sub?.status === "active";
  const isCanceled = sub?.status === "canceled";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Billing</h2>
        <p className="text-sm text-muted-foreground">
          Manage your subscription and billing details.
        </p>
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <Check className="h-4 w-4" />
          Subscription activated successfully!
        </div>
      )}

      {loading ? (
        <div className="h-48 animate-pulse rounded border border-border bg-card" />
      ) : (
        <div className="space-y-6">
          {/* Current plan */}
          <div className="rounded border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-foreground">
                Current plan
              </h3>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  isActive
                    ? "bg-green-100 text-green-800"
                    : isCanceled
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                }`}
              >
                {sub?.status || "free"}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-bold text-foreground capitalize">
                {plan}
              </span>
              {plan !== "free" && (
                <span className="text-sm text-muted-foreground">
                  {plan === "pro" ? "$12/mo" : "$30/mo"}
                </span>
              )}
            </div>

            {sub?.current_period_end && (
              <p className="text-sm text-muted-foreground">
                {isCanceled ? "Access until: " : "Next billing date: "}
                {new Date(sub.current_period_end).toLocaleDateString()}
              </p>
            )}

            <div className="mt-6 flex gap-3">
              {plan === "free" ? (
                <Button asChild>
                  <Link href="/checkout">Upgrade plan</Link>
                </Button>
              ) : (
                <>
                  <Button variant="outline" asChild>
                    <Link href="/checkout">Change plan</Link>
                  </Button>
                  {isActive && (
                    <Button
                      variant="destructive"
                      onClick={handleCancel}
                      disabled={canceling}
                    >
                      {canceling ? "Canceling..." : "Cancel subscription"}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Payment method */}
          {plan !== "free" && (
            <div className="rounded border border-border bg-card p-6">
              <h3 className="text-sm font-medium text-foreground mb-4">
                Payment method
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Managed by Stripe
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Payment details are securely handled by Stripe
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Warning for past due */}
          {sub?.status === "past_due" && (
            <div className="flex items-start gap-3 rounded border border-destructive/20 bg-destructive/5 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 text-destructive shrink-0" />
              <div>
                <p className="font-medium text-destructive">Payment failed</p>
                <p className="text-sm text-destructive/80 mt-1">
                  Your last payment failed. Please update your payment method to
                  keep your subscription active.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense>
      <BillingContent />
    </Suspense>
  );
}
