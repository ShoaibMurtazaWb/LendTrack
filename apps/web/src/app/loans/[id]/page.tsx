"use client";

import { use } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { PageHeader, StatusBadge } from "@/components/ui";
import { useLoan, useReturnLoan, useMarkLoanLost } from "@/hooks/useLoans";

export default function LoanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: loan, isLoading } = useLoan(id);
  const returnLoan = useReturnLoan();
  const markLost = useMarkLoanLost();

  const isActive = loan?.status === "active" || loan?.status === "overdue";

  return (
    <AuthGuard>
      <AppShell>
        <PageHeader
          title={loan?.item?.name ?? "Loan details"}
          action={
            <Link href="/loans" className="text-sm text-emerald-700 hover:underline">
              ← Back to loans
            </Link>
          }
        />

        {isLoading ? (
          <p className="text-slate-500">Loading...</p>
        ) : !loan ? (
          <p className="text-slate-500">Loan not found.</p>
        ) : (
          <div className="max-w-lg rounded-xl border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <StatusBadge status={loan.status} />
              <span className="text-sm capitalize text-slate-500">
                {loan.direction.replace("_", " ")}
              </span>
            </div>

            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-slate-500">Contact</dt>
                <dd className="font-medium">{loan.contact?.name}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Loaned on</dt>
                <dd className="font-medium">{loan.loaned_at}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Expected return</dt>
                <dd className="font-medium">{loan.expected_return_at}</dd>
              </div>
              {loan.returned_at && (
                <div>
                  <dt className="text-slate-500">Returned on</dt>
                  <dd className="font-medium">{loan.returned_at}</dd>
                </div>
              )}
              {loan.notes && (
                <div>
                  <dt className="text-slate-500">Notes</dt>
                  <dd>{loan.notes}</dd>
                </div>
              )}
            </dl>

            {isActive && (
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => returnLoan.mutate(id)}
                  disabled={returnLoan.isPending}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  Mark returned
                </button>
                <button
                  onClick={() => markLost.mutate(id)}
                  disabled={markLost.isPending}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Mark lost
                </button>
              </div>
            )}
          </div>
        )}
      </AppShell>
    </AuthGuard>
  );
}
