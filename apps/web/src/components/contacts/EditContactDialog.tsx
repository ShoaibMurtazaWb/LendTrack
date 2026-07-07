"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Contact } from "@lendtrack/shared-types";
import { useUpdateContact } from "@/hooks/useContacts";
import { assertNotSelfContact } from "@/lib/contact-validation";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type EditContactDialogProps = {
  contact: Contact;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditContactDialog({ contact, open, onOpenChange }: EditContactDialogProps) {
  const { user } = useAuth();
  const updateContact = useUpdateContact();
  const [name, setName] = useState(contact.name);
  const [email, setEmail] = useState(contact.email ?? "");
  const [phone, setPhone] = useState(contact.phone ?? "");
  const [notes, setNotes] = useState(contact.notes ?? "");

  useEffect(() => {
    if (!open) return;
    setName(contact.name);
    setEmail(contact.email ?? "");
    setPhone(contact.phone ?? "");
    setNotes(contact.notes ?? "");
  }, [contact, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim() || null;
    const trimmedPhone = phone.trim() || null;
    const trimmedNotes = notes.trim() || null;

    const updates: {
      id: string;
      name?: string;
      email?: string | null;
      phone?: string | null;
      notes?: string | null;
    } = { id: contact.id };

    if (trimmedName !== contact.name) updates.name = trimmedName;
    if (trimmedName.length === 0) {
      toast.error("Contact name is required.");
      return;
    }
    if (trimmedEmail !== (contact.email ?? null)) updates.email = trimmedEmail;
    if (trimmedPhone !== (contact.phone ?? null)) updates.phone = trimmedPhone;
    if (trimmedNotes !== (contact.notes ?? null)) updates.notes = trimmedNotes;

    if (Object.keys(updates).length === 1) {
      onOpenChange(false);
      return;
    }

    try {
      if (updates.email !== undefined) {
        assertNotSelfContact(user?.email, updates.email);
      }
      await updateContact.mutateAsync(updates);
      toast.success("Contact updated");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update contact");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit contact</DialogTitle>
          <DialogDescription>Update name, email, phone, or notes.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-phone">Phone</Label>
            <Input
              id="edit-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateContact.isPending}>
              {updateContact.isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
