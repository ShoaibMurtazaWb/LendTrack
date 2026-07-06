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
        className="max-h-[min(92vh,820px)] max-w-lg gap-0 overflow-y-auto p-0 sm:max-w-lg"
        showCloseButton
      >
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle className="font-heading text-xl">New loan</DialogTitle>
          <DialogDescription>Record something you lent out or borrowed.</DialogDescription>
        </DialogHeader>
        <div className="px-6 py-5">
          <NewLoanForm
            key={open ? presetContactId ?? "new" : "closed"}
            presetContactId={presetContactId}
            onSuccess={() => onOpenChange(false)}
            showFooterTip={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
