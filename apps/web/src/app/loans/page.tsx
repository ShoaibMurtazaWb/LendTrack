"use client";

import Link from "next/link";
import { Plus, Handshake, User } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import {
  EmptyState,
  LoanCard,
  PageHeader,
  PageSkeleton,
  StatusBadge,
} from "@/components/page-layout";
import { useLoans } from "@/hooks/useLoans";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function LoansPage() {
  const { data: loans, isLoading } = useLoans();

  return (
    <AuthGuard>
      <AppShell>
        <PageHeader
          title="My Loans"
          description={
            loans?.length
              ? `Tracking ${loans.length} item${loans.length === 1 ? "" : "s"} in your circle`
              : "All items you've lent out or borrowed"
          }
          action={
            <Link
              href="/loans/new"
              className={cn(
                buttonVariants(),
                "gap-2 rounded-xl bg-primary-container text-on-primary-container shadow-sm hover:bg-primary-container/90 active:scale-95"
              )}
            >
              <Plus className="size-4" />
              New loan
            </Link>
          }
        />

        {isLoading ? (
          <PageSkeleton />
        ) : !loans?.length ? (
          <EmptyState
            message="No loans yet. Create your first loan to start tracking."
            href="/loans/new"
            linkLabel="Create loan"
          />
        ) : (
          <>
            {/* Mobile: card list */}
            <div className="space-y-3 md:hidden">
              {loans.map((loan) => (
                <LoanCard
                  key={loan.id}
                  href={`/loans/${loan.id}`}
                  itemName={loan.item?.name ?? "Item"}
                  contactName={loan.contact?.name ?? "Contact"}
                  direction={loan.direction}
                  dueDate={loan.expected_return_at}
                  status={loan.status}
                />
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-outline-variant bg-surface-container-low">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-secondary">
                      Item
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-secondary">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-secondary">
                      Due
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-secondary">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {loans.map((loan) => (
                    <tr key={loan.id} className="transition-colors hover:bg-surface-bright">
                      <td className="px-6 py-5">
                        <Link
                          href={`/loans/${loan.id}`}
                          className="flex items-center gap-3 font-semibold text-on-surface hover:text-primary"
                        >
                          <span className="flex size-10 items-center justify-center rounded-lg bg-primary-container/10 text-primary">
                            <Handshake className="size-4" />
                          </span>
                          {loan.item?.name}
                        </Link>
                      </td>
                      <td className="px-6 py-5">
                        <span className="flex items-center gap-2 text-on-surface-variant">
                          <User className="size-4" />
                          {loan.contact?.name}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-on-surface-variant">
                        {loan.expected_return_at}
                      </td>
                      <td className="px-6 py-5">
                        <StatusBadge status={loan.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </AppShell>
    </AuthGuard>
  );
}
