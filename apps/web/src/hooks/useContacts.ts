"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Contact, LoanWithRelations } from "@lendtrack/shared-types";
import { getAuthUser, LOAN_SELECT, supabase } from "@/lib/supabase";

export function useContacts() {
  return useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .is("deleted_at", null)
        .order("name");

      if (error) throw new Error(error.message);
      return data as Contact[];
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useContact(id: string) {
  return useQuery({
    queryKey: ["contacts", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", id)
        .is("deleted_at", null)
        .single();

      if (error) throw new Error(error.message);
      return data as Contact;
    },
    enabled: !!id,
  });
}

export function useContactLoans(contactId: string) {
  return useQuery({
    queryKey: ["loans", { contact_id: contactId }],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loans")
        .select(LOAN_SELECT)
        .eq("contact_id", contactId)
        .order("expected_return_at", { ascending: false });

      if (error) throw new Error(error.message);
      return data as LoanWithRelations[];
    },
    enabled: !!contactId,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: { name: string; email?: string; phone?: string; notes?: string }) => {
      const user = await getAuthUser();
      const { data, error } = await supabase
        .from("contacts")
        .insert({
          user_id: user.id,
          name: body.name,
          email: body.email || null,
          phone: body.phone || null,
          notes: body.notes || null,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Contact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const user = await getAuthUser();

      const { data: loans, error: loansError } = await supabase
        .from("loans")
        .select("id")
        .eq("contact_id", id)
        .eq("user_id", user.id)
        .limit(1);

      if (loansError) throw new Error(loansError.message);

      if (loans && loans.length > 0) {
        const { error } = await supabase
          .from("contacts")
          .update({ deleted_at: new Date().toISOString() })
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) throw new Error(error.message);
        return { type: "archived" as const };
      }

      const { error } = await supabase.from("contacts").delete().eq("id", id).eq("user_id", user.id);
      if (error) throw new Error(error.message);
      return { type: "deleted" as const };
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["contacts", id] });
    },
  });
}
