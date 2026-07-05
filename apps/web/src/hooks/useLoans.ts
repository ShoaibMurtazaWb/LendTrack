"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DashboardSummary, LoanWithRelations } from "@lendtrack/shared-types";
import { LOAN_SELECT, supabase } from "@/lib/supabase";

async function markOverdueLoans() {
  const today = new Date().toISOString().split("T")[0];
  await supabase
    .from("loans")
    .update({ status: "overdue" })
    .eq("status", "active")
    .lt("expected_return_at", today);
}

export function useLoans(filters?: {
  status?: string;
  direction?: string;
  contact_id?: string;
}) {
  return useQuery({
    queryKey: ["loans", filters],
    queryFn: async () => {
      await markOverdueLoans();

      let query = supabase.from("loans").select(LOAN_SELECT).order("expected_return_at");

      if (filters?.status) query = query.eq("status", filters.status);
      if (filters?.direction) query = query.eq("direction", filters.direction);
      if (filters?.contact_id) query = query.eq("contact_id", filters.contact_id);

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data as LoanWithRelations[];
    },
  });
}

export function useLoan(id: string) {
  return useQuery({
    queryKey: ["loans", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loans")
        .select(LOAN_SELECT)
        .eq("id", id)
        .single();

      if (error) throw new Error(error.message);
      return data as LoanWithRelations;
    },
    enabled: !!id,
  });
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => {
      await markOverdueLoans();

      const today = new Date().toISOString().split("T")[0];
      const weekLater = new Date();
      weekLater.setDate(weekLater.getDate() + 7);
      const weekStr = weekLater.toISOString().split("T")[0];

      const { count: activeCount } = await supabase
        .from("loans")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      const { count: overdueCount } = await supabase
        .from("loans")
        .select("*", { count: "exact", head: true })
        .eq("status", "overdue");

      const { data: upcoming, error } = await supabase
        .from("loans")
        .select(LOAN_SELECT)
        .in("status", ["active", "overdue"])
        .gte("expected_return_at", today)
        .lte("expected_return_at", weekStr)
        .order("expected_return_at")
        .limit(10);

      if (error) throw new Error(error.message);

      return {
        active_count: activeCount ?? 0,
        overdue_count: overdueCount ?? 0,
        upcoming_due: (upcoming ?? []) as LoanWithRelations[],
      } satisfies DashboardSummary;
    },
  });
}

export function useCreateLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: {
      item_id: string;
      contact_id: string;
      direction: "lent_out" | "borrowed";
      loaned_at: string;
      expected_return_at: string;
      notes?: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("loans")
        .insert({ ...body, user_id: user.id, notes: body.notes || null })
        .select(LOAN_SELECT)
        .single();

      if (error) {
        if (error.message.includes("PLAN_LIMIT")) {
          throw new Error("Free plan allows up to 5 active loans. Upgrade to Premium for unlimited loans.");
        }
        throw new Error(error.message);
      }

      return data as LoanWithRelations;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}

export function useReturnLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("loans")
        .update({ status: "returned", returned_at: today })
        .eq("id", id)
        .select(LOAN_SELECT)
        .single();

      if (error) throw new Error(error.message);
      return data as LoanWithRelations;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}

export function useMarkLoanLost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("loans")
        .update({ status: "lost" })
        .eq("id", id)
        .select(LOAN_SELECT)
        .single();

      if (error) throw new Error(error.message);
      return data as LoanWithRelations;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}
