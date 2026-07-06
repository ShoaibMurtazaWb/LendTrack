"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateLoanCaches, syncOverdueLoans } from "@/lib/loan-sync";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";

const REMINDER_STORAGE_KEY = "lendtrack:reminders:last";
const REMINDER_INTERVAL_MS = 24 * 60 * 60 * 1000;

function shouldProcessReminders(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const last = localStorage.getItem(REMINDER_STORAGE_KEY);
    if (!last) return true;
    return Date.now() - Number(last) > REMINDER_INTERVAL_MS;
  } catch {
    return true;
  }
}

function markRemindersProcessed() {
  try {
    localStorage.setItem(REMINDER_STORAGE_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

export function useSyncOverdueLoans() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const ran = useRef(false);

  useEffect(() => {
    if (!session || ran.current) return;
    ran.current = true;

    void syncOverdueLoans()
      .then(() => invalidateLoanCaches(queryClient))
      .catch(() => {});

    if (!shouldProcessReminders()) return;

    void supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!s?.access_token) return;
      void fetch("/api/reminders/process", {
        method: "POST",
        headers: { Authorization: `Bearer ${s.access_token}` },
      })
        .then((res) => {
          if (res.ok) markRemindersProcessed();
        })
        .catch(() => {});
    });
  }, [session, queryClient]);
}
