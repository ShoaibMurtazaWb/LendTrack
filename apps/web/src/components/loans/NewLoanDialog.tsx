"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NewLoanForm } from "@/components/loans/NewLoanForm";

type NewLoanDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presetContactId?: string | null;
};

export function NewLoanDialog({ open, onOpenChange, presetContactId }: NewLoanDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[min(90vh,680px)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
        showCloseButton
      >
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4">
          <DialogTitle className="font-heading text-xl">New loan</DialogTitle>
          <DialogDescription>Record something you lent out or borrowed.</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-hidden px-6 py-5">
          <NewLoanForm
            key={open ? presetContactId ?? "new" : "closed"}
            presetContactId={presetContactId}
            onSuccess={() => onOpenChange(false)}
            showFooterTip={false}
            variant="dialog"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
