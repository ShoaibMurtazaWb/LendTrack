"use client";

import { useNewLoanDialog } from "@/components/loans/NewLoanDialogProvider";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function NewLoanFab({ className }: { className?: string }) {
  const { openNewLoan } = useNewLoanDialog();

  return (
    <button
      type="button"
      onClick={() => openNewLoan()}
      className={cn(
        "fixed bottom-20 right-4 z-40 flex size-14 items-center justify-center rounded-full bg-secondary-container text-on-secondary shadow-2xl transition-transform hover:scale-110 active:scale-95 md:bottom-8 md:right-8",
        className
      )}
      aria-label="New loan"
    >
      <Plus className="size-7" strokeWidth={2.5} />
    </button>
  );
}
