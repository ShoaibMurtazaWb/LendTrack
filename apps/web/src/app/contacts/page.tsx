"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronRight, Mail, UserPlus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { EmptyState, PageHeader, PageSkeleton } from "@/components/page-layout";
import { useContacts, useCreateContact } from "@/hooks/useContacts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ContactsPage() {
  const { data: contacts, isLoading } = useContacts();
  const createContact = useCreateContact();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [showForm, setShowForm] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createContact.mutateAsync({ name: name.trim(), email: email.trim() || undefined });
      toast.success("Contact added");
      setName("");
      setEmail("");
      setShowForm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add contact");
    }
  };

  return (
    <AuthGuard>
      <AppShell>
        <PageHeader
          title="Contacts"
          description="People you lend to or borrow from. Tap a contact to see all loans with them."
          action={
            <Button
              onClick={() => setShowForm(!showForm)}
              className="gap-2 rounded-xl active:scale-95"
            >
              <UserPlus className="size-4" />
              Add contact
            </Button>
          }
        />

        {showForm && (
          <div className="card-elevation mb-6 max-w-md rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
            <h3 className="font-heading mb-4 text-lg font-semibold">New contact</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  required
                  placeholder="e.g. Ahmed (neighbor)"
                  className="h-12 rounded-xl border-outline-variant bg-white"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  className="h-12 rounded-xl border-outline-variant bg-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createContact.isPending} className="rounded-xl">
                  Save contact
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? (
          <PageSkeleton />
        ) : !contacts?.length ? (
          <EmptyState
            message="No contacts yet. Add someone you lend to or borrow from."
            href="/loans/new"
            linkLabel="Create a loan"
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {contacts.map((contact) => (
              <Link key={contact.id} href={`/contacts/${contact.id}`} className="group block">
                <div className="card-elevation card-elevation-hover h-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-4 transition-all hover:border-primary/40 active:scale-[0.99]">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-heading text-lg font-semibold text-on-surface">
                        {contact.name}
                      </h3>
                      {contact.email && (
                        <p className="mt-1 flex items-center gap-1 truncate text-sm text-on-surface-variant">
                          <Mail className="size-3.5 shrink-0" />
                          {contact.email}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="size-5 shrink-0 text-outline-variant transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                  <p className="mt-3 text-xs text-on-surface-variant">
                    View loans with this person →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </AppShell>
    </AuthGuard>
  );
}
