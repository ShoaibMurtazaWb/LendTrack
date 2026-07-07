"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { LoanStatBento } from "@/components/dashboard/DashboardWidgets";
import { LoanGridCard } from "@/components/LoanGridCard";
import { useNewLoanDialog } from "@/components/loans/NewLoanDialogProvider";
import { Pagination, paginateArray } from "@/components/Pagination";
import { EmptyState, PageSkeleton } from "@/components/page-layout";
import { QueryErrorState } from "@/components/QueryErrorState";
import { useLoans } from "@/hooks/useLoans";
import { useDeleteLoan } from "@/hooks/useLoans";
import { countLoanStats } from "@/lib/loan-stats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const PAGE_SIZE = 9;
const FILTERS = ["all", "active", "overdue", "returned", "lost"] as const;
type Filter = (typeof FILTERS)[number];

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function buildLinePath(values: number[]) {
  if (!values.length) return "";
  const width = 120;
  const height = 36;
  const max = Math.max(...values, 1);
  return values
    .map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * width;
      const y = height - (v / max) * (height - 4) - 2;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

function MiniTrendCard({
  title,
  value,
  series,
  strokeClass,
}: {
  title: string;
  value: number;
  series: number[];
  strokeClass: string;
}) {
  const path = buildLinePath(series);
  return (
    <div className="pro-card flex items-center justify-between gap-4 p-4">
      <div>
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="font-heading text-2xl font-bold">{value}</p>
      </div>
      <svg viewBox="0 0 120 36" className="h-9 w-28" aria-hidden>
        <path d={path} fill="none" className={cn("stroke-2", strokeClass)} strokeLinecap="round" />
      </svg>
    </div>
  );
}

function LoansPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openNewLoan } = useNewLoanDialog();
  const { data: loans, isLoading, isError, refetch } = useLoans();
  const deleteLoan = useDeleteLoan();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [deleteLoanId, setDeleteLoanId] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    const contactId = searchParams.get("contact") ?? undefined;
    openNewLoan(contactId);
    router.replace("/loans", { scroll: false });
  }, [searchParams, openNewLoan, router]);

  const filtered = useMemo(() => {
    if (!loans) return [];
    let list = loans;
    if (filter !== "all") {
      list = list.filter((l) => l.status === filter);
    }
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((l) => {
      const itemName = l.item?.name?.toLowerCase() ?? "";
      const contactName = l.contact?.name?.toLowerCase() ?? "";
      const notes = l.notes?.toLowerCase() ?? "";
      return itemName.includes(q) || contactName.includes(q) || notes.includes(q);
    });
  }, [loans, filter, search]);

  const paginated = filtered.length ? paginateArray(filtered, page, PAGE_SIZE) : null;

  const stats = useMemo(() => countLoanStats(loans ?? []), [loans]);
  const trends = useMemo(() => {
    const labels: string[] = [];
    const activeSeries: number[] = [];
    const completedSeries: number[] = [];
    const overdueSeries: number[] = [];

    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    start.setMonth(start.getMonth() - 5);

    for (let i = 0; i < 6; i++) {
      const d = new Date(start);
      d.setMonth(start.getMonth() + i);
      const key = monthKey(d);
      labels.push(key);
      activeSeries.push(0);
      completedSeries.push(0);
      overdueSeries.push(0);
    }

    const indexByKey = new Map(labels.map((k, i) => [k, i]));
    for (const loan of loans ?? []) {
      const createdKey = monthKey(new Date(loan.created_at));
      const i = indexByKey.get(createdKey);
      if (i == null) continue;
      if (loan.status === "active") activeSeries[i] += 1;
      if (loan.status === "overdue") overdueSeries[i] += 1;
      if (loan.status === "returned") completedSeries[i] += 1;
    }

    return { activeSeries, completedSeries, overdueSeries };
  }, [loans]);

  return (
    <div className="page-canvas animate-fade-in">
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-semibold">Loans overview</h1>
        <p className="mt-1 text-muted-foreground">
          Manage and track items you&apos;ve lent out or borrowed
        </p>
      </div>

      {isLoading ? (
        <PageSkeleton />
      ) : isError ? (
        <QueryErrorState onRetry={() => refetch()} />
      ) : !loans?.length ? (
        <EmptyState
          message="No loans yet. Create your first loan to start tracking."
          onAction={() => openNewLoan()}
          actionLabel="Create loan"
        />
      ) : (
        <>
          <LoanStatBento {...stats} totalItems={loans.length} />
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <MiniTrendCard
              title="Active trend (6 months)"
              value={stats.active}
              series={trends.activeSeries}
              strokeClass="stroke-primary"
            />
            <MiniTrendCard
              title="Completed trend (6 months)"
              value={stats.returned}
              series={trends.completedSeries}
              strokeClass="stroke-brand-green"
            />
            <MiniTrendCard
              title="Overdue trend (6 months)"
              value={stats.overdue}
              series={trends.overdueSeries}
              strokeClass="stroke-destructive"
            />
          </div>

          <div className="pro-card mt-6 overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-border p-4 md:flex-row md:items-center md:justify-between md:px-5 md:py-4">
              <div className="flex gap-1 overflow-x-auto rounded-lg bg-muted p-1">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => {
                      setFilter(f);
                      setPage(1);
                    }}
                    className={cn(
                      "shrink-0 cursor-pointer rounded-md px-4 py-2 text-sm font-medium capitalize transition-all",
                      filter === f
                        ? "bg-card text-primary shadow-sm"
                        : "text-muted-foreground hover:bg-card/60"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1 md:w-64">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-outline" />
                  <Input
                    type="search"
                    placeholder="Search inventory..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="cursor-text rounded-full border-0 bg-muted pl-9 focus-visible:ring-primary"
                  />
                </div>
                <Button type="button" onClick={() => openNewLoan()} className="gap-2 rounded-lg shrink-0">
                  <Plus className="size-4" />
                  New loan
                </Button>
              </div>
            </div>

            {!filtered.length ? (
              <div className="p-8">
                <EmptyState
                  message={
                    search.trim()
                      ? `No loans match "${search.trim()}".`
                      : `No ${filter} loans.`
                  }
                />
              </div>
            ) : (
              <>
                <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3 md:px-5 md:pb-5">
                  {paginated!.data.map((loan) => (
                    <LoanGridCard
                      key={loan.id}
                      href={`/loans/${loan.id}`}
                      item={loan.item}
                      contactName={loan.contact?.name ?? "Contact"}
                      direction={loan.direction}
                      dueDate={loan.expected_return_at}
                      status={loan.status}
                      isLocked={loan.is_locked}
                      editHref={`/loans/${loan.id}?edit=1`}
                      onDelete={() => setDeleteLoanId(loan.id)}
                    />
                  ))}
                </div>

                <div className="border-t border-border bg-muted/30 px-4 py-3 md:px-5">
                  <Pagination
                    page={paginated!.page}
                    totalPages={paginated!.totalPages}
                    total={paginated!.total}
                    pageSize={PAGE_SIZE}
                    onPageChange={setPage}
                  />
                </div>
              </>
            )}
          </div>
        </>
      )}

      <AlertDialog open={!!deleteLoanId} onOpenChange={(open) => !open && setDeleteLoanId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this loan?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes this loan record from your history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!deleteLoanId) return;
                try {
                  await deleteLoan.mutateAsync(deleteLoanId);
                  toast.success("Loan deleted");
                  setDeleteLoanId(null);
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Failed to delete loan");
                }
              }}
            >
              Delete loan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function LoansPage() {
  return (
    <AuthGuard>
      <AppShell>
        <Suspense fallback={<PageSkeleton />}>
          <LoansPageContent />
        </Suspense>
      </AppShell>
    </AuthGuard>
  );
}
