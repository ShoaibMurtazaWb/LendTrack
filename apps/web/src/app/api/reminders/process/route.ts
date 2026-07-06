import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/billing";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { processLoanRemindersForUser } from "@/lib/reminders/loan-reminders";

/** Process due/overdue email reminders for the authenticated user's loans. */
export async function POST(request: Request) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimit(`reminders:${userId}`, { limit: 4, windowMs: 60 * 60 * 1000 });
  if (!limited.ok) {
    return rateLimitResponse(limited.retryAfterMs);
  }

  const result = await processLoanRemindersForUser(userId);
  return NextResponse.json({ success: true, ...result });
}
