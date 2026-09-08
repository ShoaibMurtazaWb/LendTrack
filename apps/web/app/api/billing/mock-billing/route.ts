// =============================================================================
// LendTrack :: Local Mock Billing Route Handler
// apps/web/app/api/billing/mock-billing/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '../../../../services/authHelper.js';
import { upgradeUserToPremium, downgradeUserToFree } from '../../../../services/stripe.js';

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401 }
    );
  }

  const action = req.nextUrl.searchParams.get('action') || 'upgrade';

  try {
    if (action === 'upgrade') {
      const mockSubId = 'mock_sub_' + Math.random().toString(36).substring(2, 10);
      await upgradeUserToPremium(user.id, mockSubId);
      return NextResponse.json({
        success: true,
        message: 'Successfully upgraded to Premium via mock billing.',
      });
    } else {
      await downgradeUserToFree(user.id);
      return NextResponse.json({
        success: true,
        message: 'Successfully downgraded to Free via mock billing.',
      });
    }
  } catch (error: any) {
    console.error('[API Mock Billing] Failed to run mock billing action:', error);
    return NextResponse.json(
      { success: false, error: { code: 'MOCK_UPGRADE_FAILED', message: error.message || 'Mock operation failed.' } },
      { status: 500 }
    );
  }
}
