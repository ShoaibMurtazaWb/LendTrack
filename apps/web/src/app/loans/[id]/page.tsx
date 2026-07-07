"use client";

import { Suspense, use, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Camera, FileText, Lock, MessageSquare, Pencil, StickyNote, Trash2, User, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { ItemThumbnail } from "@/components/ItemThumbnail";
import { CategoryCombobox } from "@/components/CategoryCombobox";
import {
  DirectionToggle,
  EmptyState,
  LockedBadge,
  PageSkeleton,
  StatusBadge,
} from "@/components/page-layout";
import { QueryErrorState } from "@/components/QueryErrorState";
import {
  useLoan,
  useReturnLoan,
  useMarkLoanLost,
  useUpdateLoan,
  useRevertLoanStatus,
  useDeleteLoan,
} from "@/hooks/useLoans";
import { useUpdateItem } from "@/hooks/useItems";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CardContent } from "@/components/ui/card";
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
import { getCategoryLabel, getItemCategory } from "@/lib/item-categories";
import type { ItemCategoryId } from "@/lib/item-categories";
import { localDateString } from "@/lib/loan-sync";
import { uploadItemPhoto } from "@/lib/upload-item-image";

function daysRemaining(dueDate: string): number | null {
  const key = dueDate?.includes("T") ? dueDate.slice(0, 10) : dueDate;
  if (!key) return null;
  const due = new Date(`${key}T12:00:00`);
  const today = new Date(`${localDateString()}T12:00:00`);
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

function daysLabel(days: number | null, isOverdue: boolean) {
  if (days === null) return null;
  if (isOverdue || days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `${days}d left`;
}

function LoanDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: loan, isLoading, isError, refetch } = useLoan(id);
  const returnLoan = useReturnLoan();
  const markLost = useMarkLoanLost();
  const revertLoan = useRevertLoanStatus();
  const updateLoan = useUpdateLoan();
  const updateItem = useUpdateItem();
  const deleteLoan = useDeleteLoan();

  const [editOpen, setEditOpen] = useState(false);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [lostConfirmOpen, setLostConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [direction, setDirection] = useState<"lent_out" | "borrowed">("lent_out");
  const [itemName, setItemName] = useState("");
  const [itemCategoryId, setItemCategoryId] = useState<ItemCategoryId | null>(null);
  const [itemCategoryQuery, setItemCategoryQuery] = useState("");
  const [itemPhotoFile, setItemPhotoFile] = useState<File | null>(null);
  const [itemPhotoPreview, setItemPhotoPreview] = useState<string | null>(null);
  const [itemPhotoRemoved, setItemPhotoRemoved] = useState(false);
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
    setItemName(loan.item?.name ?? "");
    const categoryId = (loan.item?.category as ItemCategoryId | null) ?? null;
    setItemCategoryId(categoryId);
    setItemCategoryQuery(categoryId ? getCategoryLabel(categoryId) : "");
    setItemPhotoPreview(loan.item?.photo_url ?? null);
    setItemPhotoFile(null);
    setItemPhotoRemoved(false);
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
    if (!loan) return;
    if (expectedReturnAt < loanedAt) {
      toast.error("Expected return must be on or after the loan date.");
      return;
    }
    try {
      if (loan.item_id) {
        let photoUrl: string | null | undefined = undefined;
        if (itemPhotoFile) {
          photoUrl = await uploadItemPhoto(itemPhotoFile);
        } else if (itemPhotoRemoved) {
          photoUrl = null;
        }
        await updateItem.mutateAsync({
          id: loan.item_id,
          name: itemName.trim() || loan.item?.name || "Item",
          category: itemCategoryId,
          ...(photoUrl !== undefined ? { photo_url: photoUrl } : {}),
        });
      }
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

  const handleEditPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setItemPhotoFile(file);
    setItemPhotoPreview(URL.createObjectURL(file));
    setItemPhotoRemoved(false);
  };

  const clearEditPhoto = () => {
    setItemPhotoFile(null);
    setItemPhotoPreview(null);
    setItemPhotoRemoved(true);
  };

  const handleDelete = async () => {
    try {
      await deleteLoan.mutateAsync(id);
      toast.success("Loan deleted");
      router.push("/loans");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete loan");
    }
  };

  return (
    <>
      <div className="page-canvas animate-fade-in">
      <div className="mb-4">
        <Link href="/loans" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2")}>
          <ArrowLeft className="size-4" />
          Back to loans
        </Link>
      </div>

      {isLoading ? (
        <PageSkeleton />
      ) : isError ? (
        <QueryErrorState onRetry={() => refetch()} />
      ) : !loan ? (
        <EmptyState message="This loan could not be found." href="/loans" linkLabel="Back to loans" />
      ) : (
        (() => {
          const isOverdue = loan.status === "overdue";
          const isLent = loan.direction === "lent_out";
          const contactLine = isLent
            ? `Lent to ${loan.contact?.name ?? "contact"}`
            : `Borrowed from ${loan.contact?.name ?? "contact"}`;
          const category = getItemCategory(loan.item?.category);
          const CategoryIcon = category.icon;
          const days = isActive ? daysRemaining(loan.expected_return_at) : null;
          const daysText = daysLabel(days, isOverdue);
          const canMessage = Boolean(loan.contact?.linked_user_id);

          return (
            <article className={cn("pro-card mx-auto max-w-4xl overflow-hidden", isLocked && "opacity-90")}>
              <CardContent className="p-4 sm:p-5">
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        if (loan.item?.photo_url) setImagePreviewOpen(true);
                      }}
                      className={cn(
                        "relative size-32 shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-muted sm:size-36",
                        loan.item?.photo_url ? "cursor-zoom-in" : "cursor-default"
                      )}
                      aria-label={loan.item?.photo_url ? "View item image" : "No item image"}
                    >
                      {loan.item?.photo_url ? (
                        <Image
                          src={loan.item.photo_url}
                          alt={loan.item?.name ?? "Item photo"}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 128px, 144px"
                          unoptimized
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center bg-surface-container-low">
                          <CategoryIcon className="size-6 text-primary/80" />
                        </div>
                      )}
                    </button>
                    <div className="min-w-0">
                      <h2 className="font-heading truncate text-3xl font-semibold">{loan.item?.name ?? "Loan"}</h2>
                      <p className="mt-1 text-base text-muted-foreground">{contactLine}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <StatusBadge status={loan.status} />
                        {isLocked && <LockedBadge />}
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/12 px-2 py-0.5 text-[11px] font-semibold text-primary">
                          <CategoryIcon className="size-3" strokeWidth={2} />
                          {getCategoryLabel(loan.item?.category)}
                        </span>
                        <span className="inline-flex rounded-full bg-brand-green-light px-2 py-0.5 text-[11px] font-semibold text-brand-green">
                          {isLent ? "Lent out" : "Borrowed"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start">
                    {!isLocked && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 rounded-lg px-3 text-xs"
                        onClick={() => setEditOpen(true)}
                      >
                        <Pencil className="size-3.5" />
                        Edit
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 rounded-lg px-3 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setDeleteConfirmOpen(true)}
                    >
                      <Trash2 className="size-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>

                {isLocked && (
                  <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
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

                <div className="grid gap-5 lg:grid-cols-5">
                  <div className="space-y-4 lg:col-span-3">
                    <section className="h-full min-h-44 rounded-2xl border border-border/60 bg-surface-container-lowest p-5">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <StickyNote className="size-4 text-primary" />
                          <h3 className="font-heading font-semibold">Notes & conditions</h3>
                        </div>
                        {!isLocked && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 rounded-lg text-xs"
                            onClick={() => setEditOpen(true)}
                          >
                            <Pencil className="size-3.5" />
                            {loan.notes ? "Edit" : "Add"}
                          </Button>
                        )}
                      </div>
                      {loan.notes ? (
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                          {loan.notes}
                        </p>
                      ) : (
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          No notes added yet. Click edit to add conditions, serial numbers, or reminders.
                        </p>
                      )}
                    </section>

                    {loan.item?.description && (
                      <section className="rounded-2xl border border-border/60 bg-surface-container-lowest p-5">
                        <div className="mb-3 flex items-center gap-2">
                          <FileText className="size-4 text-primary" />
                          <h3 className="font-heading font-semibold">About this item</h3>
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                          {loan.item.description}
                        </p>
                      </section>
                    )}
                  </div>

                  <aside className="space-y-4 lg:col-span-2">
                    <div className="h-full min-h-44 rounded-2xl border border-border/60 bg-muted/30 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        Contact
                      </p>
                      <Link
                        href={`/contacts/${loan.contact_id}`}
                        className="mt-2 flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-background"
                      >
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {loan.contact?.name?.charAt(0).toUpperCase() ?? "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{loan.contact?.name}</p>
                          {loan.contact?.email && (
                            <p className="truncate text-xs text-muted-foreground">{loan.contact.email}</p>
                          )}
                        </div>
                      </Link>
                      <div className="mt-3 flex flex-col gap-2">
                        <Link
                          href={`/contacts/${loan.contact_id}`}
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                            "w-full justify-center gap-2 rounded-xl"
                          )}
                        >
                          <User className="size-4" />
                          View contact
                        </Link>
                        {canMessage && (
                          <Link
                            href={`/messages/${loan.contact_id}`}
                            className={cn(
                              buttonVariants({ size: "sm" }),
                              "w-full justify-center gap-2 rounded-xl"
                            )}
                          >
                            <MessageSquare className="size-4" />
                            Message
                          </Link>
                        )}
                      </div>
                    </div>

                  </aside>
                </div>

                <div className="mt-5 rounded-xl border border-border/60 bg-muted/30 p-4">
                  <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <dt className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        Loaned on
                      </dt>
                      <dd className="mt-1 text-sm font-semibold">{formatAppDate(loan.loaned_at)}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        Expected return
                      </dt>
                      <dd
                        className={cn(
                          "mt-1 text-sm font-semibold",
                          isOverdue && isActive && "text-destructive"
                        )}
                      >
                        {formatAppDate(loan.expected_return_at)}
                      </dd>
                    </div>
                    {loan.returned_at && (
                      <div>
                        <dt className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                          Returned on
                        </dt>
                        <dd className="mt-1 text-sm font-semibold text-brand-green">
                          {formatAppDate(loan.returned_at)}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                {isActive && (
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-6">
                    <Button
                      onClick={handleReturn}
                      disabled={returnLoan.isPending}
                      className="min-w-40 rounded-xl px-5"
                    >
                      Mark as returned
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setLostConfirmOpen(true)}
                      disabled={markLost.isPending}
                      className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
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
            </article>
          );
        })()
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

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
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
              onClick={() => {
                setDeleteConfirmOpen(false);
                void handleDelete();
              }}
            >
              Delete loan
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
              <Label htmlFor="itemName">Item name</Label>
              <Input
                id="itemName"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="itemCategory">Category</Label>
              <CategoryCombobox
                id="itemCategory"
                value={itemCategoryQuery}
                categoryId={itemCategoryId}
                onValueChange={(label, categoryId) => {
                  setItemCategoryQuery(label);
                  setItemCategoryId(categoryId);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Item photo</Label>
              <div className="flex gap-3">
                <div className="relative size-24 overflow-hidden rounded-xl border border-border/60 bg-muted">
                  {itemPhotoPreview ? (
                    <>
                      <Image src={itemPhotoPreview} alt="Item preview" fill className="object-cover" unoptimized />
                      <button
                        type="button"
                        onClick={clearEditPhoto}
                        className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-background/90"
                        aria-label="Remove photo"
                      >
                        <X className="size-3.5" />
                      </button>
                    </>
                  ) : (
                    <div className="flex size-full items-center justify-center text-muted-foreground">
                      <Camera className="size-5" />
                    </div>
                  )}
                </div>
                <label className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border p-3 text-center hover:border-primary/50 hover:bg-muted/30">
                  <Camera className="size-5 text-muted-foreground" />
                  <span className="text-xs font-medium">Upload photo</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    onChange={handleEditPhotoChange}
                  />
                </label>
              </div>
            </div>
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
              <Label htmlFor="notes">Notes & conditions</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Conditions, serial numbers, or anything to remember about this loan…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateLoan.isPending || updateItem.isPending}>
              {updateLoan.isPending || updateItem.isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={imagePreviewOpen} onOpenChange={setImagePreviewOpen}>
        <DialogContent className="max-w-4xl overflow-hidden rounded-2xl p-0">
          {loan?.item?.photo_url ? (
            <div className="relative h-[75vh] w-full bg-black">
              <Image
                src={loan.item.photo_url}
                alt={loan.item?.name ?? "Item photo"}
                fill
                className="object-contain"
                sizes="100vw"
                unoptimized
              />
            </div>
          ) : (
            <div className="p-6 text-sm text-muted-foreground">No image available for this item.</div>
          )}
        </DialogContent>
      </Dialog>
      </div>
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
