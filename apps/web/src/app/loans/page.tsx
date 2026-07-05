"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { useLoans } from "@/hooks/useLoans";

export default function LoansPage() {
  const { data: loans, isLoading } = useLoans();

  return (
    <AuthGuard>
      <AppShell>
        <PageHeader
          title="Loans"
          description="All items you've lent out or borrowed"
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
        ) : !loans?.length ? (
          <EmptyState
            message="No loans yet. Create your first loan to start tracking."
            href="/loans/new"
            linkLabel="Create loan"
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-600">Item</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Contact</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Direction</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Due</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan) => (
                  <tr key={loan.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/loans/${loan.id}`} className="font-medium text-emerald-700 hover:underline">
                        {loan.item?.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{loan.contact?.name}</td>
                    <td className="px-4 py-3 capitalize text-slate-600">
                      {loan.direction.replace("_", " ")}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{loan.expected_return_at}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={loan.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AppShell>
    </AuthGuard>
  );
}
