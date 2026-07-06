import { createAdminClient } from "@/lib/supabase-admin";
import {
  sendPremiumEnded,
  sendPremiumEndingSoon,
  sendPremiumPaymentFailed,
} from "@/lib/mail";
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

async function getUserEmailContext(userId: string) {
  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, plan")
    .eq("id", userId)
    .single();

  const { data: authUser } = await supabase.auth.admin.getUserById(userId);
  const email = authUser.user?.email;
  if (!email) return null;

  return {
    email,
    name: profile?.full_name || "",
    plan: profile?.plan as string | undefined,
  };
}

async function getLockedLoanCount(userId: string) {
  const supabase = createAdminClient();
  const { count } = await supabase
    .from("loans")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_locked", true);

  return count ?? 0;
}

function formatDate(unixSeconds: number) {
  return new Date(unixSeconds * 1000).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

async function notifyPremiumEndingSoon(userId: string, endUnix: number) {
  const ctx = await getUserEmailContext(userId);
  if (!ctx) return;

  await sendPremiumEndingSoon({
    to: ctx.email,
    name: ctx.name,
    endDate: formatDate(endUnix),
  });
}

async function notifyPremiumEnded(userId: string) {
  const ctx = await getUserEmailContext(userId);
  if (!ctx) return;

  const lockedCount = await getLockedLoanCount(userId);

  await sendPremiumEnded({
    to: ctx.email,
    name: ctx.name,
    lockedCount,
  });
}

async function notifyPaymentFailed(userId: string, amountDue?: string) {
  const ctx = await getUserEmailContext(userId);
  if (!ctx) return;

  await sendPremiumPaymentFailed({
    to: ctx.email,
    name: ctx.name,
    amountDue,
  });
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

  // Cancel at period end so user keeps Premium until billing cycle ends
  await stripeClient.subscriptions.update(sub.provider_subscription_id, {
    cancel_at_period_end: true,
  });

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
      await supabase.rpc("apply_loan_plan_locks", { p_user_id: userId });
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const status =
        sub.status === "active" ? "active" : sub.status === "past_due" ? "past_due" : "canceled";

      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("user_id, status")
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

      const newPlan = status === "active" ? "premium" : "free";

      await supabase.from("profiles").update({ plan: newPlan }).eq("id", subscription.user_id);

      await supabase.rpc("apply_loan_plan_locks", { p_user_id: subscription.user_id });

      // Premium ending soon — user canceled but still active until period end
      if (sub.cancel_at_period_end && sub.status === "active") {
        await notifyPremiumEndingSoon(subscription.user_id, sub.current_period_end);
      }

      // Payment failed — prompt to update card / retry
      if (status === "past_due" && subscription.status !== "past_due") {
        await notifyPaymentFailed(subscription.user_id);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;

      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("provider_subscription_id", sub.id)
        .single();

      if (!subscription) return;

      const { data: profileBefore } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", subscription.user_id)
        .single();

      await supabase
        .from("subscriptions")
        .update({ status: "canceled" })
        .eq("provider_subscription_id", sub.id);

      await supabase.from("profiles").update({ plan: "free" }).eq("id", subscription.user_id);

      await supabase.rpc("apply_loan_plan_locks", { p_user_id: subscription.user_id });

      if (profileBefore?.plan === "premium") {
        await notifyPremiumEnded(subscription.user_id);
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      if (!invoice.subscription) return;

      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("provider_subscription_id", invoice.subscription as string)
        .single();

      if (!subscription) return;

      const amountDue = invoice.amount_due
        ? `$${(invoice.amount_due / 100).toFixed(2)}`
        : undefined;

      await notifyPaymentFailed(subscription.user_id, amountDue);
      break;
    }
  }
}
