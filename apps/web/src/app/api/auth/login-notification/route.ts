import { createAdminClient } from "@/lib/supabase-admin";
import { sendLoginNotification } from "@/lib/mail";
import { getUserIdFromRequest } from "@/lib/billing";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

function parseDeviceLabel(userAgent: string | null) {
  if (!userAgent) return "Unknown device";
  if (/iPhone|iPad/i.test(userAgent)) return "Apple mobile device";
  if (/Android/i.test(userAgent)) return "Android device";
  if (/Windows/i.test(userAgent)) return "Windows PC";
  if (/Macintosh/i.test(userAgent)) return "Mac";
  if (/Linux/i.test(userAgent)) return "Linux device";
  return "Web browser";
}

export async function POST(request: Request) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimit(`login-notification:${userId}`, { limit: 10, windowMs: 60 * 60 * 1000 });
  if (!limited.ok) {
    return rateLimitResponse(limited.retryAfterMs);
  }

  const body = await request.json().catch(() => ({}));
  const userAgent = (body.userAgent as string) || request.headers.get("user-agent");
  const ipAddress =
    (body.ipAddress as string) ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip");

  const supabase = createAdminClient();
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", userId).single();
  const { data: authUser } = await supabase.auth.admin.getUserById(userId);

  const deviceLabel = parseDeviceLabel(userAgent);
  const loginTime = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  await supabase.from("login_sessions").insert({
    user_id: userId,
    ip_address: ipAddress,
    user_agent: userAgent,
    device_label: deviceLabel,
  });

  const email = authUser.user?.email;
  if (email) {
    await sendLoginNotification({
      to: email,
      name: profile?.full_name || "",
      deviceLabel,
      ipAddress: ipAddress || undefined,
      loginTime,
    });
  }

  return Response.json({ success: true });
}
