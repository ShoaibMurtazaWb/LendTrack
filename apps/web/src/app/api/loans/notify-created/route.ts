import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/billing";
import { notifyLoanCreated } from "@/lib/loans/notify-loan-created";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

/** Send confirmation emails when a new loan is created. */
export async function POST(request: Request) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimit(`notify-created:${userId}`, { limit: 20, windowMs: 60 * 60 * 1000 });
  if (!limited.ok) {
    return rateLimitResponse(limited.retryAfterMs);
  }

  const body = await request.json().catch(() => ({}));
  const loanId = body.loanId as string | undefined;
  if (!loanId) {
    return NextResponse.json({ error: "loanId required" }, { status: 400 });
  }

  const result = await notifyLoanCreated(loanId, userId);
  return NextResponse.json({ success: true, ...result });
}
