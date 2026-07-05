"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { useDashboardSummary } from "@/hooks/useLoans";

export default function DashboardPage() {
  const { data, isLoading } = useDashboardSummary();

  return (
    <AuthGuard>
      <AppShell>
        <PageHeader
          title="Dashboard"
          description="Overview of your active and upcoming loans"
          action={
            <Link
              href="/loans/new"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              New loan
            </Link>
          }
        />

        {isLoading ? (
          <p className="text-slate-500">Loading...</p>
        ) : (
          <>
            <div className="mb-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <p className="text-sm text-slate-500">Active loans</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">{data?.active_count ?? 0}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <p className="text-sm text-slate-500">Overdue</p>
                <p className="mt-1 text-3xl font-bold text-red-600">{data?.overdue_count ?? 0}</p>
              </div>
            </div>

            <h2 className="mb-4 text-lg font-semibold text-slate-900">Due in the next 7 days</h2>
            {!data?.upcoming_due?.length ? (
              <EmptyState message="No loans due this week. You're all caught up!" />
            ) : (
              <div className="space-y-3">
                {data.upcoming_due.map((loan) => (
                  <Link
                    key={loan.id}
                    href={`/loans/${loan.id}`}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 hover:border-emerald-300"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{loan.item?.name}</p>
                      <p className="text-sm text-slate-500">
                        {loan.direction === "lent_out" ? "Lent to" : "Borrowed from"}{" "}
                        {loan.contact?.name} · Due {loan.expected_return_at}
                      </p>
                    </div>
                    <StatusBadge status={loan.status} />
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </AppShell>
    </AuthGuard>
  );
}
