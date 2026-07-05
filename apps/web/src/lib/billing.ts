import { createAdminClient } from "@/lib/supabase-admin";
import { getStripe } from "@/lib/stripe";
import type Stripe from "stripe";

export async function getUserIdFromRequest(request: Request): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

export async function createCheckoutSession(userId: string, email: string): Promise<string | null> {
  const stripeClient = getStripe();
  if (!stripeClient || !process.env.STRIPE_PRICE_ID_PREMIUM) return null;

  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();

  let customerId = profile?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripeClient.customers.create({ email, metadata: { userId } });
    customerId = customer.id;
    await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", userId);
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const session = await stripeClient.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: process.env.STRIPE_PRICE_ID_PREMIUM, quantity: 1 }],
    success_url: `${origin}/settings/billing?success=true`,
    cancel_url: `${origin}/settings/billing?canceled=true`,
    metadata: { userId },
  });

  return session.url;
}

export async function cancelSubscription(userId: string): Promise<boolean> {
  const stripeClient = getStripe();
  if (!stripeClient) return false;

  const supabase = createAdminClient();
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("provider_subscription_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (!sub) return false;

  await stripeClient.subscriptions.cancel(sub.provider_subscription_id);
  return true;
}

export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  const supabase = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (!userId || !session.subscription) return;

      const stripeClient = getStripe();
      if (!stripeClient) return;

      const sub = await stripeClient.subscriptions.retrieve(session.subscription as string);

      await supabase.from("subscriptions").upsert(
        {
          user_id: userId,
          provider_subscription_id: sub.id,
          status: "active",
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        },
        { onConflict: "provider_subscription_id" }
      );

      await supabase.from("profiles").update({ plan: "premium" }).eq("id", userId);
      break;
    }
    case "customer.subscription.deleted":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const status =
        sub.status === "active" ? "active" : sub.status === "past_due" ? "past_due" : "canceled";

      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("provider_subscription_id", sub.id)
        .single();

      if (!subscription) return;

      await supabase
        .from("subscriptions")
        .update({
          status,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        })
        .eq("provider_subscription_id", sub.id);

      await supabase
        .from("profiles")
        .update({ plan: status === "active" ? "premium" : "free" })
        .eq("id", subscription.user_id);
      break;
    }
  }
}
