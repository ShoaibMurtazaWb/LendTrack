"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, CheckCircle2, Handshake, Lock, RefreshCw, Sparkles, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { useNewLoanDialog } from "@/components/loans/NewLoanDialogProvider";

export function DashboardWelcome({
  name,
  dueCount,
}: {
  name: string;
  dueCount: number;
}) {
  const { openNewLoan } = useNewLoanDialog();

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-secondary to-[#ff8c00] p-8 text-white md:p-10">
      <div className="relative z-10">
        <h1 className="font-heading text-3xl font-bold md:text-4xl">Hello, {name}!</h1>
        <p className="mt-2 text-base opacity-90">
          {dueCount > 0
            ? `You have ${dueCount} item${dueCount === 1 ? "" : "s"} due this week`
            : "No items due this week — you're all caught up"}
        </p>
        <Button
          type="button"
          variant="secondary"
          onClick={() => openNewLoan()}
          className="mt-6 gap-2 rounded-xl bg-white text-secondary hover:bg-white/90"
        >
          New loan
        </Button>
      </div>
      <Handshake className="pointer-events-none absolute -bottom-8 -right-8 size-48 opacity-15" />
    </div>
  );
}

export function DashboardMetricTiles({
  active,
  overdue,
  returned,
}: {
  active: number;
  overdue: number;
  returned: number;
}) {
  const tiles = [
    { label: "Active", value: active, className: "text-primary" },
    { label: "Overdue", value: overdue, className: overdue > 0 ? "text-destructive" : "" },
    { label: "Returned", value: returned, className: "text-brand-green" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {tiles.map((t) => (
        <div
          key={t.label}
          className="bento-card flex flex-col items-center rounded-3xl border border-border bg-card p-5"
        >
          <span className={cn("font-heading text-3xl font-bold", t.className)}>{t.value}</span>
          <span className="mt-1 text-xs font-medium text-muted-foreground">{t.label}</span>
        </div>
      ))}
    </div>
  );
}

export function DashboardActivityChart({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="bento-card rounded-3xl border border-border bg-card p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="font-heading text-xl font-semibold">Due this week</h3>
          <p className="text-sm text-muted-foreground">Hover a day to see count</p>
        </div>
        <Link href="/loans" className="text-sm font-medium text-primary hover:underline">
          View all
        </Link>
      </div>

      <div className="flex h-40 items-end justify-between gap-2 px-2">
        {data.map((d, i) => {
          const height = Math.max((d.value / max) * 100, d.value > 0 ? 12 : 6);
          const isHovered = hovered === i;
          return (
            <button
              key={d.label}
              type="button"
              className="group relative flex flex-1 flex-col items-center gap-2"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              aria-label={`${d.label}: ${d.value} due`}
            >
              {isHovered && (
                <span className="absolute -top-8 z-10 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[10px] font-medium text-background shadow-sm">
                  {d.value} due
                </span>
              )}
              <div
                className={cn(
                  "w-full max-w-10 rounded-t-lg transition-all duration-200",
                  isHovered ? "bg-primary" : d.value > 0 ? "bg-primary/40" : "bg-muted"
                )}
                style={{ height: `${height}%` }}
              />
              <span
                className={cn(
                  "text-[10px] font-semibold uppercase",
                  isHovered ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {d.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DashboardUpgradeCard({ isPremium }: { isPremium: boolean }) {
  if (isPremium) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6">
        <Sparkles className="mb-2 size-5 text-primary" />
        <h3 className="font-heading text-lg font-semibold">Premium active</h3>
        <p className="mt-1 text-sm text-muted-foreground">Unlimited loans and full access.</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground">
      <h3 className="font-heading text-lg font-semibold">Upgrade to Premium</h3>
      <p className="mt-1 text-sm opacity-80">Unlimited active loans, no locks.</p>
      <Link
        href="/settings/billing"
        className={cn(
          buttonVariants({ variant: "secondary", size: "sm" }),
          "mt-4 w-full gap-1 rounded-xl"
        )}
      >
        Get Premium
        <ArrowUpRight className="size-3.5" />
      </Link>
    </div>
  );
}

export function DashboardTopContacts({
  contacts,
}: {
  contacts: { id: string; name: string; score: number; loans: number }[];
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <h3 className="font-heading text-lg font-semibold">Top contacts</h3>
      <p className="mb-4 text-xs text-muted-foreground">By trust score (completed loans only)</p>
      <div className="space-y-4">
        {contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Add contacts with loan history to see rankings.</p>
        ) : (
          contacts.map((c) => (
            <Link key={c.id} href={`/contacts/${c.id}`} className="flex items-center gap-3 group">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-sm font-semibold text-primary">
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-end justify-between gap-2">
                  <p className="truncate text-sm font-semibold group-hover:text-primary">{c.name}</p>
                  <span className="text-xs font-bold text-brand-green">
                    {c.score > 0 ? `${c.score}/100` : "—"}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-brand-green-light transition-all"
                    style={{ width: c.score > 0 ? `${c.score}%` : "0%" }}
                  />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export function LoanStatBento({
  active,
  overdue,
  returned,
  locked,
}: {
  active: number;
  overdue: number;
  returned: number;
  locked: number;
}) {
  const stats = [
    { label: "Active", value: active, icon: RefreshCw, tone: "primary" as const },
    { label: "Overdue", value: overdue, icon: TriangleAlert, tone: "error" as const },
    { label: "Returned", value: returned, icon: CheckCircle2, tone: "green" as const },
    { label: "Locked", value: locked, icon: Lock, tone: "muted" as const },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div
            key={s.label}
            className="bento-card flex items-center gap-4 rounded-xl border border-border bg-card p-5"
          >
            <div
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-full",
                s.tone === "primary" && "bg-primary/10 text-primary",
                s.tone === "error" && "bg-red-100 text-destructive dark:bg-red-950/40",
                s.tone === "green" && "bg-brand-green-light/40 text-brand-green",
                s.tone === "muted" && "bg-muted text-muted-foreground"
              )}
            >
              <Icon className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">{s.label}</p>
              <p
                className={cn(
                  "font-heading text-2xl font-bold",
                  s.tone === "error" && s.value > 0 && "text-destructive"
                )}
              >
                {s.value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
