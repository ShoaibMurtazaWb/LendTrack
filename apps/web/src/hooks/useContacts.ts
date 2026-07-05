"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Contact } from "@lendtrack/shared-types";
import { getAuthUser, supabase } from "@/lib/supabase";

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
      const { data: loans } = await supabase.from("loans").select("id").eq("contact_id", id).limit(1);

      if (loans && loans.length > 0) {
        const { error } = await supabase
          .from("contacts")
          .update({ deleted_at: new Date().toISOString() })
          .eq("id", id);
        if (error) throw new Error(error.message);
        return;
      }

      const { error } = await supabase.from("contacts").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}
