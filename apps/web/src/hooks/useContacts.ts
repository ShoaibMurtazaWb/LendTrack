"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Contact, ContactTrust, LoanWithRelations } from "@lendtrack/shared-types";
import { contactHasTrustScore, contactTrustScore } from "@/lib/contact-trust";
import { assertNotSelfContact } from "@/lib/contact-validation";
import { isOpenLoan, isUnlockedActiveLoan } from "@/lib/loan-stats";
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
      assertNotSelfContact(user.email, body.email);

      const name = body.name.trim();
      if (!name) throw new Error("Contact name is required.");

      const { data, error } = await supabase
        .from("contacts")
        .insert({
          user_id: user.id,
          name,
          email: body.email?.trim() || null,
          phone: body.phone?.trim() || null,
          notes: body.notes?.trim() || null,
        })
        .select()
        .single();

      if (error) throw new Error(
        error.message.includes("CONTACT_SELF")
          ? "You can't add yourself as a contact."
          : error.message
      );
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
      if (updates.email !== undefined) {
        assertNotSelfContact(user.email, updates.email);
      }

      const { data, error } = await supabase
        .from("contacts")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw new Error(
        error.message.includes("CONTACT_SELF")
          ? "You can't add yourself as a contact."
          : error.message
      );
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

export type ContactDirectoryStats = {
  /** Status `active` only (matches dashboard). */
  activeLoans: number;
  /** Active + overdue, not locked — outstanding with this contact. */
  openLoans: number;
  completedLoans: number;
  trustScore: number | null;
  hasScore: boolean;
};

export function useContactsDirectoryStats(contactIds: string[]) {
  const sortedKey = [...contactIds].sort().join(",");

  return useQuery({
    queryKey: ["contacts-directory-stats", sortedKey],
    enabled: contactIds.length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      const { data: loans, error: loansError } = await supabase
        .from("loans")
        .select("contact_id, status, is_locked");

      if (loansError) throw new Error(loansError.message);

      const stats = new Map<string, ContactDirectoryStats>();
      for (const id of contactIds) {
        stats.set(id, {
          activeLoans: 0,
          openLoans: 0,
          completedLoans: 0,
          trustScore: null,
          hasScore: false,
        });
      }

      for (const loan of loans ?? []) {
        if (!loan.contact_id) continue;
        const entry = stats.get(loan.contact_id);
        if (!entry) continue;
        if (isUnlockedActiveLoan(loan)) entry.activeLoans++;
        if (isOpenLoan(loan)) entry.openLoans++;
        if (loan.status === "returned" || loan.status === "lost") entry.completedLoans++;
      }

      await Promise.all(
        contactIds.map(async (id) => {
          const { data } = await supabase.rpc("get_contact_trust", { p_contact_id: id });
          const trust = data as ContactTrust | null;
          const entry = stats.get(id);
          if (!entry) return;
          entry.hasScore = contactHasTrustScore(trust);
          entry.trustScore = contactTrustScore(trust);
        })
      );

      return stats;
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
