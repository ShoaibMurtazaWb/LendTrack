"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Mail, Phone, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { EmptyState, PageHeader, PageSkeleton, StatusBadge } from "@/components/page-layout";
import { useContact, useContactLoans, useDeleteContact } from "@/hooks/useContacts";
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

export default function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: contact, isLoading: contactLoading } = useContact(id);
  const { data: loans, isLoading: loansLoading } = useContactLoans(id);
  const deleteContact = useDeleteContact();
  const [showDelete, setShowDelete] = useState(false);

  const handleDelete = async () => {
    try {
      const result = await deleteContact.mutateAsync(id);
      if (result.type === "archived") {
        toast.success("Contact removed. Their loan history is still saved.");
      } else {
        toast.success("Contact deleted");
      }
      router.push("/contacts");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove contact");
    }
  };

  const isLoading = contactLoading || loansLoading;

  return (
    <AuthGuard>
      <AppShell>
        <PageHeader
          title={contact?.name ?? "Contact"}
          description="All loans you've tracked with this person"
          action={
            <Link
              href="/contacts"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2 rounded-full")}
            >
              <ArrowLeft className="size-4" />
              All contacts
            </Link>
          }
        />

        {isLoading ? (
          <PageSkeleton />
        ) : !contact ? (
          <EmptyState message="Contact not found." href="/contacts" linkLabel="Back to contacts" />
        ) : (
          <div className="space-y-6">
            <Card className="border-border/60 bg-card/80 shadow-sm">
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
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setShowDelete(true)}
                >
                  <Trash2 className="size-4" />
                  Remove
                </Button>
              </CardHeader>
              {contact.notes && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">{contact.notes}</p>
                </CardContent>
              )}
            </Card>

            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-heading text-lg font-semibold">Loans with {contact.name}</h2>
                <Link
                  href={`/loans/new?contact=${id}`}
                  className={cn(buttonVariants({ size: "sm" }), "rounded-full")}
                >
                  New loan
                </Link>
              </div>

              {!loans?.length ? (
                <EmptyState
                  message={`No loans recorded with ${contact.name} yet.`}
                  href={`/loans/new?contact=${id}`}
                  linkLabel="Create loan"
                />
              ) : (
                <div className="space-y-2">
                  {loans.map((loan) => (
                    <Card key={loan.id} className="border-border/60 bg-card/80 transition-colors hover:border-primary/30">
                      <Link href={`/loans/${loan.id}`} className="flex items-center justify-between p-4">
                        <div>
                          <p className="font-medium">{loan.item?.name}</p>
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
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                Remove contact
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AppShell>
    </AuthGuard>
  );
}
