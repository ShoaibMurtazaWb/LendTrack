import { NextResponse } from "next/server";
import { cancelSubscription, getUserIdFromRequest } from "@/lib/billing";

export async function POST(request: Request) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const canceled = await cancelSubscription(userId);
  if (!canceled) {
    return NextResponse.json({ error: "No active subscription" }, { status: 404 });
  }

  return NextResponse.json({ message: "Subscription canceled" });
}
