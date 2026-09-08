// =============================================================================
// LendTrack :: Stripe Billing Server Helpers
// apps/web/services/stripe.ts
// =============================================================================

import Stripe from 'stripe';
import { supabaseAdmin } from './supabaseAdmin.js';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
const priceIdPremium = process.env.STRIPE_PRICE_ID_PREMIUM || 'price_premium_placeholder';

const isMockMode = !stripeSecretKey || stripeSecretKey.includes('placeholder');

let stripe: Stripe | null = null;
if (!isMockMode) {
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-04-10' as any,
  });
} else {
  console.warn('[Stripe Server] Stripe keys are missing or placeholders. Running in MOCK billing mode.');
}

export function getIsMockMode() {
  return isMockMode;
}

export async function createCheckoutSession(userId: string, userEmail: string) {
  const successUrl = `http://localhost:3000/settings?billing_status=success`;
  const cancelUrl = `http://localhost:3000/settings?billing_status=cancel`;

  if (isMockMode) {
    console.log(`[Stripe Mock] Creating mock checkout session for user ${userId} (${userEmail})`);
    return {
      url: `http://localhost:3000/settings?billing_mock_upgrade=true&user_id=${userId}`,
      id: 'mock_sess_' + Math.random().toString(36).substring(2, 12),
    };
  }

  if (!stripe) throw new Error('Stripe is not initialized.');

  // Find or create customer
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  let customerId = profile?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: userEmail,
      metadata: { userId },
    });
    customerId = customer.id;

    // Update profile
    await supabaseAdmin
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', userId);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceIdPremium,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId },
  });

  return { url: session.url || successUrl, id: session.id };
}

export async function createPortalSession(userId: string) {
  const returnUrl = `http://localhost:3000/settings`;

  if (isMockMode) {
    console.log(`[Stripe Mock] Creating mock customer portal for user ${userId}`);
    return {
      url: `http://localhost:3000/settings?billing_mock_portal=true&user_id=${userId}`,
    };
  }

  if (!stripe) throw new Error('Stripe is not initialized.');

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  const customerId = profile?.stripe_customer_id;
  if (!customerId) {
    throw new Error('Customer does not have a Stripe billing profile yet. Upgrade first.');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return { url: session.url };
}

export async function handleWebhookEvent(payload: string | Buffer, signature: string) {
  if (isMockMode || !stripe) {
    console.log('[Stripe Mock] Received webhook payload (ignored in mock mode).');
    return { received: true };
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, stripeWebhookSecret);
  } catch (err: any) {
    console.error(`[Stripe Webhook] Verification failed:`, err.message);
    throw new Error(`Webhook Error: ${err.message}`);
  }

  console.log(`[Stripe Webhook] Received event type: ${event.type}`);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const subId = session.subscription as string;
      const customerId = session.customer as string;

      if (userId && subId) {
        await upgradeUserToPremium(userId, subId, customerId);
      }
      break;
    }
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const status = subscription.status;

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single();

      if (profile) {
        if (status === 'active') {
          await updateSubscriptionStatus(profile.id, subscription.id, 'active', subscription.current_period_end);
        } else if (status === 'past_due' || status === 'unpaid') {
          await updateSubscriptionStatus(profile.id, subscription.id, 'past_due', subscription.current_period_end);
        } else if (status === 'canceled') {
          await updateSubscriptionStatus(profile.id, subscription.id, 'canceled', subscription.current_period_end);
          await supabaseAdmin
            .from('profiles')
            .update({ plan: 'free' })
            .eq('id', profile.id);
        }
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single();

      if (profile) {
        await updateSubscriptionStatus(profile.id, subscription.id, 'canceled', subscription.current_period_end);
        await supabaseAdmin
          .from('profiles')
          .update({ plan: 'free' })
          .eq('id', profile.id);
      }
      break;
    }
  }

  return { received: true };
}

export async function upgradeUserToPremium(userId: string, subId: string, customerId?: string) {
  console.log(`[Stripe Billing] Upgrading user ${userId} to Premium plan.`);
  
  const profileUpdate: any = { plan: 'premium' };
  if (customerId) {
    profileUpdate.stripe_customer_id = customerId;
  }
  
  await supabaseAdmin
    .from('profiles')
    .update(profileUpdate)
    .eq('id', userId);

  const currentPeriodEnd = new Date();
  currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

  await supabaseAdmin
    .from('subscriptions')
    .insert([
      {
        user_id: userId,
        provider_subscription_id: subId,
        status: 'active',
        current_period_end: currentPeriodEnd.toISOString(),
      },
    ]);
}

export async function downgradeUserToFree(userId: string) {
  console.log(`[Stripe Billing] Downgrading user ${userId} to Free plan.`);
  await supabaseAdmin
    .from('profiles')
    .update({ plan: 'free' })
    .eq('id', userId);

  await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'canceled' })
    .eq('user_id', userId);
}

async function updateSubscriptionStatus(
  userId: string,
  subId: string,
  status: 'active' | 'canceled' | 'past_due',
  periodEndEpoch: number | null
) {
  const periodEndDate = periodEndEpoch ? new Date(periodEndEpoch * 1000).toISOString() : null;

  await supabaseAdmin
    .from('subscriptions')
    .upsert({
      user_id: userId,
      provider_subscription_id: subId,
      status,
      current_period_end: periodEndDate,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'provider_subscription_id',
    });
}
