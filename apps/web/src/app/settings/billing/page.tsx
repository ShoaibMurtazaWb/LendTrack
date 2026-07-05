"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { PageHeader } from "@/components/ui";
import { useProfile } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import type { BillingStatus, Subscription } from "@lendtrack/shared-types";

async function billingFetch(path: string, options?: RequestInit) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const res = await fetch(`/api/billing${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token}`,
      ...options?.headers,
    },
  });

  return res.json();
}

export default function BillingPage() {
  const { data: profile } = useProfile();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("subscriptions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setSubscription(data);
        setLoading(false);
      });
  }, [profile?.plan]);

  const billing: BillingStatus | null = profile
    ? { plan: profile.plan, subscription }
    : null;

  const handleUpgrade = async () => {
    const res = await billingFetch("/checkout", { method: "POST" });
    if (res.url) window.location.href = res.url;
  };

  const handleCancel = async () => {
    await billingFetch("/cancel", { method: "POST" });
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setSubscription(data);
  };

  return (
    <AuthGuard>
      <AppShell>
        <PageHeader
          title="Billing"
          action={
            <Link href="/settings" className="text-sm text-emerald-700 hover:underline">
              ← Settings
            </Link>
          }
        />

        {loading ? (
          <p className="text-slate-500">Loading...</p>
        ) : (
          <div className="max-w-lg rounded-xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-500">Current plan</p>
            <p className="mt-1 text-2xl font-bold capitalize text-slate-900">
              {billing?.plan ?? "free"}
            </p>

            {billing?.plan === "free" ? (
              <div className="mt-6">
                <p className="text-sm text-slate-600">
                  Upgrade to Premium for unlimited active loans, weekly digest emails, and priority reminders.
                </p>
                <button
                  onClick={handleUpgrade}
                  className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Upgrade to Premium
                </button>
              </div>
            ) : (
              <div className="mt-6">
                {billing?.subscription && (
                  <p className="text-sm text-slate-600">
                    Renews:{" "}
                    {new Date(billing.subscription.current_period_end).toLocaleDateString()}
                  </p>
                )}
                <button
                  onClick={handleCancel}
                  className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel subscription
                </button>
              </div>
            )}
          </div>
        )}
      </AppShell>
    </AuthGuard>
  );
}
