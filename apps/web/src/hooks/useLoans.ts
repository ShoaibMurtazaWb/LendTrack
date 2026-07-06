"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DashboardSummary, LoanWithRelations } from "@lendtrack/shared-types";
import { localDateString, syncOverdueLoans, invalidateLoanCaches } from "@/lib/loan-sync";
import { getAuthUser, LOAN_SELECT, supabase } from "@/lib/supabase";

const EMPTY_DASHBOARD: DashboardSummary = {
  active_count: 0,
  overdue_count: 0,
  locked_count: 0,
  returned_count: 0,
  lent_out_count: 0,
  borrowed_count: 0,
  upcoming_due: [],
  top_contacts: [],
  activity_week: [],
};

function patchDashboardForNewLoan(
  old: DashboardSummary | undefined,
  loan: LoanWithRelations
): DashboardSummary {
  const today = localDateString();
  const weekLater = new Date();
  weekLater.setDate(weekLater.getDate() + 7);
  const weekStr = localDateString(weekLater);

  const base = old ?? EMPTY_DASHBOARD;

  const isUpcoming =
    (loan.status === "active" || loan.status === "overdue") &&
    !loan.is_locked &&
    loan.expected_return_at >= today &&
    loan.expected_return_at <= weekStr;

  return {
    ...base,
    active_count: base.active_count + (loan.status === "active" && !loan.is_locked ? 1 : 0),
    overdue_count: base.overdue_count + (loan.status === "overdue" && !loan.is_locked ? 1 : 0),
    locked_count: base.locked_count + (loan.is_locked ? 1 : 0),
    lent_out_count: base.lent_out_count + (loan.direction === "lent_out" ? 1 : 0),
    borrowed_count: base.borrowed_count + (loan.direction === "borrowed" ? 1 : 0),
    upcoming_due: isUpcoming
      ? [...base.upcoming_due, loan].sort((a, b) =>
          a.expected_return_at.localeCompare(b.expected_return_at)
        )
      : base.upcoming_due,
  };
}

export function useLoans(filters?: {
  status?: string;
  direction?: string;
  contact_id?: string;
}) {
  return useQuery({
    queryKey: ["loans", filters],
    queryFn: async () => {
      let query = supabase.from("loans").select(LOAN_SELECT).order("expected_return_at", { ascending: false });

      if (filters?.status) query = query.eq("status", filters.status);
      if (filters?.direction) query = query.eq("direction", filters.direction);
      if (filters?.contact_id) query = query.eq("contact_id", filters.contact_id);

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data as LoanWithRelations[];
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
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
    staleTime: 0,
    queryFn: async () => {
      await syncOverdueLoans();

      const today = localDateString();
      const weekLater = new Date();
      weekLater.setDate(weekLater.getDate() + 7);
      const weekStr = localDateString(weekLater);

      const [
        { count: activeCount },
        { count: overdueCount },
        { count: lockedCount },
        { count: returnedCount },
        { count: lentOutCount },
        { count: borrowedCount },
        { data: upcoming, error },
      ] = await Promise.all([
        supabase.from("loans").select("*", { count: "exact", head: true }).eq("status", "active").eq("is_locked", false),
        supabase.from("loans").select("*", { count: "exact", head: true }).eq("status", "overdue").eq("is_locked", false),
        supabase.from("loans").select("*", { count: "exact", head: true }).eq("is_locked", true),
        supabase.from("loans").select("*", { count: "exact", head: true }).eq("status", "returned"),
        supabase.from("loans").select("*", { count: "exact", head: true }).in("status", ["active", "overdue"]).eq("direction", "lent_out"),
        supabase.from("loans").select("*", { count: "exact", head: true }).in("status", ["active", "overdue"]).eq("direction", "borrowed"),
        supabase
          .from("loans")
          .select(LOAN_SELECT)
          .in("status", ["active", "overdue"])
          .eq("is_locked", false)
          .gte("expected_return_at", today)
          .lte("expected_return_at", weekStr)
          .order("expected_return_at")
          .limit(10),
      ]);

      if (error) throw new Error(error.message);

      const upcomingList = (upcoming ?? []) as LoanWithRelations[];

      const activityWeek: { label: string; value: number }[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const key = localDateString(d);
        const label = d.toLocaleDateString("en-US", { weekday: "short" });
        activityWeek.push({
          label,
          value: upcomingList.filter((l) => l.expected_return_at === key).length,
        });
      }

      const contactCounts = new Map<string, { id: string; name: string; loans: number }>();
      for (const loan of upcomingList) {
        if (!loan.contact_id || !loan.contact?.name) continue;
        const existing = contactCounts.get(loan.contact_id);
        if (existing) existing.loans++;
        else contactCounts.set(loan.contact_id, { id: loan.contact_id, name: loan.contact.name, loans: 1 });
      }

      const topContactsRaw = [...contactCounts.values()]
        .sort((a, b) => b.loans - a.loans)
        .slice(0, 4);

      const top_contacts = await Promise.all(
        topContactsRaw.map(async (c) => {
          const { data: trust } = await supabase.rpc("get_contact_trust", { p_contact_id: c.id });
          const trustScore = (trust as { trust_score?: number | null; has_score?: boolean } | null)
            ?.trust_score;
          const hasScore = (trust as { has_score?: boolean } | null)?.has_score !== false;
          return {
            id: c.id,
            name: c.name,
            loans: c.loans,
            score: hasScore && trustScore != null ? trustScore : 0,
          };
        })
      );

      return {
        active_count: activeCount ?? 0,
        overdue_count: overdueCount ?? 0,
        locked_count: lockedCount ?? 0,
        returned_count: returnedCount ?? 0,
        lent_out_count: lentOutCount ?? 0,
        borrowed_count: borrowedCount ?? 0,
        upcoming_due: upcomingList,
        top_contacts,
        activity_week: activityWeek,
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
      const user = await getAuthUser();
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

      await syncOverdueLoans();

      const { data: refreshed, error: refreshError } = await supabase
        .from("loans")
        .select(LOAN_SELECT)
        .eq("id", data.id)
        .single();

      if (refreshError) throw new Error(refreshError.message);
      return refreshed as LoanWithRelations;
    },
    onSuccess: async (loan) => {
      queryClient.setQueryData<DashboardSummary>(["dashboard-summary"], (old) =>
        patchDashboardForNewLoan(old, loan)
      );
      await invalidateLoanCaches(queryClient);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        void fetch("/api/loans/notify-created", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ loanId: loan.id }),
        }).catch(() => {});
      }
    },
  });
}

export function useUpdateLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      direction?: "lent_out" | "borrowed";
      loaned_at?: string;
      expected_return_at?: string;
      notes?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("loans")
        .update(updates)
        .eq("id", id)
        .select(LOAN_SELECT)
        .single();

      if (error) {
        if (error.message.includes("LOAN_LOCKED")) {
          throw new Error("This loan is locked. Upgrade to Premium to edit it.");
        }
        throw new Error(error.message);
      }

      return data as LoanWithRelations;
    },
    onSuccess: async () => {
      await invalidateLoanCaches(queryClient);
    },
  });
}

export function useReturnLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const today = localDateString();
      const { data, error } = await supabase
        .from("loans")
        .update({ status: "returned", returned_at: today })
        .eq("id", id)
        .select(LOAN_SELECT)
        .single();

      if (error) {
        if (error.message.includes("LOAN_LOCKED")) {
          throw new Error("This loan is locked. Upgrade to Premium to manage it.");
        }
        throw new Error(error.message);
      }
      return data as LoanWithRelations;
    },
    onSuccess: async () => {
      await invalidateLoanCaches(queryClient);
    },
  });
}

export function useMarkLoanLost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("loans")
        .update({ status: "lost", returned_at: null })
        .eq("id", id)
        .select(LOAN_SELECT)
        .single();

      if (error) {
        if (error.message.includes("LOAN_LOCKED")) {
          throw new Error("This loan is locked. Upgrade to Premium to manage it.");
        }
        throw new Error(error.message);
      }
      return data as LoanWithRelations;
    },
    onSuccess: async () => {
      await invalidateLoanCaches(queryClient);
    },
  });
}

export function useRevertLoanStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("loans")
        .update({ status: "active", returned_at: null })
        .eq("id", id)
        .select(LOAN_SELECT)
        .single();

      if (error) {
        if (error.message.includes("LOAN_LOCKED")) {
          throw new Error("This loan is locked. Upgrade to Premium to reopen it.");
        }
        throw new Error(error.message);
      }
      return data as LoanWithRelations;
    },
    onSuccess: async () => {
      await syncOverdueLoans();
      await invalidateLoanCaches(queryClient);
    },
  });
}
