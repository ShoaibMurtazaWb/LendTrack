"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Item } from "@lendtrack/shared-types";
import { getAuthUser, supabase } from "@/lib/supabase";

export function useItems() {
  return useQuery({
    queryKey: ["items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("archived", false)
        .order("name");

      if (error) throw new Error(error.message);
      return data as Item[];
    },
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: { name: string; category?: string; description?: string }) => {
      const user = await getAuthUser();
      const { data, error } = await supabase
        .from("items")
        .insert({ user_id: user.id, name: body.name, category: body.category || null, description: body.description || null })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Item;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
}
