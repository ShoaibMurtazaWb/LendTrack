"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SearchCombobox } from "@/components/SearchCombobox";
import { CategoryCombobox } from "@/components/CategoryCombobox";
import { ItemThumbnail } from "@/components/ItemThumbnail";
import { DirectionToggle, PageSkeleton } from "@/components/page-layout";
import { useContacts, useCreateContact } from "@/hooks/useContacts";
import { useCreateItem, useItems, useUpdateItem } from "@/hooks/useItems";
import { useCreateLoan } from "@/hooks/useLoans";
import {
  getCategoryLabel,
  guessCategoryFromName,
  resolveCategoryFromInput,
  type ItemCategoryId,
} from "@/lib/item-categories";
import { uploadItemPhoto } from "@/lib/upload-item-image";
import { Camera, Package, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function contactLabel(name: string, email?: string | null) {
  return email ? `${name} (${email})` : name;
}

export type NewLoanFormProps = {
  presetContactId?: string | null;
  onSuccess?: () => void;
  showFooterTip?: boolean;
};

export function NewLoanForm({
  presetContactId = null,
  onSuccess,
  showFooterTip = true,
}: NewLoanFormProps) {
  const router = useRouter();
  const { data: contacts, isLoading: contactsLoading } = useContacts();
  const { data: items, isLoading: itemsLoading } = useItems();
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const createContact = useCreateContact();
  const createLoan = useCreateLoan();
  const categoryTouched = useRef(false);

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
  const [categoryQuery, setCategoryQuery] = useState("Other");
  const [categoryId, setCategoryId] = useState<ItemCategoryId | null>("other");
  const [itemPhotoFile, setItemPhotoFile] = useState<File | null>(null);
  const [itemPhotoPreview, setItemPhotoPreview] = useState<string | null>(null);
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
  const selectedItem = items?.find((i) => i.id === itemId);

  useEffect(() => {
    if (selectedItem) {
      const cat = (selectedItem.category as ItemCategoryId) || "other";
      setCategoryId(cat);
      setCategoryQuery(getCategoryLabel(cat));
      setItemPhotoPreview(selectedItem.photo_url);
      setItemPhotoFile(null);
      categoryTouched.current = false;
    }
  }, [selectedItem]);

  useEffect(() => {
    if (itemId || !itemQuery.trim() || categoryTouched.current) return;
    const guessed = guessCategoryFromName(itemQuery);
    setCategoryId(guessed);
    setCategoryQuery(getCategoryLabel(guessed));
  }, [itemQuery, itemId]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setItemPhotoFile(file);
    setItemPhotoPreview(URL.createObjectURL(file));
  };

  const clearPhoto = () => {
    setItemPhotoFile(null);
    setItemPhotoPreview(selectedItem?.photo_url ?? null);
  };

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

  const resolveCategory = (): ItemCategoryId => {
    return categoryId ?? resolveCategoryFromInput(categoryQuery);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let resolvedItemId = itemId ?? "";
      let resolvedContactId = contactId ?? "";
      const finalCategory = resolveCategory();

      const itemName = resolveItemName();
      const contactName = resolveContactName();

      if (!resolvedItemId && itemName) {
        const existingItem = items?.find(
          (i) => i.name.toLowerCase() === itemName.toLowerCase()
        );
        if (existingItem) {
          resolvedItemId = existingItem.id;
        } else {
          let photoUrl: string | null = null;
          if (itemPhotoFile) {
            photoUrl = await uploadItemPhoto(itemPhotoFile);
          }
          const item = await createItem.mutateAsync({
            name: itemName,
            category: finalCategory,
            photo_url: photoUrl,
          });
          resolvedItemId = item.id;
        }
      }

      if (resolvedItemId) {
        const existingItem = items?.find((i) => i.id === resolvedItemId);
        const categoryChanged =
          existingItem && (existingItem.category as ItemCategoryId) !== finalCategory;
        const needsPhotoUpdate = !!itemPhotoFile;

        if (existingItem && (categoryChanged || needsPhotoUpdate)) {
          let photoUrl = existingItem.photo_url;
          if (itemPhotoFile) {
            photoUrl = await uploadItemPhoto(itemPhotoFile);
          }
          await updateItem.mutateAsync({
            id: resolvedItemId,
            category: finalCategory,
            photo_url: photoUrl,
          });
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
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/loans");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create loan");
    }
  };

  const formLoading = itemsLoading || contactsLoading;
  const displayCategory = resolveCategory();

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-primary p-5 text-primary-foreground">
        <h2 className="font-heading text-xl font-semibold">Lending made simple.</h2>
        <p className="mt-1 text-sm text-primary-foreground/80">
          Record neighborhood exchanges with trust.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        {formLoading ? (
          <PageSkeleton />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="item" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
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
                  if (!id) {
                    setItemPhotoPreview(null);
                    setItemPhotoFile(null);
                  }
                }}
                placeholder="e.g. Lawn Mower, Drill, Book"
                createLabel={(q) => `Add new item "${q}"`}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Category
              </Label>
              <CategoryCombobox
                id="category"
                value={categoryQuery}
                categoryId={categoryId}
                onValueChange={(label, id) => {
                  categoryTouched.current = true;
                  setCategoryQuery(label);
                  setCategoryId(id);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Item photo <span className="font-normal normal-case">(optional)</span>
              </Label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="relative w-full max-w-[140px] overflow-hidden rounded-xl border border-border/60">
                      {itemPhotoPreview ? (
                    <>
                      <ItemThumbnail
                        name={itemQuery}
                        photoUrl={itemPhotoPreview}
                        category={displayCategory}
                        size="lg"
                        className="!size-[140px] rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={clearPhoto}
                        className="absolute right-1 top-1 flex size-7 cursor-pointer items-center justify-center rounded-full bg-background/90 shadow"
                        aria-label="Remove photo"
                      >
                        <X className="size-4" />
                      </button>
                    </>
                  ) : (
                    <div className="flex size-[140px] flex-col items-center justify-center gap-2 bg-muted/50 text-muted-foreground">
                      <ItemThumbnail
                        name={itemQuery || "Item"}
                        category={displayCategory}
                        size="lg"
                        className="!size-20"
                      />
                      <span className="text-xs">Category icon</span>
                    </div>
                  )}
                </div>
                <label className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border px-6 py-8 text-center transition-colors hover:border-primary/50 hover:bg-muted/30">
                  <Camera className="size-8 text-muted-foreground" />
                  <span className="text-sm font-semibold">Upload photo</span>
                  <span className="text-xs text-muted-foreground">JPEG, PNG or WebP · max 5 MB</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    onChange={handlePhotoChange}
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                Skip the photo and we&apos;ll show the category icon on your loans.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
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
                  className="h-12 cursor-text rounded-xl"
                  value={newContactEmail}
                  onChange={(e) => setNewContactEmail(e.target.value)}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Transaction direction
              </Label>
              <DirectionToggle value={direction} onChange={setDirection} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="loanedAt" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Loaned on
                </Label>
                <Input
                  id="loanedAt"
                  type="date"
                  required
                  className="h-12 cursor-pointer rounded-xl"
                  value={loanedAt}
                  onChange={(e) => setLoanedAt(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedReturn" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Expected return
                </Label>
                <Input
                  id="expectedReturn"
                  type="date"
                  required
                  className="h-12 cursor-pointer rounded-xl"
                  value={expectedReturnAt}
                  onChange={(e) => setExpectedReturnAt(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Notes (optional)
              </Label>
              <Textarea
                id="notes"
                className="cursor-text rounded-xl"
                placeholder="Add any specific conditions or descriptions…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <Button
              type="submit"
              className="h-14 w-full rounded-xl text-base font-bold shadow-md active:scale-95"
              disabled={
                createLoan.isPending ||
                createItem.isPending ||
                createContact.isPending ||
                updateItem.isPending
              }
            >
              {createLoan.isPending ? "Creating…" : "Create loan"}
            </Button>
          </form>
        )}
      </div>

      {showFooterTip && (
        <div className="flex items-center gap-4 rounded-xl bg-secondary/20 p-4">
          <Package className="size-8 shrink-0 text-primary" />
          <p className="text-sm text-foreground">
            LendTrack keeps a private record of what you share with neighbors.
          </p>
        </div>
      )}
    </div>
  );
}
