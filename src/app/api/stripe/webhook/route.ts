import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const plan = session.metadata?.plan || "pro";

      if (!userId) break;

      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );
      const periodEnd = (subscription as unknown as Record<string, unknown>).current_period_end as number;

      await supabaseAdmin.from("subscriptions").upsert(
        {
          user_id: userId,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscription.id,
          plan,
          status: "active",
          current_period_end: new Date(
            periodEnd * 1000
          ).toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = (invoice as unknown as Record<string, unknown>).subscription as string;
      if (!subId) break;

      const subscription = await stripe.subscriptions.retrieve(subId);
      const periodEnd = (subscription as unknown as Record<string, unknown>).current_period_end as number;

      await supabaseAdmin
        .from("subscriptions")
        .update({
          status: "active",
          current_period_end: new Date(
            periodEnd * 1000
          ).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", subId);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = (invoice as unknown as Record<string, unknown>).subscription as string;
      if (!subId) break;

      await supabaseAdmin
        .from("subscriptions")
        .update({
          status: "past_due",
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", subId);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;

      await supabaseAdmin
        .from("subscriptions")
        .update({
          status: "canceled",
          plan: "free",
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", subscription.id);
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const periodEnd = (subscription as unknown as Record<string, unknown>).current_period_end as number;

      const status = subscription.cancel_at_period_end
        ? "canceled"
        : subscription.status === "active"
          ? "active"
          : subscription.status === "past_due"
            ? "past_due"
            : "active";

      await supabaseAdmin
        .from("subscriptions")
        .update({
          status,
          current_period_end: new Date(
            periodEnd * 1000
          ).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", subscription.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
