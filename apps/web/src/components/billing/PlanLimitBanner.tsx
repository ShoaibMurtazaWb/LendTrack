"use client";

import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { FREE_ACTIVE_LOAN_LIMIT } from "@/lib/plan-limits";
import { cn } from "@/lib/utils";

type PlanLimitBannerProps = {
  activeCount: number;
  className?: string;
  compact?: boolean;
};

export function PlanLimitBanner({ activeCount, className, compact }: PlanLimitBannerProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-primary/25 bg-primary/5 p-4",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">
            {activeCount >= FREE_ACTIVE_LOAN_LIMIT
              ? "Free plan limit reached"
              : `${activeCount} of ${FREE_ACTIVE_LOAN_LIMIT} active loans used`}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeCount >= FREE_ACTIVE_LOAN_LIMIT
              ? "Upgrade to Premium for unlimited active loans, or mark an existing loan as returned."
              : "You're on the free plan. Premium unlocks unlimited active loans and more."}
          </p>
          {!compact && (
            <Link
              href="/settings/billing"
              className={cn(buttonVariants({ size: "sm" }), "mt-3 inline-flex gap-1.5 rounded-lg")}
            >
              View plans
              <ArrowUpRight className="size-3.5" />
            </Link>
          )}
        </div>
        {compact && (
          <Link
            href="/settings/billing"
            className={cn(buttonVariants({ size: "sm" }), "shrink-0 gap-1 rounded-lg")}
          >
            Upgrade
            <ArrowUpRight className="size-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
