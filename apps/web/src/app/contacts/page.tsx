"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { UserPlus, Users, Search, ShieldCheck, Wallet } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { ContactGridCard } from "@/components/LoanGridCard";
import { Pagination, paginateArray } from "@/components/Pagination";
import { EmptyState, PageSkeleton } from "@/components/page-layout";
import { QueryErrorState } from "@/components/QueryErrorState";
import { useContacts, useCreateContact, useContactsDirectoryStats } from "@/hooks/useContacts";
import { useLoans } from "@/hooks/useLoans";
import { assertNotSelfContact } from "@/lib/contact-validation";
import { countLoanStats } from "@/lib/loan-stats";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PAGE_SIZE = 8;

function ContactsPageContent() {
  const { user } = useAuth();
  const { data: contacts, isLoading, isError, refetch } = useContacts();
  const { data: loans } = useLoans();
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
  const allContactIds = useMemo(() => contacts?.map((c) => c.id) ?? [], [contacts]);
  const { data: contactStats } = useContactsDirectoryStats(allContactIds);

  const heroStats = useMemo(() => {
    if (!contacts) return { total: 0, verified: 0, activeLoans: 0, openLoans: 0 };
    const loanStats = countLoanStats(loans ?? []);
    return {
      total: contacts.length,
      verified: contacts.filter((c) => c.linked_user_id).length,
      activeLoans: loanStats.active,
      openLoans: loanStats.open,
    };
  }, [contacts, loans]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a contact name.");
      return;
    }
    try {
      assertNotSelfContact(user?.email, email.trim() || undefined);
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
    <div className="page-canvas animate-fade-in">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Your network</h1>
          <p className="mt-1 text-muted-foreground">People in your lending circle</p>
        </div>
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-outline" />
          <Input
            type="search"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="cursor-text rounded-full border-0 bg-surface-container pl-9 focus-visible:ring-primary"
          />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex items-center justify-between rounded-xl bg-primary p-6 text-primary-foreground card-shadow">
          <div>
            <p className="text-sm opacity-80">Total contacts</p>
            <p className="font-heading mt-1 text-4xl font-bold">{heroStats.total}</p>
          </div>
          <div className="rounded-full bg-primary-foreground/10 p-4">
            <Users className="size-8" />
          </div>
        </div>
        <div className="pro-card flex items-center justify-between p-6">
          <div>
            <p className="text-sm text-outline">Verified members</p>
            <p className="font-heading mt-1 text-4xl font-bold text-primary">{heroStats.verified}</p>
          </div>
          <div className="rounded-full bg-secondary-container/10 p-4 text-secondary">
            <ShieldCheck className="size-8" />
          </div>
        </div>
        <div className="pro-card flex items-center justify-between p-6">
          <div>
            <p className="text-sm text-outline">Active loans</p>
            <p className="font-heading mt-1 text-4xl font-bold text-brand-green">{heroStats.activeLoans}</p>
            {heroStats.openLoans > heroStats.activeLoans && (
              <p className="mt-1 text-xs text-muted-foreground">
                {heroStats.openLoans} open including overdue
              </p>
            )}
          </div>
          <div className="rounded-full bg-brand-green-light/20 p-4 text-brand-green">
            <Wallet className="size-8" />
          </div>
        </div>
      </div>

      {showForm && (
        <div className="pro-card mb-6 max-w-lg p-6">
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
              <Button type="submit" disabled={createContact.isPending} className="rounded-lg">
                Save contact
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                className="rounded-lg"
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
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-2xl font-semibold">Directory</h2>
            <Button onClick={() => setShowForm(true)} className="gap-2 rounded-lg">
              <UserPlus className="size-4" />
              Add contact
            </Button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="flex min-h-[320px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-outline-variant p-6 text-center transition-colors hover:border-primary hover:bg-primary-fixed/10"
            >
              <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-primary-fixed">
                <UserPlus className="size-7 text-primary" />
              </div>
              <span className="font-heading text-lg font-semibold">Add contact</span>
              <p className="mt-1 text-sm text-muted-foreground">Expand your lending network</p>
            </button>

            {filtered.length === 0 && search.trim() ? (
              <p className="col-span-full py-8 text-center text-muted-foreground">
                No contacts match &ldquo;{search.trim()}&rdquo;
              </p>
            ) : (
              paginated?.data.map((contact) => {
                const stats = contactStats?.get(contact.id);
                return (
                  <ContactGridCard
                    key={contact.id}
                    id={contact.id}
                    name={contact.name}
                    email={contact.email}
                    phone={contact.phone}
                    isVerified={!!contact.linked_user_id}
                    completedLoans={stats?.completedLoans}
                    activeLoans={stats?.openLoans}
                    trustScore={stats?.trustScore}
                    hasScore={stats?.hasScore}
                  />
                );
              })
            )}
          </div>

          {paginated && paginated.totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                page={paginated.page}
                totalPages={paginated.totalPages}
                total={paginated.total}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
              <p className="mt-2 text-center text-sm text-muted-foreground">
                Showing {paginated.data.length} of {paginated.total} contacts
              </p>
            </div>
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
