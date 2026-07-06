"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { GlobalSearch } from "@/components/GlobalSearch";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function MobileGlobalSearch() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-9 shrink-0 rounded-xl md:hidden"
        aria-label="Search loans and contacts"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-4 sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Search</DialogTitle>
            <DialogDescription>Find loans and contacts across LendTrack.</DialogDescription>
          </DialogHeader>
          <GlobalSearch
            className="w-full"
            onNavigate={() => setOpen(false)}
            autoFocus
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
