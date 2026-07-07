import { createAdminClient } from "@/lib/supabase-admin";
import { normalizeAuthEmail } from "@/lib/auth-errors";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

type Payload = { email?: string };

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Payload;
  const email = normalizeAuthEmail(body.email ?? "");

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const limited = rateLimit(`check-email:${email}`, { limit: 20, windowMs: 60 * 60 * 1000 });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterMs);

  try {
    const supabase = createAdminClient();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const response = await fetch(
      `${url}/auth/v1/admin/users?filter=${encodeURIComponent(`email.eq.${email}`)}`,
      {
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          apikey: serviceKey,
        },
      }
    );

    if (!response.ok) {
      // Fall back to paginated lookup if filter is unsupported.
      const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (error) return Response.json({ exists: false });

      const exists = data.users.some((user) => user.email?.toLowerCase() === email);
      return Response.json({ exists });
    }

    const payload = (await response.json()) as { users?: { email?: string | null }[] };
    const exists = (payload.users?.length ?? 0) > 0;
    return Response.json({ exists });
  } catch {
    return Response.json({ exists: false });
  }
}
