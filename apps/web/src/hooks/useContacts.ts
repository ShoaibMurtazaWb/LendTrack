"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Contact, ContactTrust, LoanWithRelations } from "@lendtrack/shared-types";
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

export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      name?: string;
      email?: string | null;
      phone?: string | null;
      notes?: string | null;
    }) => {
      const user = await getAuthUser();
      const { data, error } = await supabase
        .from("contacts")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Contact;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["contacts", vars.id] });
      queryClient.invalidateQueries({ queryKey: ["contact-trust", vars.id] });
    },
  });
}

export function useContactTrust(contactId: string) {
  return useQuery({
    queryKey: ["contact-trust", contactId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_contact_trust", {
        p_contact_id: contactId,
      });

      if (error) throw new Error(error.message);
      return data as ContactTrust;
    },
    enabled: !!contactId,
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
