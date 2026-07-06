"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { NewLoanDialog } from "@/components/loans/NewLoanDialog";

type NewLoanDialogContextValue = {
  openNewLoan: (presetContactId?: string) => void;
};

const NewLoanDialogContext = createContext<NewLoanDialogContextValue | null>(null);

export function NewLoanDialogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [presetContactId, setPresetContactId] = useState<string | null>(null);

  const openNewLoan = useCallback((contactId?: string) => {
    setPresetContactId(contactId ?? null);
    setOpen(true);
  }, []);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setPresetContactId(null);
  };

  return (
    <NewLoanDialogContext.Provider value={{ openNewLoan }}>
      {children}
      <NewLoanDialog
        open={open}
        onOpenChange={handleOpenChange}
        presetContactId={presetContactId}
      />
    </NewLoanDialogContext.Provider>
  );
}

export function useNewLoanDialog() {
  const ctx = useContext(NewLoanDialogContext);
  if (!ctx) {
    throw new Error("useNewLoanDialog must be used within NewLoanDialogProvider");
  }
  return ctx;
}
