import { createAdminClient } from "@/lib/supabase-admin";
import { sendPasswordResetEmail } from "@/lib/mail";
import { formatAuthErrorMessage, PASSWORD_RESET_EMAIL_LIMIT } from "@/lib/auth-errors";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

type Payload = { email?: string };

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Payload;
  const email = (body.email ?? "").trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const limited = rateLimit(`password-reset:${email}`, { limit: PASSWORD_RESET_EMAIL_LIMIT, windowMs: 60 * 60 * 1000 });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterMs);

  const supabase = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${appUrl}/auth/reset-password` },
    });

    if (error) {
      // Keep response generic to avoid account enumeration.
      return Response.json({ success: true });
    }

    const resetUrl = data?.properties?.action_link;
    if (!resetUrl) return Response.json({ success: true });

    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", data.user?.id).maybeSingle();
    await sendPasswordResetEmail({
      to: email,
      name: profile?.full_name || undefined,
      resetUrl,
    });

    return Response.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? formatAuthErrorMessage(err.message) : "Failed to send reset email";
    return Response.json({ error: message }, { status: 500 });
  }
}

