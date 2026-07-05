"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { SearchCombobox } from "@/components/SearchCombobox";
import { DirectionToggle, PageSkeleton } from "@/components/page-layout";
import { useContacts, useCreateContact } from "@/hooks/useContacts";
import { useCreateItem, useItems } from "@/hooks/useItems";
import { useCreateLoan } from "@/hooks/useLoans";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function contactLabel(name: string, email?: string | null) {
  return email ? `${name} (${email})` : name;
}

function NewLoanForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetContactId = searchParams.get("contact");
  const { data: contacts, isLoading: contactsLoading } = useContacts();
  const { data: items, isLoading: itemsLoading } = useItems();
  const createItem = useCreateItem();
  const createContact = useCreateContact();
  const createLoan = useCreateLoan();

  const itemOptions = useMemo(
    () =>
      items?.map((item) => ({
        id: item.id,
        label: item.name,
        searchText: item.name,
      })) ?? [],
    [items]
  );

  const contactOptions = useMemo(
    () =>
      contacts?.map((c) => ({
        id: c.id,
        label: contactLabel(c.name, c.email),
        searchText: `${c.name} ${c.email ?? ""}`.trim(),
      })) ?? [],
    [contacts]
  );

  const [itemQuery, setItemQuery] = useState("");
  const [itemId, setItemId] = useState<string | null>(null);
  const [contactQuery, setContactQuery] = useState("");
  const [contactId, setContactId] = useState<string | null>(null);
  const [newContactEmail, setNewContactEmail] = useState("");
  const [direction, setDirection] = useState<"lent_out" | "borrowed">("lent_out");
  const [loanedAt, setLoanedAt] = useState(new Date().toISOString().split("T")[0]);
  const [expectedReturnAt, setExpectedReturnAt] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!presetContactId || !contacts?.length) return;
    const preset = contacts.find((c) => c.id === presetContactId);
    if (preset) {
      setContactId(preset.id);
      setContactQuery(contactLabel(preset.name, preset.email));
    }
  }, [presetContactId, contacts]);

  const isNewContact = contactQuery.trim().length > 0 && !contactId;

  const resolveItemName = () => {
    if (itemId) {
      const existing = items?.find((i) => i.id === itemId);
      return existing?.name ?? itemQuery.trim();
    }
    return itemQuery.trim();
  };

  const resolveContactName = () => {
    if (contactId) {
      const existing = contacts?.find((c) => c.id === contactId);
      return existing?.name ?? contactQuery.trim();
    }
    return contactQuery.trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let resolvedItemId = itemId ?? "";
      let resolvedContactId = contactId ?? "";

      const itemName = resolveItemName();
      const contactName = resolveContactName();

      if (!resolvedItemId && itemName) {
        const existingItem = items?.find(
          (i) => i.name.toLowerCase() === itemName.toLowerCase()
        );
        if (existingItem) {
          resolvedItemId = existingItem.id;
        } else {
          const item = await createItem.mutateAsync({ name: itemName });
          resolvedItemId = item.id;
        }
      }

      if (!resolvedContactId && contactName) {
        const existingContact = contacts?.find(
          (c) => c.name.toLowerCase() === contactName.toLowerCase()
        );
        if (existingContact) {
          resolvedContactId = existingContact.id;
        } else {
          const contact = await createContact.mutateAsync({
            name: contactName,
            email: newContactEmail.trim() || undefined,
          });
          resolvedContactId = contact.id;
        }
      }

      if (!resolvedItemId) {
        toast.error("Please enter an item name.");
        return;
      }
      if (!resolvedContactId) {
        toast.error("Please enter a contact name.");
        return;
      }

      await createLoan.mutateAsync({
        item_id: resolvedItemId,
        contact_id: resolvedContactId,
        direction,
        loaned_at: loanedAt,
        expected_return_at: expectedReturnAt,
        notes: notes || undefined,
      });

      toast.success("Loan created");
      router.push("/loans");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create loan");
    }
  };

  const formLoading = itemsLoading || contactsLoading;

  return (
    <AppShell variant="minimal" title="New Loan" backHref="/loans" hideBottomNav>
      <div className="mx-auto max-w-lg">
        <div className="mb-6 overflow-hidden rounded-xl bg-primary-container p-6 text-on-primary-container">
          <h2 className="font-heading text-xl font-semibold text-white">Lending made simple.</h2>
          <p className="mt-1 text-sm text-primary-fixed-dim">
            Record neighborhood exchanges with trust.
          </p>
        </div>

        <div className="card-elevation rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
          {formLoading ? (
            <PageSkeleton />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="item" className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                  What are you lending or borrowing?
                </Label>
                <SearchCombobox
                  id="item"
                  options={itemOptions}
                  value={itemQuery}
                  selectedId={itemId}
                  onValueChange={(value, id) => {
                    setItemQuery(value);
                    setItemId(id);
                  }}
                  placeholder="e.g. Lawn Mower, Drill, Book"
                  createLabel={(q) => `Add new item "${q}"`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact" className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                  With whom?
                </Label>
                <SearchCombobox
                  id="contact"
                  options={contactOptions}
                  value={contactQuery}
                  selectedId={contactId}
                  onValueChange={(value, id) => {
                    setContactQuery(value);
                    setContactId(id);
                    if (id) setNewContactEmail("");
                  }}
                  placeholder="Search contacts or type a new name…"
                  createLabel={(q) => `Add new contact "${q}"`}
                />
                {isNewContact && (
                  <Input
                    type="email"
                    placeholder="Their email (optional)"
                    className="h-12 rounded-xl border-outline-variant bg-white"
                    value={newContactEmail}
                    onChange={(e) => setNewContactEmail(e.target.value)}
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                  Transaction direction
                </Label>
                <DirectionToggle value={direction} onChange={setDirection} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="loanedAt" className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                    Loaned on
                  </Label>
                  <Input
                    id="loanedAt"
                    type="date"
                    required
                    className="h-12 rounded-xl border-outline-variant bg-white"
                    value={loanedAt}
                    onChange={(e) => setLoanedAt(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expectedReturn" className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                    Expected return
                  </Label>
                  <Input
                    id="expectedReturn"
                    type="date"
                    required
                    className="h-12 rounded-xl border-outline-variant bg-white"
                    value={expectedReturnAt}
                    onChange={(e) => setExpectedReturnAt(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                  Notes (optional)
                </Label>
                <Textarea
                  id="notes"
                  className="rounded-xl border-outline-variant bg-white"
                  placeholder="Add any specific conditions or descriptions…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <Button
                type="submit"
                className="h-14 w-full rounded-xl text-base font-bold shadow-md active:scale-95"
                disabled={createLoan.isPending || createItem.isPending || createContact.isPending}
              >
                {createLoan.isPending ? "Creating…" : "Create loan"}
              </Button>
            </form>
          )}
        </div>

        <div className="mt-6 flex items-center gap-4 rounded-xl bg-secondary-container p-4">
          <Package className="size-8 shrink-0 text-primary" />
          <p className="text-sm text-on-secondary-container">
            LendTrack keeps a private record of what you share with neighbors.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

export default function NewLoanPage() {
  return (
    <AuthGuard>
      <Suspense
        fallback={
          <AppShell variant="minimal" title="New Loan" backHref="/loans" hideBottomNav>
            <PageSkeleton />
          </AppShell>
        }
      >
        <NewLoanForm />
      </Suspense>
    </AuthGuard>
  );
}
