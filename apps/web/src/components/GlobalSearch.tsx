"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, User, Wallet } from "lucide-react";
import { useContacts } from "@/hooks/useContacts";
import { useLoans } from "@/hooks/useLoans";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ResultItem =
  | { type: "contact"; id: string; label: string; sub?: string; href: string }
  | { type: "loan"; id: string; label: string; sub?: string; href: string };

export function GlobalSearch({ className }: { className?: string }) {
  const router = useRouter();
  const { data: contacts } = useContacts();
  const { data: loans } = useLoans();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const items: ResultItem[] = [];

    contacts?.forEach((c) => {
      const haystack = `${c.name} ${c.email ?? ""} ${c.phone ?? ""}`.toLowerCase();
      if (haystack.includes(q)) {
        items.push({
          type: "contact",
          id: c.id,
          label: c.name,
          sub: c.email ?? undefined,
          href: `/contacts/${c.id}`,
        });
      }
    });

    loans?.forEach((loan) => {
      const itemName = loan.item?.name ?? "";
      const contactName = loan.contact?.name ?? "";
      const haystack = `${itemName} ${contactName} ${loan.notes ?? ""}`.toLowerCase();
      if (haystack.includes(q)) {
        items.push({
          type: "loan",
          id: loan.id,
          label: itemName || "Loan",
          sub: contactName,
          href: `/loans/${loan.id}`,
        });
      }
    });

    return items.slice(0, 8);
  }, [contacts, loans, query]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const navigate = (href: string) => {
    setOpen(false);
    setQuery("");
    setActiveIndex(-1);
    router.push(href);
  };

  const showDropdown = open && query.trim().length > 0;

  return (
    <div ref={ref} className={cn("relative w-full", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        role="combobox"
        aria-expanded={showDropdown}
        aria-autocomplete="list"
        placeholder="Search loans and contacts…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, results.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter" && activeIndex >= 0 && results[activeIndex]) {
            e.preventDefault();
            navigate(results[activeIndex].href);
          } else if (e.key === "Escape") {
            setOpen(false);
            setActiveIndex(-1);
          }
        }}
        className="h-10 cursor-text rounded-xl border-border bg-muted/50 pl-9"
      />

      {showDropdown && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">No matches found</p>
          ) : (
            <ul role="listbox" className="max-h-72 overflow-auto py-1">
              {results.map((item, index) => {
                const Icon = item.type === "contact" ? User : Wallet;
                return (
                  <li key={`${item.type}-${item.id}`} role="option" aria-selected={activeIndex === index}>
                    <button
                      type="button"
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-accent",
                        activeIndex === index && "bg-accent"
                      )}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => navigate(item.href)}
                    >
                      <Icon className="size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{item.label}</p>
                        {item.sub && (
                          <p className="truncate text-xs text-muted-foreground">{item.sub}</p>
                        )}
                      </div>
                      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {item.type}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
            <Link href="/contacts" className="cursor-pointer hover:text-foreground" onClick={() => setOpen(false)}>
              All contacts
            </Link>
            {" · "}
            <Link href="/loans" className="cursor-pointer hover:text-foreground" onClick={() => setOpen(false)}>
              All loans
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
