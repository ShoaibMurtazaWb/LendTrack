import { NextResponse } from "next/server";
import { createCheckoutSession, getUserIdFromRequest } from "@/lib/billing";
import { createAdminClient } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: authUser } = await supabase.auth.admin.getUserById(userId);
  const email = authUser?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "User email not found" }, { status: 400 });
  }

  const url = await createCheckoutSession(userId, email);
  if (!url) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  return NextResponse.json({ url });
}
