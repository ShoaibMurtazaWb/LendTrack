// =============================================================================
// LendTrack :: Stripe Portal Session Route Handler
// apps/web/app/api/billing/portal/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '../../../../services/authHelper.js';
import { createPortalSession } from '../../../../services/stripe.js';

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401 }
    );
  }

  try {
    const portal = await createPortalSession(user.id);
    return NextResponse.json({
      success: true,
      data: {
        url: portal.url,
      },
    });
  } catch (error: any) {
    console.error('[API Portal] Failed to create portal session:', error);
    return NextResponse.json(
      { success: false, error: { code: 'STRIPE_ERROR', message: error.message || 'Failed to create Customer Portal session.' } },
      { status: 500 }
    );
  }
}
