"use client";

import { Suspense, use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Mail, MessageSquare, Phone, Trash2, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { Pagination, paginateArray } from "@/components/Pagination";
import { ContactChat } from "@/components/messaging/ContactChat";
import {
  EmptyState,
  PageHeader,
  PageSkeleton,
  StatusBadge,
  TrustScoreCard,
} from "@/components/page-layout";
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
  const { data: contact, isLoading: contactLoading } = useContact(id);
  const { data: loans, isLoading: loansLoading } = useContactLoans(id);
  const { data: trust, isLoading: trustLoading } = useContactTrust(id);
  const deleteContact = useDeleteContact();
  const { openNewLoan } = useNewLoanDialog();
  const [showDelete, setShowDelete] = useState(false);
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
      ) : !contact ? (
        <EmptyState message="Contact not found." href="/contacts" linkLabel="Back to contacts" />
      ) : (
        <div className="animate-fade-in space-y-6 pb-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-2xl border-border/60 shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="font-heading text-2xl">{contact.name}</CardTitle>
                  <CardDescription className="mt-2 space-y-1">
                    {contact.email && (
                      <span className="flex items-center gap-2">
                        <Mail className="size-4" />
                        {contact.email}
                      </span>
                    )}
                    {contact.phone && (
                      <span className="flex items-center gap-2">
                        <Phone className="size-4" />
                        {contact.phone}
                      </span>
                    )}
                  </CardDescription>
                  {contact.linked_user_id && (
                    <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-primary">
                      <ShieldCheck className="size-4" />
                      Registered on LendTrack — mutual contact
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setShowDelete(true)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </CardHeader>
              {contact.notes && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">{contact.notes}</p>
                </CardContent>
              )}
            </Card>

            <TrustScoreCard trust={trust} loading={trustLoading} />
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
                <div className="space-y-2">
                  {paginatedLoans!.data.map((loan) => (
                    <Card key={loan.id} className="rounded-xl border-border/60 transition-colors hover:border-primary/30">
                      <Link href={`/loans/${loan.id}`} className="flex items-center justify-between p-4">
                        <div>
                          <p className="font-semibold">{loan.item?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {loan.direction === "lent_out" ? "You lent" : "You borrowed"} · Due{" "}
                            {loan.expected_return_at}
                          </p>
                        </div>
                        <StatusBadge status={loan.status} />
                      </Link>
                    </Card>
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
    </>
  );
}

export default function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <AuthGuard>
      <AppShell>
        <ContactDetailContent id={id} />
      </AppShell>
    </AuthGuard>
  );
}
