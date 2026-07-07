"use client";

import Link from "next/link";
import { ArrowUpRight, Check, Sparkles } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FREE_ACTIVE_LOAN_LIMIT } from "@/lib/plan-limits";
import { cn } from "@/lib/utils";

const PREMIUM_FEATURES = [
  "Unlimited active loans",
  "All loans stay editable",
  "Weekly digest emails",
  "Export loan history (CSV)",
] as const;

type UpgradePromptDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
};

export function UpgradePromptDialog({
  open,
  onOpenChange,
  title = "You've reached the free plan limit",
  description = `Free includes up to ${FREE_ACTIVE_LOAN_LIMIT} active loans. Upgrade to Premium to keep tracking without limits.`,
}: UpgradePromptDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="size-6" />
          </div>
          <DialogTitle className="font-heading text-xl">{title}</DialogTitle>
          <DialogDescription className="text-left leading-relaxed">{description}</DialogDescription>
        </DialogHeader>

        <ul className="space-y-2 rounded-xl bg-muted/50 p-4">
          {PREMIUM_FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 size-4 shrink-0 text-brand-green" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Link
            href="/settings/billing"
            className={cn(buttonVariants(), "w-full gap-2 rounded-xl")}
            onClick={() => onOpenChange(false)}
          >
            View plans & upgrade
            <ArrowUpRight className="size-4" />
          </Link>
          <Button
            type="button"
            variant="ghost"
            className="w-full rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            Not now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
