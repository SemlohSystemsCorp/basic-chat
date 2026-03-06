import Link from "next/link";
import { Check, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Navbar } from "~/components/navbar";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "For casual use and trying things out.",
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
    description: "For professionals who need more from their meetings.",
    features: [
      "Unlimited meeting duration",
      "Up to 25 participants",
      "Screen sharing",
      "In-call chat",
      "Cloud recording",
      "Custom branding",
      "HD video quality",
    ],
  },
  {
    id: "team",
    name: "Team",
    price: "$30",
    period: "/month",
    description: "For teams that need collaboration at scale.",
    features: [
      "Everything in Pro",
      "Up to 100 participants",
      "Admin dashboard",
      "Team analytics",
      "Priority support",
      "SSO (coming soon)",
      "Custom domains (coming soon)",
    ],
  },
];

const COMPARISON = [
  { feature: "Meeting duration", free: "1 hour", pro: "Unlimited", team: "Unlimited" },
  { feature: "Participants", free: "4", pro: "25", team: "100" },
  { feature: "Screen sharing", free: true, pro: true, team: true },
  { feature: "In-call chat", free: true, pro: true, team: true },
  { feature: "Cloud recording", free: false, pro: true, team: true },
  { feature: "Custom branding", free: false, pro: true, team: true },
  { feature: "HD video", free: false, pro: true, team: true },
  { feature: "Admin dashboard", free: false, pro: false, team: true },
  { feature: "Team analytics", free: false, pro: false, team: true },
  { feature: "Priority support", free: false, pro: false, team: true },
  { feature: "SSO", free: false, pro: false, team: "Coming soon" },
];

export default function PricingPage() {
  return (
    <div>
      <Navbar />
      <div className="mx-auto max-w-5xl px-6 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Start free. Upgrade when you need more. Cancel anytime.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid gap-6 sm:grid-cols-3 mb-20">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded border bg-card p-6 ${
                plan.popular ? "border-primary shadow-sm" : "border-border"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                  Most popular
                </div>
              )}
              <h3 className="text-lg font-semibold text-foreground">
                {plan.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {plan.description}
              </p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-foreground">
                  {plan.price}
                </span>
                <span className="text-sm text-muted-foreground">
                  {plan.period}
                </span>
              </div>
              <ul className="mt-6 space-y-2.5">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                {plan.id === "free" ? (
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/auth/signup">Get started</Link>
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                    asChild
                  >
                    <Link href={`/auth/signup?checkoutPlan=${plan.id}`}>
                      Upgrade to {plan.name}
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Feature comparison table */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground text-center mb-8">
            Compare plans
          </h2>
          <div className="rounded border border-border bg-card overflow-hidden">
            <div className="grid grid-cols-4 gap-4 border-b border-border px-6 py-4 text-sm font-medium">
              <span className="text-muted-foreground">Feature</span>
              <span className="text-center text-foreground">Free</span>
              <span className="text-center text-foreground">Pro</span>
              <span className="text-center text-foreground">Team</span>
            </div>
            {COMPARISON.map((row) => (
              <div
                key={row.feature}
                className="grid grid-cols-4 gap-4 border-b border-border px-6 py-3 text-sm last:border-0"
              >
                <span className="text-muted-foreground">{row.feature}</span>
                {[row.free, row.pro, row.team].map((val, i) => (
                  <span key={i} className="flex items-center justify-center">
                    {val === true ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : val === false ? (
                      <X className="h-4 w-4 text-muted-foreground/30" />
                    ) : (
                      <span className="text-muted-foreground text-xs">
                        {val}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold tracking-tight text-foreground text-center mb-8">
            Frequently asked questions
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {[
              {
                q: "Can I cancel anytime?",
                a: "Yes. You can cancel your subscription at any time from your billing settings. You'll keep access until the end of your billing period.",
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major credit and debit cards through Stripe, including Visa, Mastercard, and American Express.",
              },
              {
                q: "Can I switch between plans?",
                a: "Yes. You can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle.",
              },
              {
                q: "Is there a free trial?",
                a: "The Free plan is always free with no time limit. You can try all the basic features before deciding to upgrade.",
              },
              {
                q: "How does recording work?",
                a: "On Pro and Team plans, you can enable recording when creating a meeting. Recordings are saved to the cloud and accessible to the meeting host.",
              },
              {
                q: "Do you offer refunds?",
                a: "We don't offer refunds for partial months, but you can cancel anytime to prevent future charges.",
              },
            ].map(({ q, a }) => (
              <div key={q} className="rounded border border-border bg-card p-5">
                <h3 className="font-medium text-foreground mb-2">{q}</h3>
                <p className="text-sm text-muted-foreground">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
