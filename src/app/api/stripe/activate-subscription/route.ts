import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PRICES: Record<string, string> = {
  pro: process.env.STRIPE_PRO_PRICE_ID!,
  team: process.env.STRIPE_TEAM_PRICE_ID!,
};

export async function POST(request: Request) {
  try {
    const { plan, userId, customerId, paymentMethodId } = await request.json();

    if (!plan || !PRICES[plan]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Set the payment method as the customer's default
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    // Create the subscription (will charge immediately using the default payment method)
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: PRICES[plan] }],
      default_payment_method: paymentMethodId,
      metadata: { user_id: userId, plan },
    });

    const periodEnd = (subscription as unknown as Record<string, unknown>)
      .current_period_end as number;

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabaseAdmin.from("subscriptions").upsert(
      {
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        plan,
        status: subscription.status === "active" ? "active" : "incomplete",
        current_period_end: periodEnd
          ? new Date(periodEnd * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    return NextResponse.json({ success: true, status: subscription.status });
  } catch (err) {
    console.error("Activate subscription error:", err);
    return NextResponse.json(
      { error: "Failed to activate subscription" },
      { status: 500 }
    );
  }
}
