// =============================================================================
// LendTrack :: Stripe Checkout Session Route Handler
// apps/web/app/api/billing/checkout/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '../../../../services/authHelper.js';
import { createCheckoutSession } from '../../../../services/stripe.js';

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user || !user.email) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401 }
    );
  }

  try {
    const session = await createCheckoutSession(user.id, user.email);
    return NextResponse.json({
      success: true,
      data: {
        url: session.url,
        sessionId: session.id,
      },
    });
  } catch (error: any) {
    console.error('[API Checkout] Failed to create checkout session:', error);
    return NextResponse.json(
      { success: false, error: { code: 'STRIPE_ERROR', message: error.message || 'Failed to create Checkout session.' } },
      { status: 500 }
    );
  }
}
