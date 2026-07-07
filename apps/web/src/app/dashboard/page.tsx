"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import {
  DashboardPerformanceCards,
  DashboardQuickActions,
  DashboardRecentActivity,
  DashboardTopContacts,
  DashboardUpgradeCard,
  DashboardWeekStrip,
  DashboardWelcome,
} from "@/components/dashboard/DashboardWidgets";
import { OnboardingChecklist } from "@/components/dashboard/OnboardingChecklist";
import { PageSkeleton } from "@/components/page-layout";
import { QueryErrorState } from "@/components/QueryErrorState";
import { useDashboardSummary, useLoans } from "@/hooks/useLoans";
import { useProfile } from "@/hooks/useAuth";
import { useContacts } from "@/hooks/useContacts";

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useDashboardSummary();
  const { data: allLoans } = useLoans();
  const { data: profile } = useProfile();
  const { data: contacts } = useContacts();
  const [dismissedOverdueKey, setDismissedOverdueKey] = useState<string | null>(null);

  const calendarLoans =
    allLoans?.filter(
      (l) => (l.status === "active" || l.status === "overdue") && !l.is_locked
    ) ?? [];

  const hasOverdue = (data?.overdue_count ?? 0) > 0;
  const dueThisWeek = data?.upcoming_due?.length ?? 0;
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const overdueCount = data?.overdue_count ?? 0;
  const overdueSessionKey = useMemo(
    () => `lendtrack:dashboard-overdue-dismissed:${profile?.id ?? "anon"}`,
    [profile?.id]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = sessionStorage.getItem(overdueSessionKey);
    setDismissedOverdueKey(stored);
  }, [overdueSessionKey]);

  const showOverdueBanner =
    hasOverdue && dismissedOverdueKey !== String(overdueCount);

  const dismissOverdueBanner = () => {
    const key = String(overdueCount);
    setDismissedOverdueKey(key);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(overdueSessionKey, key);
    }
  };

  return (
    <AuthGuard>
      <AppShell>
        <div className="page-canvas animate-fade-in">
          {showOverdueBanner && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-destructive/20 bg-error-container/40 px-5 py-3 text-sm text-destructive">
              <Link
                href="/loans"
                onClick={dismissOverdueBanner}
                className="flex min-w-0 flex-1 items-center justify-between gap-3 transition-colors hover:text-destructive/80"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <AlertTriangle className="size-4 shrink-0" />
                  You have <strong>{overdueCount}</strong> overdue loan
                  {overdueCount > 1 ? "s" : ""}
                </span>
                <span className="shrink-0 font-semibold underline">Review</span>
              </Link>
              <button
                type="button"
                onClick={dismissOverdueBanner}
                aria-label="Dismiss overdue warning"
                className="shrink-0 rounded-md p-1 text-destructive/80 transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          {isLoading ? (
            <PageSkeleton />
          ) : isError ? (
            <QueryErrorState onRetry={() => refetch()} />
          ) : (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-5">
              <section className="flex flex-col gap-5 lg:col-span-8">
                <DashboardWelcome
                  name={firstName}
                  dueCount={dueThisWeek}
                  activeCount={data?.active_count ?? 0}
                  overdueCount={data?.overdue_count ?? 0}
                />
                <OnboardingChecklist
                  hasContacts={(contacts?.length ?? 0) > 0}
                  hasLoans={
                    (data?.active_count ?? 0) +
                      (data?.overdue_count ?? 0) +
                      (data?.returned_count ?? 0) +
                      (data?.locked_count ?? 0) >
                    0
                  }
                />
                <DashboardWeekStrip loans={calendarLoans} />
                <DashboardPerformanceCards
                  active={data?.active_count ?? 0}
                  overdue={data?.overdue_count ?? 0}
                  returned={data?.returned_count ?? 0}
                  locked={data?.locked_count ?? 0}
                />
              </section>

              <aside className="flex flex-col gap-5 lg:col-span-4">
                <DashboardQuickActions />
                <DashboardRecentActivity loans={data?.upcoming_due ?? []} />
                <DashboardUpgradeCard isPremium={profile?.plan === "premium"} />
                <DashboardTopContacts contacts={data?.top_contacts ?? []} />
              </aside>
            </div>
          )}
        </div>
      </AppShell>
    </AuthGuard>
  );
}
