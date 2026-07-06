"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import {
  DashboardActivityChart,
  DashboardMetricTiles,
  DashboardTopContacts,
  DashboardUpgradeCard,
  DashboardWelcome,
} from "@/components/dashboard/DashboardWidgets";
import { EmptyState, LoanCard, PageSkeleton } from "@/components/page-layout";
import { QueryErrorState } from "@/components/QueryErrorState";
import { useDashboardSummary } from "@/hooks/useLoans";
import { useProfile } from "@/hooks/useAuth";

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useDashboardSummary();
  const { data: profile } = useProfile();

  const hasOverdue = (data?.overdue_count ?? 0) > 0;
  const dueThisWeek = data?.upcoming_due?.length ?? 0;
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  return (
    <AuthGuard>
      <AppShell>
        <div className="animate-fade-in pb-20 md:pb-8">
          {hasOverdue && (
            <Link
              href="/loans"
              className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-destructive/20 bg-red-50 px-5 py-3 text-sm text-destructive transition-colors hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50"
            >
              <span className="flex items-center gap-2">
                <AlertTriangle className="size-4 shrink-0" />
                You have <strong>{data?.overdue_count}</strong> overdue loan
                {(data?.overdue_count ?? 0) > 1 ? "s" : ""} — review on Loans page
              </span>
              <span className="font-semibold underline">View loans</span>
            </Link>
          )}

          {isLoading ? (
            <PageSkeleton />
          ) : isError ? (
            <QueryErrorState onRetry={() => refetch()} />
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
              <div className="flex flex-col gap-6 lg:col-span-8">
                <DashboardWelcome name={firstName} dueCount={dueThisWeek} />
                <DashboardActivityChart data={data?.activity_week ?? []} />

                <div className="rounded-3xl border border-border bg-card">
                  <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <h2 className="font-heading text-xl font-semibold">Upcoming returns</h2>
                    <Link href="/loans" className="text-sm font-semibold text-primary hover:underline">
                      View all
                    </Link>
                  </div>
                  {!data?.upcoming_due?.length ? (
                    <div className="p-6">
                      <EmptyState message="No loans due this week." />
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {data.upcoming_due.slice(0, 5).map((loan) => (
                        <LoanCard
                          key={loan.id}
                          href={`/loans/${loan.id}`}
                          itemName={loan.item?.name ?? "Item"}
                          item={loan.item}
                          contactName={loan.contact?.name ?? "Contact"}
                          direction={loan.direction}
                          dueDate={loan.expected_return_at}
                          status={loan.status}
                          isLocked={loan.is_locked}
                          variant="list"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-6 lg:col-span-4">
                <DashboardMetricTiles
                  active={data?.active_count ?? 0}
                  overdue={data?.overdue_count ?? 0}
                  returned={data?.returned_count ?? 0}
                />
                <DashboardUpgradeCard isPremium={profile?.plan === "premium"} />
                <DashboardTopContacts contacts={data?.top_contacts ?? []} />
              </div>
            </div>
          )}
        </div>
      </AppShell>
    </AuthGuard>
  );
}
