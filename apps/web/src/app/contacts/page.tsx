"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { UserPlus, Users, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { ContactGridCard } from "@/components/LoanGridCard";
import { Pagination, paginateArray } from "@/components/Pagination";
import { EmptyState, PageSkeleton } from "@/components/page-layout";
import { QueryErrorState } from "@/components/QueryErrorState";
import { useContacts, useCreateContact } from "@/hooks/useContacts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PAGE_SIZE = 8;

function ContactsPageContent() {
  const { data: contacts, isLoading, isError, refetch } = useContacts();
  const createContact = useCreateContact();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [showForm, setShowForm] = useState(false);

  const filtered = useMemo(() => {
    if (!contacts) return [];
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q)
    );
  }, [contacts, search]);

  const paginated = filtered.length ? paginateArray(filtered, page, PAGE_SIZE) : null;

  const heroStats = useMemo(() => {
    if (!contacts) return { total: 0, verified: 0 };
    return {
      total: contacts.length,
      verified: contacts.filter((c) => c.linked_user_id).length,
    };
  }, [contacts]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createContact.mutateAsync({ name: name.trim(), email: email.trim() || undefined });
      toast.success(
        email.trim()
          ? "Contact added — they'll appear in your list if they join with the same email"
          : "Contact added"
      );
      setName("");
      setEmail("");
      setShowForm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add contact");
    }
  };

  return (
    <div className="animate-fade-in space-y-8 pb-20 md:pb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold text-primary">Contacts</h1>
              <p className="mt-1 text-muted-foreground">People in your lending circle</p>
            </div>
            <Button onClick={() => setShowForm(!showForm)} className="gap-2 rounded-xl">
              <UserPlus className="size-4" />
              Add contact
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className="flex h-36 flex-col justify-between rounded-3xl bg-primary p-6 text-primary-foreground">
              <Users className="size-6 opacity-80" />
              <div>
                <p className="font-heading text-4xl font-bold">{heroStats.total}</p>
                <p className="text-sm uppercase tracking-wide opacity-80">Total contacts</p>
              </div>
            </div>
            <div className="flex h-36 flex-col justify-between rounded-3xl border border-border bg-card p-6">
              <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Verified neighbors
              </p>
              <p className="font-heading text-4xl font-bold text-primary">{heroStats.verified}</p>
            </div>
            <div className="flex h-36 flex-col justify-between rounded-3xl bg-secondary/30 p-6">
              <p className="text-sm font-medium uppercase tracking-wide text-secondary-foreground">
                Trust scores
              </p>
              <p className="text-sm text-secondary-foreground">
                Based on completed loans only — view each contact for details
              </p>
            </div>
          </div>

          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="cursor-text rounded-xl pl-9"
            />
          </div>

          {showForm && (
            <div className="max-w-lg rounded-3xl border border-border bg-card p-6">
              <h3 className="font-heading mb-4 text-lg font-semibold">New contact</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    required
                    placeholder="e.g. Ahmed (neighbor)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="their@email.com"
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
          ) : isError ? (
            <QueryErrorState onRetry={() => refetch()} />
          ) : !contacts?.length ? (
            <EmptyState
              message="No contacts yet. Add someone you lend to or borrow from."
              onAction={() => setShowForm(true)}
              actionLabel="Add contact"
            />
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="flex min-h-[320px] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary/40 hover:bg-muted/30"
                >
                  <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
                    <UserPlus className="size-7 text-primary" />
                  </div>
                  <span className="font-heading text-lg font-semibold">Add contact</span>
                  <p className="mt-1 text-sm text-muted-foreground">Connect with neighbors</p>
                </button>

              {filtered.length === 0 && search.trim() ? (
                <p className="col-span-full py-8 text-center text-muted-foreground">
                  No contacts match &ldquo;{search.trim()}&rdquo;
                </p>
              ) : (
                paginated?.data.map((contact) => (
                  <ContactGridCard
                    key={contact.id}
                    id={contact.id}
                    name={contact.name}
                    email={contact.email}
                    phone={contact.phone}
                    isVerified={!!contact.linked_user_id}
                  />
                ))
              )}
              </div>

              {paginated && paginated.totalPages > 1 && (
                <Pagination
                  page={paginated.page}
                  totalPages={paginated.totalPages}
                  total={paginated.total}
                  pageSize={PAGE_SIZE}
                  onPageChange={setPage}
                />
              )}
            </>
          )}
        </div>
  );
}

export default function ContactsPage() {
  return (
    <AuthGuard>
      <AppShell>
        <ContactsPageContent />
      </AppShell>
    </AuthGuard>
  );
}
