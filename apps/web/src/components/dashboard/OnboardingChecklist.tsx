"use client";

import Link from "next/link";
import { CheckCircle2, Circle, UserPlus, Wallet } from "lucide-react";
import { useNewLoanDialog } from "@/components/loans/NewLoanDialogProvider";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type OnboardingChecklistProps = {
  hasContacts: boolean;
  hasLoans: boolean;
  onAddContact?: () => void;
};

export function OnboardingChecklist({
  hasContacts,
  hasLoans,
  onAddContact,
}: OnboardingChecklistProps) {
  const { openNewLoan } = useNewLoanDialog();

  if (hasContacts && hasLoans) return null;

  const steps = [
    {
      id: "contact",
      done: hasContacts,
      title: "Add your first contact",
      description: "Someone you lend to or borrow from",
      action: onAddContact ? (
        <Button type="button" size="sm" className="rounded-xl" onClick={onAddContact}>
          <UserPlus className="size-4" />
          Add contact
        </Button>
      ) : (
        <Link
          href="/contacts"
          className={cn(buttonVariants({ size: "sm" }), "rounded-xl gap-2")}
        >
          <UserPlus className="size-4" />
          Add contact
        </Link>
      ),
    },
    {
      id: "loan",
      done: hasLoans,
      title: "Record your first loan",
      description: "Track what you lent out or borrowed",
      action: (
        <Button type="button" size="sm" className="rounded-xl" onClick={() => openNewLoan()}>
          <Wallet className="size-4" />
          New loan
        </Button>
      ),
    },
  ];

  const completed = steps.filter((s) => s.done).length;

  return (
    <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6 md:p-8">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-semibold">Get started with LendTrack</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {completed} of {steps.length} steps complete
          </p>
        </div>
        <div className="hidden h-2 w-24 overflow-hidden rounded-full bg-muted sm:block">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${(completed / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-4">
        {steps.map((step) => {
          const Icon = step.done ? CheckCircle2 : Circle;
          return (
            <div
              key={step.id}
              className={cn(
                "flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between",
                step.done && "opacity-70"
              )}
            >
              <div className="flex items-start gap-3">
                <Icon
                  className={cn(
                    "mt-0.5 size-5 shrink-0",
                    step.done ? "text-brand-green" : "text-muted-foreground"
                  )}
                />
                <div>
                  <p className="font-semibold">{step.title}</p>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
              {!step.done && step.action}
            </div>
          );
        })}
      </div>
    </div>
  );
}
