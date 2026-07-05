"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { PageHeader } from "@/components/ui";
import { useProfile } from "@/hooks/useAuth";

export default function SettingsPage() {
  const { data: profile } = useProfile();

  return (
    <AuthGuard>
      <AppShell>
        <PageHeader title="Settings" description="Manage your account and preferences" />

        <div className="max-w-lg space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold text-slate-900">Profile</h2>
            <p className="mt-2 text-sm text-slate-600">
              Name: {profile?.full_name || "—"}
            </p>
            <p className="text-sm text-slate-600">
              Plan: <span className="capitalize">{profile?.plan}</span>
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold text-slate-900">Notifications</h2>
            <p className="mt-2 text-sm text-slate-600">
              Email reminders: {profile?.notification_prefs?.email_reminders ? "On" : "Off"}
            </p>
            <p className="text-sm text-slate-600">
              Weekly digest: {profile?.notification_prefs?.weekly_digest ? "On" : "Off"}
            </p>
          </div>

          <Link
            href="/settings/billing"
            className="block rounded-xl border border-slate-200 bg-white p-6 hover:border-emerald-300"
          >
            <h2 className="font-semibold text-slate-900">Billing</h2>
            <p className="mt-1 text-sm text-slate-600">
              Manage your subscription and upgrade to Premium
            </p>
          </Link>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
