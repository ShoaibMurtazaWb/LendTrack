"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";

let syncedThisSession = false;

export function useSyncOverdueLoans() {
  const { session } = useAuth();
  const ran = useRef(false);

  useEffect(() => {
    if (!session || ran.current || syncedThisSession) return;
    ran.current = true;
    syncedThisSession = true;

    const today = new Date().toISOString().split("T")[0];
    supabase
      .from("loans")
      .update({ status: "overdue" })
      .eq("status", "active")
      .lt("expected_return_at", today)
      .then(() => {});
  }, [session]);
}
