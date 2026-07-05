"use client";

import { use } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { PageHeader, PageSkeleton, StatusBadge } from "@/components/page-layout";
import { useLoan, useReturnLoan, useMarkLoanLost } from "@/hooks/useLoans";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export default function LoanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: loan, isLoading } = useLoan(id);
  const returnLoan = useReturnLoan();
  const markLost = useMarkLoanLost();

  const isActive = loan?.status === "active" || loan?.status === "overdue";

  const handleReturn = async () => {
    try {
      await returnLoan.mutateAsync(id);
      toast.success("Marked as returned");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update loan");
    }
  };

  const handleLost = async () => {
    try {
      await markLost.mutateAsync(id);
      toast.success("Marked as lost");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update loan");
    }
  };

  return (
    <AuthGuard>
      <AppShell>
        <PageHeader
          title={loan?.item?.name ?? "Loan details"}
          action={
            <Link href="/loans" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2")}>
              <ArrowLeft className="size-4" />
              Back to loans
            </Link>
          }
        />

        {isLoading ? (
          <PageSkeleton />
        ) : !loan ? (
          <p className="text-muted-foreground">Loan not found.</p>
        ) : (
          <Card className="max-w-lg">
            <CardContent className="pt-6">
              <div className="mb-4 flex items-center justify-between">
                <StatusBadge status={loan.status} />
                <span className="text-sm capitalize text-muted-foreground">
                  {loan.direction.replace("_", " ")}
                </span>
              </div>

              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Contact</dt>
                  <dd className="font-medium">{loan.contact?.name}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Loaned on</dt>
                  <dd className="font-medium">{loan.loaned_at}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Expected return</dt>
                  <dd className="font-medium">{loan.expected_return_at}</dd>
                </div>
                {loan.returned_at && (
                  <div>
                    <dt className="text-muted-foreground">Returned on</dt>
                    <dd className="font-medium">{loan.returned_at}</dd>
                  </div>
                )}
                {loan.notes && (
                  <div>
                    <dt className="text-muted-foreground">Notes</dt>
                    <dd>{loan.notes}</dd>
                  </div>
                )}
              </dl>

              {isActive && (
                <div className="mt-6 flex gap-3">
                  <Button onClick={handleReturn} disabled={returnLoan.isPending}>
                    Mark returned
                  </Button>
                  <Button variant="outline" onClick={handleLost} disabled={markLost.isPending}>
                    Mark lost
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </AppShell>
    </AuthGuard>
  );
}
