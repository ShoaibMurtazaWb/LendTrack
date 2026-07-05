"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import {
  EmptyState,
  LoanCard,
  PageHeader,
  PageSkeleton,
  StatCard,
} from "@/components/page-layout";
import { useDashboardSummary } from "@/hooks/useLoans";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { data, isLoading } = useDashboardSummary();

  return (
    <AuthGuard>
      <AppShell>
        <PageHeader
          title="Dashboard"
          subtitle="The Neighborly Ledger"
          description="Overview of your active and upcoming loans"
          action={
            <Link
              href="/loans/new"
              className={cn(
                buttonVariants(),
                "gap-2 rounded-xl shadow-sm active:scale-95"
              )}
            >
              <Plus className="size-4" />
              New loan
            </Link>
          }
        />

        {isLoading ? (
          <PageSkeleton />
        ) : (
          <>
            <div className="mb-8 grid grid-cols-2 gap-4">
              <StatCard label="Active loans" value={data?.active_count ?? 0} />
              <StatCard
                label="Overdue"
                value={data?.overdue_count ?? 0}
                variant="error"
              />
            </div>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Due in the next 7 days
                </h2>
              </div>

              {!data?.upcoming_due?.length ? (
                <EmptyState message="No loans due this week. You're all caught up!" />
              ) : (
                data.upcoming_due.map((loan) => (
                  <LoanCard
                    key={loan.id}
                    href={`/loans/${loan.id}`}
                    itemName={loan.item?.name ?? "Item"}
                    contactName={loan.contact?.name ?? "Contact"}
                    direction={loan.direction}
                    dueDate={loan.expected_return_at}
                    status={loan.status}
                  />
                ))
              )}
            </section>
          </>
        )}
      </AppShell>
    </AuthGuard>
  );
}
