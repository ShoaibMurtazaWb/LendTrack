import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { getUserIdFromRequest } from "@/lib/billing";
import { loansToCsv } from "@/lib/export-loans";
import { LOAN_SELECT } from "@/lib/supabase";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

/** Premium: export full loan history as CSV. */
export async function GET(request: Request) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimit(`export-loans:${userId}`, { limit: 10, windowMs: 60 * 60 * 1000 });
  if (!limited.ok) {
    return rateLimitResponse(limited.retryAfterMs);
  }

  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .single();

  if (profile?.plan !== "premium") {
    return NextResponse.json(
      { error: "CSV export is available on the Premium plan." },
      { status: 403 }
    );
  }

  const { data: loans, error } = await supabase
    .from("loans")
    .select(LOAN_SELECT)
    .eq("user_id", userId)
    .order("expected_return_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const csv = loansToCsv(loans ?? []);
  const filename = `lendtrack-loans-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
