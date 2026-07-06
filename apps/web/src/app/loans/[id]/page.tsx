"use client";

import { Suspense, use, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Lock, Pencil } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { ItemThumbnail } from "@/components/ItemThumbnail";
import {
  DirectionBadge,
  DirectionToggle,
  EmptyState,
  LockedBadge,
  PageHeader,
  PageSkeleton,
  StatusBadge,
} from "@/components/page-layout";
import { QueryErrorState } from "@/components/QueryErrorState";
import { useLoan, useReturnLoan, useMarkLoanLost, useUpdateLoan, useRevertLoanStatus } from "@/hooks/useLoans";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { formatAppDate } from "@/lib/format-date";

function LoanDetailContent({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const { data: loan, isLoading, isError, refetch } = useLoan(id);
  const returnLoan = useReturnLoan();
  const markLost = useMarkLoanLost();
  const revertLoan = useRevertLoanStatus();
  const updateLoan = useUpdateLoan();

  const [editOpen, setEditOpen] = useState(false);
  const [lostConfirmOpen, setLostConfirmOpen] = useState(false);
  const [direction, setDirection] = useState<"lent_out" | "borrowed">("lent_out");
  const [loanedAt, setLoanedAt] = useState("");
  const [expectedReturnAt, setExpectedReturnAt] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (searchParams.get("edit") === "1" && loan && !loan.is_locked) {
      setEditOpen(true);
    }
  }, [searchParams, loan]);

  useEffect(() => {
    if (!loan) return;
    setDirection(loan.direction);
    setLoanedAt(loan.loaned_at);
    setExpectedReturnAt(loan.expected_return_at);
    setNotes(loan.notes ?? "");
  }, [loan]);

  const isActive = loan?.status === "active" || loan?.status === "overdue";
  const isClosed = loan?.status === "returned" || loan?.status === "lost";
  const isLocked = loan?.is_locked ?? false;

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

  const handleRevert = async () => {
    try {
      await revertLoan.mutateAsync(id);
      toast.success("Loan reopened — marked as pending again");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reopen loan");
    }
  };

  const handleSaveEdit = async () => {
    try {
      await updateLoan.mutateAsync({
        id,
        direction,
        loaned_at: loanedAt,
        expected_return_at: expectedReturnAt,
        notes: notes || null,
      });
      toast.success("Loan updated");
      setEditOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update loan");
    }
  };

  return (
    <>
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
      ) : isError ? (
        <QueryErrorState onRetry={() => refetch()} />
      ) : !loan ? (
        <EmptyState message="This loan could not be found." href="/loans" linkLabel="Back to loans" />
      ) : (
        <Card className="max-w-2xl overflow-hidden rounded-2xl border-border/60 shadow-sm">
          <ItemThumbnail
            name={loan.item?.name}
            photoUrl={loan.item?.photo_url}
            category={loan.item?.category}
            size="card"
            className="rounded-none"
          />
          <CardContent className="pt-6">
            {isLocked && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
                <Lock className="mt-0.5 size-4 shrink-0 text-amber-600" />
                <div>
                  <p className="font-semibold">This loan is locked</p>
                  <p className="mt-1 text-muted-foreground">
                    It exceeds your free plan limit.{" "}
                    <Link href="/settings/billing" className="font-semibold text-primary hover:underline">
                      Upgrade to Premium
                    </Link>{" "}
                    to edit or manage it. You can still mark it returned or lost.
                  </p>
                </div>
              </div>
            )}

            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={loan.status} />
                <DirectionBadge direction={loan.direction} />
                {isLocked && <LockedBadge />}
              </div>
              {isActive && !isLocked && (
                <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={() => setEditOpen(true)}>
                  <Pencil className="size-4" />
                  Edit loan
                </Button>
              )}
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-muted/40 p-4">
                <dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Contact</dt>
                <dd className="mt-1 font-semibold">
                  <Link href={`/contacts/${loan.contact_id}`} className="hover:text-primary hover:underline">
                    {loan.contact?.name}
                  </Link>
                </dd>
              </div>
              <div className="rounded-xl bg-muted/40 p-4">
                <dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Loaned on</dt>
                <dd className="mt-1 font-semibold">{formatAppDate(loan.loaned_at)}</dd>
              </div>
              <div className="rounded-xl bg-muted/40 p-4">
                <dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Expected return</dt>
                <dd className="mt-1 font-semibold">{formatAppDate(loan.expected_return_at)}</dd>
              </div>
              {loan.returned_at && (
                <div className="rounded-xl bg-muted/40 p-4">
                  <dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Returned on</dt>
                  <dd className="mt-1 font-semibold">{formatAppDate(loan.returned_at)}</dd>
                </div>
              )}
            </dl>

            {loan.notes && (
              <div className="mt-4 rounded-xl bg-muted/40 p-4">
                <dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Notes</dt>
                <dd className="mt-1 text-sm">{loan.notes}</dd>
              </div>
            )}

            {isActive && (
              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={handleReturn} disabled={returnLoan.isPending} className="rounded-xl">
                  Mark as returned
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setLostConfirmOpen(true)}
                  disabled={markLost.isPending}
                  className="rounded-xl"
                >
                  Mark lost
                </Button>
              </div>
            )}

            {isClosed && !isLocked && (
              <div className="mt-6 rounded-xl border border-border/60 bg-muted/30 p-4">
                <p className="mb-3 text-sm text-muted-foreground">
                  Marked by mistake? Reopen this loan as <strong>pending</strong> to track it again.
                </p>
                <Button
                  variant="outline"
                  onClick={handleRevert}
                  disabled={revertLoan.isPending}
                  className="rounded-xl"
                >
                  Reopen as pending
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <AlertDialog open={lostConfirmOpen} onOpenChange={setLostConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark this loan as lost?</AlertDialogTitle>
            <AlertDialogDescription>
              This means the item was not returned and is considered unrecoverable. You can reopen the loan
              later if that changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                setLostConfirmOpen(false);
                void handleLost();
              }}
            >
              Mark lost
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit loan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Direction</Label>
              <DirectionToggle value={direction} onChange={setDirection} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="loanedAt">Loaned on</Label>
                <Input id="loanedAt" type="date" value={loanedAt} onChange={(e) => setLoanedAt(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedReturn">Expected return</Label>
                <Input
                  id="expectedReturn"
                  type="date"
                  value={expectedReturnAt}
                  onChange={(e) => setExpectedReturnAt(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateLoan.isPending}>
              {updateLoan.isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function LoanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <AuthGuard>
      <AppShell>
        <Suspense fallback={<PageSkeleton />}>
          <LoanDetailContent id={id} />
        </Suspense>
      </AppShell>
    </AuthGuard>
  );
}
