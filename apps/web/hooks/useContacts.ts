// =============================================================================
// LendTrack :: Contacts Query Hooks (Direct Supabase)
// apps/web/hooks/useContacts.ts
// =============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient.js';

export function useContacts() {
  const queryClient = useQueryClient();

  const contactsQuery = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .is('deleted_at', null)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (body: any) => {
      const { data, error } = await supabase
        .from('contacts')
        .insert(body)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: any }) => {
      const { data, error } = await supabase
        .from('contacts')
        .update(body)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
    },
  });

  const deleteMutation = useMutation({
    // Soft delete contact
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contacts')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  return {
    contacts: contactsQuery.data || [],
    isLoadingContacts: contactsQuery.isLoading,
    contactsError: contactsQuery.error,
    refetchContacts: contactsQuery.refetch,

    createContact: createMutation.mutateAsync,
    isCreatingContact: createMutation.isPending,

    updateContact: updateMutation.mutateAsync,
    isUpdatingContact: updateMutation.isPending,

    deleteContact: deleteMutation.mutateAsync,
    isDeletingContact: deleteMutation.isPending,
  };
}
