"use client";

import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { EmptyState, PageSkeleton } from "@/components/page-layout";
import { QueryErrorState } from "@/components/QueryErrorState";
import { useConversations } from "@/hooks/useMessages";

export default function MessagesPage() {
  const { data: conversations, isLoading, isError, refetch } = useConversations();

  return (
    <AuthGuard>
      <AppShell>
        <div className="animate-fade-in space-y-6 pb-20 md:pb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold text-primary">Messages</h1>
            <p className="mt-1 text-muted-foreground">
              Chat with contacts who are on LendTrack (add their email to link accounts)
            </p>
          </div>

          {isLoading ? (
            <PageSkeleton />
          ) : isError ? (
            <QueryErrorState onRetry={() => refetch()} />
          ) : !conversations?.length ? (
            <EmptyState
              message="No conversations yet. Open a verified contact and start a chat."
              href="/contacts"
              linkLabel="View contacts"
            />
          ) : (
            <div className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
              {conversations.map((c) => (
                <Link
                  key={c.conversation_id}
                  href={c.contact_id ? `/messages/${c.contact_id}` : "/contacts"}
                  className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/40"
                >
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {c.contact_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-semibold">{c.contact_name}</p>
                      {c.last_message_at && (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {new Date(c.last_message_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {c.last_message ?? "No messages yet"}
                    </p>
                  </div>
                  {c.unread_count > 0 && (
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
                      {c.unread_count}
                    </span>
                  )}
                  <MessageSquare className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </AppShell>
    </AuthGuard>
  );
}
