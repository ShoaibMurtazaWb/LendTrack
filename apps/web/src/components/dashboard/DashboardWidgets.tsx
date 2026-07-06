"use client";

import Link from "next/link";
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

export function DashboardStatusChart({
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
  const segments = [
    { label: "Active", value: active, color: "bg-primary" },
    { label: "Overdue", value: overdue, color: "bg-destructive" },
    { label: "Returned", value: returned, color: "bg-brand-green" },
    { label: "Locked", value: locked, color: "bg-muted-foreground/50" },
  ];
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;

  return (
    <div className="bento-card rounded-3xl border border-border bg-card p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="font-heading text-xl font-semibold">Loan status</h3>
          <p className="text-sm text-muted-foreground">All-time breakdown</p>
        </div>
        <Link href="/loans" className="text-sm font-medium text-primary hover:underline">
          View all
        </Link>
      </div>

      <div className="mb-6 flex h-4 overflow-hidden rounded-full bg-muted">
        {segments.map((s) =>
          s.value > 0 ? (
            <div
              key={s.label}
              className={cn("h-full transition-all", s.color)}
              style={{ width: `${(s.value / total) * 100}%` }}
              title={`${s.label}: ${s.value}`}
            />
          ) : null
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {segments.map((s) => (
          <div key={s.label} className="rounded-xl bg-muted/40 px-3 py-2.5 text-center">
            <div className="flex items-center justify-center gap-1.5">
              <span className={cn("size-2 rounded-full", s.color)} />
              <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
            </div>
            <p className="mt-1 font-heading text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardDirectionChart({
  lentOut,
  borrowed,
}: {
  lentOut: number;
  borrowed: number;
}) {
  const total = lentOut + borrowed || 1;
  const lentPct = Math.round((lentOut / total) * 100);
  const borrowedPct = 100 - lentPct;

  return (
    <div className="bento-card rounded-3xl border border-border bg-card p-6 md:p-8">
      <div className="mb-6">
        <h3 className="font-heading text-xl font-semibold">Lent vs borrowed</h3>
        <p className="text-sm text-muted-foreground">Active and overdue loans only</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-brand-green/20 bg-brand-green-light/20 p-5">
          <p className="text-sm font-semibold text-brand-green">Lent out</p>
          <p className="font-heading mt-1 text-3xl font-bold">{lentOut}</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-brand-green" style={{ width: `${lentPct}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{lentPct}% of open loans</p>
        </div>
        <div className="rounded-2xl border border-secondary/30 bg-secondary/15 p-5">
          <p className="text-sm font-semibold text-secondary-foreground">Borrowed</p>
          <p className="font-heading mt-1 text-3xl font-bold">{borrowed}</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-secondary" style={{ width: `${borrowedPct}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{borrowedPct}% of open loans</p>
        </div>
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
