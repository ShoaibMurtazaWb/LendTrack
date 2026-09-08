// =============================================================================
// LendTrack :: Loans Query Hooks (Direct Supabase)
// apps/web/hooks/useLoans.ts
// =============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient.js';
import { useAuth } from './useAuth.js';

export function useLoans() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  const loansQuery = useQuery({
    queryKey: ['loans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loans')
        .select(`
          *,
          item:items(*),
          contact:contacts(*)
        `)
        .order('loaned_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const activeLoans = (loansQuery.data || []).filter((l: any) => l.status === 'active' || l.status === 'overdue');
  const overdueLoans = (loansQuery.data || []).filter((l: any) => l.status === 'overdue');

  const todayStr = new Date().toISOString().split('T')[0];
  const sevenDaysLater = new Date();
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
  const sevenDaysLaterStr = sevenDaysLater.toISOString().split('T')[0];

  const upcomingDue = (loansQuery.data || []).filter((l: any) => 
    l.status === 'active' && 
    l.expected_return_at && 
    l.expected_return_at >= todayStr && 
    l.expected_return_at <= sevenDaysLaterStr
  );

  const summary = {
    activeLoansCount: activeLoans.length,
    overdueLoansCount: overdueLoans.length,
    upcomingDueCount: upcomingDue.length,
    freeTrialLoansRemaining: profile?.plan === 'free' ? Math.max(0, 5 - activeLoans.length) : undefined,
    plan: profile?.plan || 'free',
  };

  const createMutation = useMutation({
    mutationFn: async (body: any) => {
      // 1. Enforce 5-loan active limit on Free plan
      if (profile?.plan === 'free' && activeLoans.length >= 5) {
        throw new Error('You have reached the maximum of 5 active loans allowed on the Free plan. Upgrade to Premium for unlimited loans!');
      }

      let finalItemId = body.item_id;
      let finalContactId = body.contact_id;

      // 2. Inline create item if item_id is missing
      if (!finalItemId && body.item_name) {
        const { data: newItem, error: itemErr } = await supabase
          .from('items')
          .insert({
            name: body.item_name,
            category: body.item_category || 'General',
            archived: false,
          })
          .select()
          .single();

        if (itemErr) throw itemErr;
        finalItemId = newItem.id;
      }

      // 3. Inline create contact if contact_id is missing
      if (!finalContactId && body.contact_name) {
        const { data: newContact, error: contactErr } = await supabase
          .from('contacts')
          .insert({
            name: body.contact_name,
          })
          .select()
          .single();

        if (contactErr) throw contactErr;
        finalContactId = newContact.id;
      }

      // 4. Insert loan
      const { data, error } = await supabase
        .from('loans')
        .insert({
          item_id: finalItemId,
          contact_id: finalContactId,
          direction: body.direction,
          loaned_at: body.loaned_at,
          expected_return_at: body.expected_return_at || null,
          status: 'active',
          notes: body.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: any }) => {
      const { data, error } = await supabase
        .from('loans')
        .update(body)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loan', variables.id] });
    },
  });

  const logReturnMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('loans')
        .update({
          status: 'returned',
          returned_at: new Date().toISOString().split('T')[0],
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loan', id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('loans')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
    },
  });

  return {
    loans: loansQuery.data || [],
    isLoadingLoans: loansQuery.isLoading,
    loansError: loansQuery.error,
    refetchLoans: loansQuery.refetch,

    summary,
    isLoadingSummary: loansQuery.isLoading,
    summaryError: loansQuery.error,
    refetchSummary: loansQuery.refetch,

    createLoan: createMutation.mutateAsync,
    isCreatingLoan: createMutation.isPending,
    createLoanError: createMutation.error,

    updateLoan: updateMutation.mutateAsync,
    isUpdatingLoan: updateMutation.isPending,

    logReturn: logReturnMutation.mutateAsync,
    isLoggingReturn: logReturnMutation.isPending,

    deleteLoan: deleteMutation.mutateAsync,
    isDeletingLoan: deleteMutation.isPending,
  };
}

export function useLoan(id: string) {
  const query = useQuery({
    queryKey: ['loan', id],
    queryFn: async () => {
      const { data: loan, error } = await supabase
        .from('loans')
        .select(`
          *,
          item:items(*),
          contact:contacts(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Fetch reminder logs
      const { data: logs } = await supabase
        .from('reminder_logs')
        .select('*')
        .eq('loan_id', id)
        .order('sent_at', { ascending: false });

      return {
        ...loan,
        reminderLogs: logs || [],
      };
    },
    enabled: !!id,
  });

  return {
    loan: query.data,
    isLoadingLoan: query.isLoading,
    loanError: query.error,
    refetchLoan: query.refetch,
  };
}
