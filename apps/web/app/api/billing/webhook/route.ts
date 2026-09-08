// =============================================================================
// LendTrack :: Stripe Webhook Route Handler
// apps/web/app/api/billing/webhook/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { handleWebhookEvent } from '../../../../services/stripe.js';

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature') || '';
  
  try {
    const payload = await req.text();
    const result = await handleWebhookEvent(payload, sig);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API Webhook] Error processing event:', error);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }
}
