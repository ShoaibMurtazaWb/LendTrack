"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useProfile } from "@/hooks/useAuth";
import { useDashboardSummary } from "@/hooks/useLoans";
import { FREE_ACTIVE_LOAN_LIMIT } from "@/lib/plan-limits";
import { cn } from "@/lib/utils";

export function SidebarPlanLink() {
  const { data: profile } = useProfile();
  const { data: dashboard } = useDashboardSummary();

  const isPremium = profile?.plan === "premium";
  const activeCount = dashboard?.active_count ?? 0;
  const atLimit = !isPremium && activeCount >= FREE_ACTIVE_LOAN_LIMIT;

  const label = isPremium ? "Premium plan" : atLimit ? "Upgrade plan" : "Free plan";
  const tooltip = isPremium
    ? "Premium · Manage billing"
    : atLimit
      ? `${activeCount}/${FREE_ACTIVE_LOAN_LIMIT} loans · Upgrade to Premium`
      : `Free · ${activeCount}/${FREE_ACTIVE_LOAN_LIMIT} active loans`;

  return (
    <Link
      href="/settings/billing"
      className="group relative mx-2 mt-2 flex flex-col items-center"
      aria-label={tooltip}
    >
      <span
        className={cn(
          "flex size-11 items-center justify-center rounded-2xl transition-all duration-200",
          isPremium
            ? "bg-amber-400/20 text-amber-300 hover:bg-amber-400/30"
            : atLimit
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/40 ring-2 ring-primary/30"
              : "bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white"
        )}
      >
        <Sparkles className="size-5" strokeWidth={2} />
      </span>
      <span className="mt-1 max-w-[4rem] truncate text-center text-[9px] font-semibold uppercase tracking-wide text-slate-500 group-hover:text-slate-300">
        {label}
      </span>
      <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        {tooltip}
      </span>
    </Link>
  );
}
