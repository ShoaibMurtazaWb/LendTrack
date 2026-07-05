"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { PageHeader } from "@/components/ui";
import { useContacts } from "@/hooks/useContacts";
import { useCreateItem, useItems } from "@/hooks/useItems";
import { useCreateLoan } from "@/hooks/useLoans";

export default function NewLoanPage() {
  const router = useRouter();
  const { data: contacts } = useContacts();
  const { data: items } = useItems();
  const createItem = useCreateItem();
  const createLoan = useCreateLoan();

  const [itemId, setItemId] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [contactId, setContactId] = useState("");
  const [direction, setDirection] = useState<"lent_out" | "borrowed">("lent_out");
  const [loanedAt, setLoanedAt] = useState(new Date().toISOString().split("T")[0]);
  const [expectedReturnAt, setExpectedReturnAt] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      let resolvedItemId = itemId;

      if (!resolvedItemId && newItemName) {
        const item = await createItem.mutateAsync({ name: newItemName });
        resolvedItemId = item.id;
      }

      if (!resolvedItemId || !contactId) {
        setError("Please select or create an item and a contact.");
        return;
      }

      await createLoan.mutateAsync({
        item_id: resolvedItemId,
        contact_id: contactId,
        direction,
        loaned_at: loanedAt,
        expected_return_at: expectedReturnAt,
        notes: notes || undefined,
      });

      router.push("/loans");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create loan");
    }
  };

  return (
    <AuthGuard>
      <AppShell>
        <PageHeader title="New loan" description="Record something you lent out or borrowed" />

        <form onSubmit={handleSubmit} className="max-w-lg space-y-4 rounded-xl border border-slate-200 bg-white p-6">
          <div>
            <label className="block text-sm font-medium text-slate-700">Item</label>
            <select
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">— Select existing item —</option>
              {items?.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Or enter new item name"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Contact</label>
            <select
              required
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">— Select contact —</option>
              {contacts?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Direction</label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as "lent_out" | "borrowed")}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="lent_out">Lent out (I gave it to someone)</option>
              <option value="borrowed">Borrowed (someone gave it to me)</option>
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Loaned on</label>
              <input
                type="date"
                required
                value={loanedAt}
                onChange={(e) => setLoanedAt(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Expected return</label>
              <input
                type="date"
                required
                value={expectedReturnAt}
                onChange={(e) => setExpectedReturnAt(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={createLoan.isPending || createItem.isPending}
            className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {createLoan.isPending ? "Creating..." : "Create loan"}
          </button>
        </form>
      </AppShell>
    </AuthGuard>
  );
}
