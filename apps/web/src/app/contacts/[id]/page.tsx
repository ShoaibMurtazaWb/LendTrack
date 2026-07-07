"use client";

import { Suspense, use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Mail, MessageSquare, Pencil, Phone, Trash2, ShieldCheck } from "lucide-react";
import { EditContactDialog } from "@/components/contacts/EditContactDialog";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { LoanGridCard } from "@/components/LoanGridCard";
import { Pagination, paginateArray } from "@/components/Pagination";
import { ContactChat } from "@/components/messaging/ContactChat";
import {
  EmptyState,
  PageHeader,
  PageSkeleton,
  TrustScoreCard,
} from "@/components/page-layout";
import { QueryErrorState } from "@/components/QueryErrorState";
import { useContact, useContactLoans, useContactTrust, useDeleteContact } from "@/hooks/useContacts";
import { useNewLoanDialog } from "@/components/loans/NewLoanDialogProvider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

const LOAN_PAGE_SIZE = 5;

function ContactDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const { data: contact, isLoading: contactLoading, isError: contactError, refetch } = useContact(id);
  const { data: loans, isLoading: loansLoading } = useContactLoans(id);
  const { data: trust, isLoading: trustLoading } = useContactTrust(id);
  const deleteContact = useDeleteContact();
  const { openNewLoan } = useNewLoanDialog();
  const [showDelete, setShowDelete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [loanPage, setLoanPage] = useState(1);

  const paginatedLoans = loans ? paginateArray(loans, loanPage, LOAN_PAGE_SIZE) : null;

  const handleDelete = async () => {
    try {
      const result = await deleteContact.mutateAsync(id);
      toast.success(
        result.type === "archived"
          ? "Contact removed. Their loan history is still saved."
          : "Contact deleted"
      );
      router.push("/contacts");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove contact");
    }
  };

  const isLoading = contactLoading || loansLoading;

  return (
    <>
      <div className="page-canvas animate-fade-in">
      <PageHeader
        title={contact?.name ?? "Contact"}
        description="Trust profile and loan history — make informed lending decisions"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/messages/${id}`}
              className={cn(buttonVariants({ size: "sm" }), "gap-2 rounded-xl")}
            >
              <MessageSquare className="size-4" />
              Message
            </Link>
            <Link href="/contacts" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2")}>
              <ArrowLeft className="size-4" />
              All contacts
            </Link>
          </div>
        }
      />

      {isLoading ? (
        <PageSkeleton />
      ) : contactError ? (
        <QueryErrorState onRetry={() => refetch()} />
      ) : !contact ? (
        <EmptyState message="Contact not found." href="/contacts" linkLabel="Back to contacts" />
      ) : (
        <div className="animate-fade-in space-y-6 pb-8">
          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="rounded-2xl border-border/60 shadow-sm lg:col-span-2">
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <CardTitle className="font-heading text-xl sm:text-2xl">{contact.name}</CardTitle>
                  <CardDescription className="mt-2 space-y-1">
                    {contact.email && (
                      <span className="flex items-center gap-2 break-all">
                        <Mail className="size-4 shrink-0" />
                        {contact.email}
                      </span>
                    )}
                    {contact.phone && (
                      <span className="flex items-center gap-2">
                        <Phone className="size-4 shrink-0" />
                        {contact.phone}
                      </span>
                    )}
                  </CardDescription>
                  {contact.linked_user_id && (
                    <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-primary">
                      <ShieldCheck className="size-4 shrink-0" />
                      Verified on LendTrack
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
                    <Pencil className="size-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setShowDelete(true)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardHeader>
              {contact.notes && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">{contact.notes}</p>
                </CardContent>
              )}
            </Card>

            <div className="min-w-0 lg:col-span-3">
              <TrustScoreCard trust={trust} loading={trustLoading} />
            </div>
          </div>

          <ContactChat
            contactId={contact.id}
            contactName={contact.name}
            linkedUserId={contact.linked_user_id}
          />

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold">Loans with {contact.name}</h2>
              <Button type="button" size="sm" className="rounded-xl" onClick={() => openNewLoan(id)}>
                New loan
              </Button>
            </div>

            {!loans?.length ? (
              <EmptyState
                message={`No loans recorded with ${contact.name} yet.`}
                onAction={() => openNewLoan(id)}
                actionLabel="Create loan"
              />
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  {paginatedLoans!.data.map((loan) => (
                    <LoanGridCard
                      key={loan.id}
                      href={`/loans/${loan.id}`}
                      item={loan.item}
                      contactName={contact.name}
                      direction={loan.direction}
                      dueDate={loan.expected_return_at}
                      status={loan.status}
                      isLocked={loan.is_locked}
                      editHref={`/loans/${loan.id}?edit=1`}
                    />
                  ))}
                </div>
                <Pagination
                  className="mt-4"
                  page={paginatedLoans!.page}
                  totalPages={paginatedLoans!.totalPages}
                  total={paginatedLoans!.total}
                  pageSize={LOAN_PAGE_SIZE}
                  onPageChange={setLoanPage}
                />
              </>
            )}
          </div>
        </div>
      )}

      {contact && (
        <EditContactDialog contact={contact} open={showEdit} onOpenChange={setShowEdit} />
      )}

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {contact?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {loans?.length
                ? "They have loan history — the contact will be hidden but loans stay on your records."
                : "This contact has no loans and will be deleted permanently."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Remove contact
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </>
  );
}

export default function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <AuthGuard>
      <AppShell hideFab>
        <ContactDetailContent id={id} />
      </AppShell>
    </AuthGuard>
  );
}
