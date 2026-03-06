"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2, Receipt } from "lucide-react";
import { createClient } from "~/lib/supabase/client";

type Invoice = {
  id: string;
  amount: number;
  currency: string;
  status: string | null;
  created: number;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
};

export default function PaymentsSettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      try {
        const res = await fetch("/api/stripe/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load payments");
        } else {
          setInvoices(data.invoices);
        }
      } catch {
        setError("Failed to load payments");
      }
      setLoading(false);
    }
    load();
  }, [supabase, router]);

  function formatAmount(amount: number, currency: string) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Payments</h2>
        <p className="text-sm text-muted-foreground">
          View your payment history and invoices.
        </p>
      </div>

      {error && (
        <div className="rounded border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="rounded border border-border bg-card p-6">
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Receipt className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-foreground">
              No payments yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Your payment history will appear here once you subscribe to a
              plan.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded border border-border bg-card">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground">
            <span>Date</span>
            <span>Amount</span>
            <span>Status</span>
            <span></span>
          </div>
          {invoices.map((inv) => (
            <div
              key={inv.id}
              className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 border-b border-border px-4 py-3 last:border-0"
            >
              <span className="text-sm text-foreground">
                {new Date(inv.created * 1000).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span className="text-sm font-medium text-foreground">
                {formatAmount(inv.amount, inv.currency)}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  inv.status === "paid"
                    ? "bg-green-100 text-green-800"
                    : inv.status === "open"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                }`}
              >
                {inv.status}
              </span>
              <div className="flex gap-2">
                {inv.hosted_invoice_url && (
                  <a
                    href={inv.hosted_invoice_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
