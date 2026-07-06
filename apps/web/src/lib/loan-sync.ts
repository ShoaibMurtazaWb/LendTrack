import type { QueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function localDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function syncOverdueLoans() {
  const today = localDateString();
  const { error } = await supabase
    .from("loans")
    .update({ status: "overdue" })
    .eq("status", "active")
    .lt("expected_return_at", today);

  if (error) throw new Error(error.message);
}

export async function invalidateLoanCaches(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["loans"] }),
    queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
  ]);
}
