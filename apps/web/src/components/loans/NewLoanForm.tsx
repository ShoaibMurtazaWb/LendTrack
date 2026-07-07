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
import { useCreateLoan, useDashboardSummary } from "@/hooks/useLoans";
import { useProfile } from "@/hooks/useAuth";
import { useAuth } from "@/providers/AuthProvider";
import {
  getCategoryLabel,
  type ItemCategoryId,
} from "@/lib/item-categories";
import { uploadItemPhoto } from "@/lib/upload-item-image";
import { assertNotSelfContact, isOwnContactEmail } from "@/lib/contact-validation";
import { UpgradePromptDialog } from "@/components/billing/UpgradePromptDialog";
import { PlanLimitBanner } from "@/components/billing/PlanLimitBanner";
import { FREE_ACTIVE_LOAN_LIMIT, isPlanLimitError } from "@/lib/plan-limits";
import { cn } from "@/lib/utils";
import { Camera, Package, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type NewLoanFormProps = {
  presetContactId?: string | null;
  onSuccess?: () => void;
  showFooterTip?: boolean;
  variant?: "page" | "dialog";
};

const DIALOG_STEPS = ["Item", "Contact", "Details"] as const;

export function NewLoanForm({
  presetContactId = null,
  onSuccess,
  showFooterTip = true,
  variant = "page",
}: NewLoanFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: contacts, isLoading: contactsLoading } = useContacts();
  const { data: items, isLoading: itemsLoading } = useItems();
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const createContact = useCreateContact();
  const createLoan = useCreateLoan();
  const { data: dashboard } = useDashboardSummary();
  const categoryTouched = useRef(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

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
      contacts
        ?.filter((c) => !isOwnContactEmail(user?.email, c.email))
        .map((c) => ({
          id: c.id,
          label: c.name,
          subtitle: c.email ?? undefined,
          searchText: `${c.name} ${c.email ?? ""}`.trim(),
        })) ?? [],
    [contacts, user?.email]
  );

  const [itemQuery, setItemQuery] = useState("");
  const [itemId, setItemId] = useState<string | null>(null);
  const [categoryQuery, setCategoryQuery] = useState("");
  const [categoryId, setCategoryId] = useState<ItemCategoryId | null>(null);
  const [itemPhotoFile, setItemPhotoFile] = useState<File | null>(null);
  const [itemPhotoPreview, setItemPhotoPreview] = useState<string | null>(null);
  const [contactQuery, setContactQuery] = useState("");
  const [contactId, setContactId] = useState<string | null>(null);
  const [newContactEmail, setNewContactEmail] = useState("");
  const [direction, setDirection] = useState<"lent_out" | "borrowed">("lent_out");
  const [loanedAt, setLoanedAt] = useState(new Date().toISOString().split("T")[0]);
  const [expectedReturnAt, setExpectedReturnAt] = useState("");
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState(0);
  const isDialog = variant === "dialog";

  useEffect(() => {
    if (!presetContactId || !contacts?.length) return;
    const preset = contacts.find((c) => c.id === presetContactId);
    if (!preset) return;
    if (isOwnContactEmail(user?.email, preset.email)) {
      toast.error("You can't create a loan with yourself as the contact.");
      return;
    }
    setContactId(preset.id);
    setContactQuery(preset.name);
  }, [presetContactId, contacts, user?.email]);

  const isNewContact = contactQuery.trim().length > 0 && !contactId;
  const selectedContact = contacts?.find((c) => c.id === contactId);
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

  const resolveCategory = (): ItemCategoryId | null => categoryId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let resolvedItemId = itemId ?? "";
      let resolvedContactId = contactId ?? "";
      const finalCategory = resolveCategory();

      const itemName = resolveItemName();
      const contactName = resolveContactName();

      if (!resolvedItemId && itemName && !finalCategory) {
        toast.error("Please select a category for this item.");
        return;
      }

      const contactEmailForCheck =
        contactId != null
          ? contacts?.find((c) => c.id === contactId)?.email
          : newContactEmail.trim() || undefined;
      try {
        assertNotSelfContact(user?.email, contactEmailForCheck);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Invalid contact");
        return;
      }

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
            category: finalCategory!,
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
            category: finalCategory!,
            photo_url: photoUrl,
          });
        }
      }

      if (!resolvedContactId && contactName) {
        const existingContact = contacts?.find(
          (c) => c.name.toLowerCase() === contactName.toLowerCase()
        );
        if (existingContact) {
          if (isOwnContactEmail(user?.email, existingContact.email)) {
            toast.error("You can't lend to or borrow from yourself.");
            return;
          }
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
      if (expectedReturnAt < loanedAt) {
        toast.error("Expected return must be on or after the loan date.");
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
      const message = err instanceof Error ? err.message : "Failed to create loan";
      if (isPlanLimitError(message)) {
        setUpgradeOpen(true);
        return;
      }
      toast.error(message);
    }
  };

  const formLoading = itemsLoading || contactsLoading;
  const displayCategory = resolveCategory();
  const userFirstName = profile?.full_name?.split(" ")[0] ?? "there";
  const isFreePlan = profile?.plan !== "premium";
  const activeLoanCount = dashboard?.active_count ?? 0;
  const showPlanLimitBanner =
    !isDialog && isFreePlan && activeLoanCount >= FREE_ACTIVE_LOAN_LIMIT - 1;

  const canAdvanceFromItem = resolveItemName().length > 0;
  const canAdvanceFromContact = resolveContactName().length > 0;
  const canSubmit =
    canAdvanceFromItem &&
    canAdvanceFromContact &&
    categoryId != null &&
    loanedAt &&
    expectedReturnAt &&
    expectedReturnAt >= loanedAt;

  const goNext = () => setStep((s) => Math.min(s + 1, DIALOG_STEPS.length - 1));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const itemFields = (
    <>
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
              if (!categoryTouched.current) {
                setCategoryId(null);
                setCategoryQuery("");
              }
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
          placeholder="Select or search a category…"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Item photo <span className="font-normal normal-case">(optional)</span>
        </Label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="relative w-full max-w-[140px] overflow-hidden rounded-xl border border-border">
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
                  className="absolute right-1.5 top-1.5 flex size-7 cursor-pointer items-center justify-center rounded-full bg-background/90 shadow"
                  aria-label="Remove photo"
                >
                  <X className="size-4" />
                </button>
              </>
            ) : (
              <ItemThumbnail
                name={itemQuery || "Item"}
                category={displayCategory}
                size="lg"
                className="!size-[140px] rounded-xl"
              />
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
      </div>
    </>
  );

  const contactFields = (
    <>
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
        {selectedContact?.email && (
          <p className="text-xs text-muted-foreground">{selectedContact.email}</p>
        )}
        {isNewContact && (
          <Input
            type="email"
            placeholder="Their email (optional — links accounts for messaging)"
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
    </>
  );

  const detailFields = (
    <>
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
    </>
  );

  return (
    <div className={isDialog ? "flex h-full min-h-0 flex-col" : "space-y-5"}>
      {!isDialog && (
        <div className="hero-gradient rounded-xl p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/70">New loan</p>
          <h2 className="mt-1 font-heading text-xl font-semibold">Hello, {userFirstName} 👋</h2>
          {profile?.full_name && (
            <p className="mt-0.5 text-sm text-white/80">{profile.full_name}</p>
          )}
          <p className="text-sm text-white/70">{user?.email ?? "Record neighborhood exchanges with trust."}</p>
        </div>
      )}

      <div className={isDialog ? "flex min-h-0 flex-1 flex-col" : "rounded-xl border border-border bg-card p-5 shadow-sm"}>
        {formLoading ? (
          <PageSkeleton />
        ) : (
          <form
            onSubmit={handleSubmit}
            className={isDialog ? "flex min-h-0 flex-1 flex-col" : "space-y-5"}
          >
            {isDialog && (
              <div className="mb-5 flex items-center gap-2">
                {DIALOG_STEPS.map((label, index) => (
                  <div key={label} className="flex flex-1 items-center gap-2">
                    <div
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        index <= step
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {index + 1}
                    </div>
                    <span
                      className={cn(
                        "hidden text-xs font-semibold sm:inline",
                        index === step ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {label}
                    </span>
                    {index < DIALOG_STEPS.length - 1 && (
                      <div className="mx-1 hidden h-px flex-1 bg-border sm:block" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {showPlanLimitBanner && <PlanLimitBanner activeCount={activeLoanCount} className="mb-5" />}

            <div className={isDialog ? "min-h-0 flex-1 space-y-5" : "space-y-5"}>
              {isDialog ? (
                <>
                  {step === 0 && itemFields}
                  {step === 1 && contactFields}
                  {step === 2 && detailFields}
                </>
              ) : (
                <>
                  {itemFields}
                  {contactFields}
                  {detailFields}
                </>
              )}
            </div>

            {isDialog ? (
              <div className="mt-6 flex shrink-0 gap-2 border-t border-border pt-4">
                {step > 0 ? (
                  <Button type="button" variant="outline" className="h-11 flex-1 rounded-xl" onClick={goBack}>
                    Back
                  </Button>
                ) : (
                  <div className="flex-1" />
                )}
                {step < DIALOG_STEPS.length - 1 ? (
                  <Button
                    type="button"
                    className="h-11 flex-1 rounded-xl"
                    disabled={step === 0 ? !canAdvanceFromItem : !canAdvanceFromContact}
                    onClick={goNext}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="h-11 flex-1 rounded-xl font-bold"
                    disabled={
                      !canSubmit ||
                      createLoan.isPending ||
                      createItem.isPending ||
                      createContact.isPending ||
                      updateItem.isPending
                    }
                  >
                    {createLoan.isPending ? "Creating…" : "Create loan"}
                  </Button>
                )}
              </div>
            ) : (
              <Button
                type="submit"
                className="h-14 w-full rounded-xl text-base font-bold shadow-md active:scale-95"
                disabled={
                  !canSubmit ||
                  createLoan.isPending ||
                  createItem.isPending ||
                  createContact.isPending ||
                  updateItem.isPending
                }
              >
                {createLoan.isPending ? "Creating…" : "Create loan"}
              </Button>
            )}
          </form>
        )}
      </div>

      {!isDialog && showFooterTip && (
        <div className="flex items-center gap-4 rounded-xl bg-secondary/20 p-4">
          <Package className="size-8 shrink-0 text-primary" />
          <p className="text-sm text-foreground">
            LendTrack keeps a private record of what you share with neighbors.
          </p>
        </div>
      )}

      <UpgradePromptDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  );
}
