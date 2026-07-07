"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { ContactChat } from "@/components/messaging/ContactChat";
import { EmptyState, PageSkeleton } from "@/components/page-layout";
import { QueryErrorState } from "@/components/QueryErrorState";
import { useContact } from "@/hooks/useContacts";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function MessageThread({ contactId }: { contactId: string }) {
  const { data: contact, isLoading, isError, refetch } = useContact(contactId);

  if (isLoading) return <PageSkeleton />;
  if (isError) return <QueryErrorState onRetry={() => refetch()} />;
  if (!contact) {
    return <EmptyState message="Contact not found." href="/messages" linkLabel="Back to messages" />;
  }

  return (
    <div className="space-y-4">
      <Link href="/messages" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2")}>
        <ArrowLeft className="size-4" />
        All messages
      </Link>
      <ContactChat
        contactId={contact.id}
        contactName={contact.name}
        linkedUserId={contact.linked_user_id}
      />
    </div>
  );
}

export default function MessageContactPage({ params }: { params: Promise<{ contactId: string }> }) {
  const { contactId } = use(params);

  return (
    <AuthGuard>
      <AppShell hideFab>
        <div className="page-canvas animate-fade-in">
        <MessageThread contactId={contactId} />
        </div>
      </AppShell>
    </AuthGuard>
  );
}
