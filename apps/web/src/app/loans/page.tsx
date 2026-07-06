"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { LoanStatBento } from "@/components/dashboard/DashboardWidgets";
import { LoanGridCard } from "@/components/LoanGridCard";
import { useNewLoanDialog } from "@/components/loans/NewLoanDialogProvider";
import { Pagination, paginateArray } from "@/components/Pagination";
import { EmptyState, PageSkeleton } from "@/components/page-layout";
import { QueryErrorState } from "@/components/QueryErrorState";
import { useLoans } from "@/hooks/useLoans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 9;
const FILTERS = ["all", "active", "overdue", "returned", "lost"] as const;
type Filter = (typeof FILTERS)[number];

function LoansPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openNewLoan } = useNewLoanDialog();
  const { data: loans, isLoading, isError, refetch } = useLoans();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

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

  const stats = useMemo(() => {
    if (!loans) return { active: 0, overdue: 0, returned: 0, locked: 0 };
    return {
      active: loans.filter((l) => l.status === "active").length,
      overdue: loans.filter((l) => l.status === "overdue").length,
      returned: loans.filter((l) => l.status === "returned").length,
      locked: loans.filter((l) => l.is_locked).length,
    };
  }, [loans]);

  return (
    <div className="animate-fade-in space-y-8 pb-20 md:pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-primary">My Loans</h1>
          <p className="mt-1 text-muted-foreground">
            {loans?.length
              ? `Tracking ${loans.length} item${loans.length === 1 ? "" : "s"}`
              : "All items you've lent out or borrowed"}
          </p>
        </div>
        <Button type="button" onClick={() => openNewLoan()} className="gap-2 rounded-xl px-6">
          <Plus className="size-4" />
          New loan
        </Button>
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
          <LoanStatBento {...stats} />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => {
                    setFilter(f);
                    setPage(1);
                  }}
                  className={cn(
                    "shrink-0 cursor-pointer rounded-full px-5 py-2 text-sm font-medium capitalize transition-colors",
                    filter === f
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search loans..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="cursor-text rounded-xl pl-9"
              />
            </div>
          </div>

          {!filtered.length ? (
            <EmptyState
              message={
                search.trim()
                  ? `No loans match "${search.trim()}".`
                  : `No ${filter} loans.`
              }
            />
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
                  />
                ))}
              </div>

              <Pagination
                page={paginated!.page}
                totalPages={paginated!.totalPages}
                total={paginated!.total}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            </>
          )}
        </>
      )}
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
