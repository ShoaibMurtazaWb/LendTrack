"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Check, CheckCheck, Loader2, Send } from "lucide-react";
import { useContactConversation } from "@/hooks/useMessages";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ContactChatProps = {
  contactId: string;
  contactName: string;
  linkedUserId: string | null;
};

export function ContactChat({ contactId, contactName, linkedUserId }: ContactChatProps) {
  const { user } = useAuth();
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const { conversationId, isLoading, error, messages, sendMessage } = useContactConversation(
    contactId,
    linkedUserId
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (!linkedUserId) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-8 text-center">
        <p className="font-medium text-muted-foreground">Messaging not available yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Add {contactName}&apos;s email on their contact card. Once they join LendTrack with that
          email, you can message each other here in real time.
        </p>
      </div>
    );
  }

  if (isLoading && !conversationId) {
    return (
      <div className="flex h-64 items-center justify-center rounded-3xl border border-border bg-card">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-destructive/30 bg-red-50 p-6 text-sm text-destructive dark:bg-red-950/30">
        Could not load conversation. Try again later.
      </div>
    );
  }

  const handleSend = async () => {
    if (!draft.trim() || sendMessage.isPending) return;
    try {
      await sendMessage.mutateAsync(draft);
      setDraft("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send message");
    }
  };

  return (
    <div className="flex h-[min(70vh,32rem)] flex-col overflow-hidden rounded-3xl border border-border bg-card">
      <div className="border-b border-border px-5 py-3">
        <h3 className="font-heading font-semibold">Chat with {contactName}</h3>
        <p className="text-xs text-muted-foreground">Live messages · completed loans build trust</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No messages yet. Say hello to {contactName.split(" ")[0]}!
          </p>
        ) : (
          messages.map((msg) => {
            const mine = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                    mine
                      ? "rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md bg-muted text-foreground"
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                  <div
                    className={cn(
                      "mt-1 flex items-center gap-1",
                      mine ? "justify-end text-primary-foreground/70" : "text-muted-foreground"
                    )}
                  >
                    <span className="text-[10px]">
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {mine &&
                      (msg.id.startsWith("temp-") ? (
                        <Check className="size-3 shrink-0 text-primary-foreground/70" aria-label="Sent" />
                      ) : msg.read_at ? (
                        <CheckCheck className="size-3 shrink-0 text-sky-300" aria-label="Viewed" />
                      ) : (
                        <CheckCheck className="size-3 shrink-0 text-primary-foreground/70" aria-label="Received" />
                      ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 border-t border-border p-3">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          rows={2}
          className="min-h-[2.75rem] resize-none rounded-xl"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button
          type="button"
          size="icon"
          className="size-11 shrink-0 rounded-xl"
          disabled={!draft.trim() || sendMessage.isPending}
          onClick={handleSend}
          aria-label="Send message"
        >
          {sendMessage.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
