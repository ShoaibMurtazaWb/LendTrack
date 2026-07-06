"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ConversationPreview, Message } from "@lendtrack/shared-types";
import { getAuthUser, supabase } from "@/lib/supabase";

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const user = await getAuthUser();

      const { data: conversations, error } = await supabase
        .from("conversations")
        .select("*")
        .or(`user_one_id.eq.${user.id},user_two_id.eq.${user.id}`)
        .order("updated_at", { ascending: false });

      if (error) throw new Error(error.message);
      if (!conversations?.length) return [] as ConversationPreview[];

      const { data: contacts } = await supabase
        .from("contacts")
        .select("id, name, linked_user_id")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .not("linked_user_id", "is", null);

      const contactByUser = new Map(
        (contacts ?? []).map((c) => [c.linked_user_id as string, { id: c.id, name: c.name }])
      );

      const previews: ConversationPreview[] = [];

      for (const conv of conversations) {
        const otherUserId =
          conv.user_one_id === user.id ? conv.user_two_id : conv.user_one_id;
        const contact = contactByUser.get(otherUserId);

        const { data: lastRows } = await supabase
          .from("messages")
          .select("body, created_at, sender_id, read_at")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1);

        const last = lastRows?.[0];

        const { count } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .neq("sender_id", user.id)
          .is("read_at", null);

        previews.push({
          conversation_id: conv.id,
          other_user_id: otherUserId,
          contact_id: contact?.id ?? null,
          contact_name: contact?.name ?? "Neighbor",
          last_message: last?.body ?? null,
          last_message_at: last?.created_at ?? conv.updated_at,
          unread_count: count ?? 0,
        });
      }

      return previews;
    },
    staleTime: 15_000,
  });
}

export function useContactConversation(contactId: string, linkedUserId?: string | null) {
  const queryClient = useQueryClient();

  const conversationQuery = useQuery({
    queryKey: ["conversation", "contact", contactId],
    enabled: !!linkedUserId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_or_create_conversation", {
        p_other_user_id: linkedUserId,
      });
      if (error) throw new Error(error.message);
      return data as string;
    },
  });

  const conversationId = conversationQuery.data;

  const messagesQuery = useQuery({
    queryKey: ["messages", conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId!)
        .order("created_at", { ascending: true });

      if (error) throw new Error(error.message);
      return (data ?? []) as Message[];
    },
  });

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as Message;
          queryClient.setQueryData<Message[]>(["messages", conversationId], (old) => {
            if (!old) return [row];
            if (old.some((m) => m.id === row.id)) return old;
            return [...old, row];
          });
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  useEffect(() => {
    if (!conversationId || !messagesQuery.data?.length) return;

    const markRead = async () => {
      const user = await getAuthUser();
      const unreadIds = messagesQuery.data!
        .filter((m) => m.sender_id !== user.id && !m.read_at)
        .map((m) => m.id);

      if (!unreadIds.length) return;

      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .in("id", unreadIds);

      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    };

    markRead();
  }, [conversationId, messagesQuery.data, queryClient]);

  const sendMessage = useMutation({
    mutationFn: async (body: string) => {
      const user = await getAuthUser();
      const trimmed = body.trim();
      if (!trimmed) throw new Error("Message cannot be empty");
      if (!conversationId) throw new Error("Conversation not ready");

      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          body: trimmed,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Message;
    },
    onSuccess: (msg) => {
      queryClient.setQueryData<Message[]>(["messages", conversationId], (old) => {
        if (!old) return [msg];
        if (old.some((m) => m.id === msg.id)) return old;
        return [...old, msg];
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  return {
    conversationId,
    isLoading: conversationQuery.isLoading || messagesQuery.isLoading,
    error: conversationQuery.error ?? messagesQuery.error,
    messages: messagesQuery.data ?? [],
    sendMessage,
  };
}
