"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { EmptyState, PageHeader } from "@/components/ui";
import { useContacts, useCreateContact, useDeleteContact } from "@/hooks/useContacts";

export default function ContactsPage() {
  const { data: contacts, isLoading } = useContacts();
  const createContact = useCreateContact();
  const deleteContact = useDeleteContact();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [showForm, setShowForm] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createContact.mutateAsync({ name, email: email || undefined });
    setName("");
    setEmail("");
    setShowForm(false);
  };

  return (
    <AuthGuard>
      <AppShell>
        <PageHeader
          title="Contacts"
          description="People you lend to and borrow from"
          action={
            <button
              onClick={() => setShowForm(!showForm)}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Add contact
            </button>
          }
        />

        {showForm && (
          <form onSubmit={handleCreate} className="mb-6 max-w-md space-y-3 rounded-xl border border-slate-200 bg-white p-4">
            <input
              type="text"
              required
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
            <input
              type="email"
              placeholder="Email (optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
            <button
              type="submit"
              disabled={createContact.isPending}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Save
            </button>
          </form>
        )}

        {isLoading ? (
          <p className="text-slate-500">Loading...</p>
        ) : !contacts?.length ? (
          <EmptyState message="No contacts yet. Add friends, family, or neighbors you lend to." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-start justify-between rounded-xl border border-slate-200 bg-white p-4"
              >
                <div>
                  <p className="font-medium text-slate-900">{contact.name}</p>
                  {contact.email && <p className="text-sm text-slate-500">{contact.email}</p>}
                  {contact.phone && <p className="text-sm text-slate-500">{contact.phone}</p>}
                </div>
                <button
                  onClick={() => deleteContact.mutate(contact.id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </AppShell>
    </AuthGuard>
  );
}
