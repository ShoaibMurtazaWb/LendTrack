import { NextResponse } from "next/server";
import { processAllLoanReminders, processWeeklyDigests } from "@/lib/reminders/loan-reminders";

/** Daily cron — set CRON_SECRET and call via Vercel Cron or external scheduler. */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [reminders, digest] = await Promise.all([
    processAllLoanReminders(),
    processWeeklyDigests(),
  ]);

  return NextResponse.json({ success: true, reminders, digest });
}
