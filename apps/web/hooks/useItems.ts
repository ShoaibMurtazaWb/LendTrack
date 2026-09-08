// =============================================================================
// LendTrack :: Items Query Hooks (Direct Supabase)
// apps/web/hooks/useItems.ts
// =============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient.js';

export function useItems() {
  const queryClient = useQueryClient();

  const itemsQuery = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('archived', false)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (body: any) => {
      const { data, error } = await supabase
        .from('items')
        .insert(body)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: any }) => {
      const { data, error } = await supabase
        .from('items')
        .update(body)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  return {
    items: itemsQuery.data || [],
    isLoadingItems: itemsQuery.isLoading,
    itemsError: itemsQuery.error,
    refetchItems: itemsQuery.refetch,

    createItem: createMutation.mutateAsync,
    isCreatingItem: createMutation.isPending,

    updateItem: updateMutation.mutateAsync,
    isUpdatingItem: updateMutation.isPending,

    deleteItem: deleteMutation.mutateAsync,
    isDeletingItem: deleteMutation.isPending,
  };
}
