"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Handshake,
  Lock,
  Package,
  RefreshCw,
  Sparkles,
  TriangleAlert,
  Wallet,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Button, buttonVariants } from "@/components/ui/button";
import { useNewLoanDialog } from "@/components/loans/NewLoanDialogProvider";
import { formatAppDate } from "@/lib/format-date";
import { localDateString } from "@/lib/loan-sync";
import type { LoanWithRelations } from "@lendtrack/shared-types";

export function DashboardWelcome({
  name,
  dueCount,
  activeCount,
  overdueCount,
}: {
  name: string;
  dueCount: number;
  activeCount: number;
  overdueCount: number;
}) {
  const { openNewLoan } = useNewLoanDialog();

  return (
    <div className="hero-gradient relative overflow-hidden rounded-2xl p-6 text-white shadow-lg shadow-primary/20 md:p-8">
      <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 right-1/4 size-48 rounded-full bg-secondary/20 blur-2xl" />

      <div className="relative z-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/70">Welcome back</p>
        <h1 className="mt-2 text-2xl font-semibold md:text-3xl">
          Hello, {name} <span aria-hidden>👋</span>
        </h1>
        <p className="mt-2 max-w-lg text-sm text-white/85 md:text-base">
          {dueCount > 0
            ? `You have ${dueCount} item${dueCount === 1 ? "" : "s"} due this week.`
            : activeCount > 0
              ? "You're all caught up for the next 7 days."
              : "Record your first loan to start tracking."}
        </p>

        <div className="mt-6 grid grid-cols-3 gap-3 md:max-w-lg">
          <div className="rounded-xl bg-white/10 px-3 py-3 backdrop-blur-sm">
            <p className="text-[10px] font-medium uppercase tracking-wide text-white/70">Active</p>
            <p className="mt-1 text-2xl font-semibold">
              <AnimatedNumber value={activeCount} />
            </p>
            <p className="text-[10px] text-emerald-200">In progress</p>
          </div>
          <div className="rounded-xl bg-white/10 px-3 py-3 backdrop-blur-sm">
            <p className="text-[10px] font-medium uppercase tracking-wide text-white/70">Due soon</p>
            <p className="mt-1 text-2xl font-semibold">
              <AnimatedNumber value={dueCount} />
            </p>
            <p className="text-[10px] text-white/70">Next 7 days</p>
          </div>
          <div className="rounded-xl bg-white/10 px-3 py-3 backdrop-blur-sm">
            <p className="text-[10px] font-medium uppercase tracking-wide text-white/70">Overdue</p>
            <p className={cn("mt-1 text-2xl font-semibold", overdueCount > 0 && "text-red-200")}>
              <AnimatedNumber value={overdueCount} />
            </p>
            <p className="text-[10px] text-white/70">Needs action</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => openNewLoan()}
            className="rounded-lg bg-white font-semibold text-primary hover:bg-white/90"
          >
            New loan
          </Button>
          <Link
            href="/contacts"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "rounded-lg border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            )}
          >
            Add contact
          </Link>
        </div>
      </div>
    </div>
  );
}

function loanDueKey(loan: LoanWithRelations): string {
  const raw = loan.expected_return_at;
  return raw?.includes("T") ? raw.slice(0, 10) : raw;
}

export function DashboardWeekStrip({ loans }: { loans: LoanWithRelations[] }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const todayKey = localDateString();

  const days = useMemo(() => {
    const weekStart = new Date();
    weekStart.setHours(12, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() + weekOffset * 7);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const key = localDateString(d);
      const dayLoans = loans.filter((l) => loanDueKey(l) === key);
      return {
        key,
        label: d.toLocaleDateString("en-US", { weekday: "short" }),
        dayNum: d.getDate(),
        count: dayLoans.length,
        isToday: key === todayKey,
        hasOverdue: dayLoans.some((l) => l.status === "overdue"),
        loans: dayLoans,
      };
    });
  }, [loans, weekOffset, todayKey]);

  const activeKey = selectedKey ?? (days.some((d) => d.isToday) ? todayKey : days[0]?.key ?? null);
  const selectedDay = days.find((d) => d.key === activeKey);

  const rangeLabel =
    days.length >= 2
      ? `${days[0].label} ${days[0].dayNum} – ${days[6].label} ${days[6].dayNum}`
      : "This week";

  return (
    <div className="pro-card p-5 md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="font-heading text-xl font-semibold">{rangeLabel}</h2>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => {
                setWeekOffset((w) => w - 1);
                setSelectedKey(null);
              }}
              className="rounded-full p-1 text-primary transition-colors hover:bg-surface-container"
              aria-label="Previous week"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setWeekOffset((w) => w + 1);
                setSelectedKey(null);
              }}
              className="rounded-full p-1 text-primary transition-colors hover:bg-surface-container"
              aria-label="Next week"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {weekOffset !== 0 && (
            <button
              type="button"
              onClick={() => {
                setWeekOffset(0);
                setSelectedKey(null);
              }}
              className="text-xs font-medium text-primary hover:underline"
            >
              Today
            </button>
          )}
          <span className="flex items-center gap-1 rounded-lg bg-surface-container px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <Calendar className="size-3.5" />
            Week
          </span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center">
        {days.map((d) => {
          const isSelected = d.key === activeKey;
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => setSelectedKey(d.key)}
              className={cn(
                "flex cursor-pointer flex-col gap-1 rounded-xl py-2 transition-all",
                isSelected && "border border-primary/30 bg-primary-fixed/25 text-primary shadow-sm",
                !isSelected && d.isToday && "border border-destructive/20 bg-error-container/30 text-destructive",
                !isSelected && !d.isToday && d.count === 0 && "opacity-60 hover:bg-surface-container-low",
                !isSelected && !d.isToday && d.count > 0 && "hover:bg-surface-container-low"
              )}
            >
              <span className="text-xs font-medium">{d.label}</span>
              <span className="font-heading text-xl font-semibold">{d.dayNum}</span>
              <span
                className={cn(
                  "mx-auto min-w-6 rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none",
                  d.count === 0 && "bg-surface-container text-muted-foreground",
                  d.count > 0 && !d.hasOverdue && "bg-secondary-container/30 text-secondary",
                  d.hasOverdue && "bg-error-container text-destructive"
                )}
              >
                {d.count}
              </span>
            </button>
          );
        })}
      </div>

      {selectedDay && (
        <div className="mt-4 rounded-xl border border-outline-variant/30 bg-surface-container-low p-4">
          <p className="mb-3 text-sm font-semibold">
            {selectedDay.isToday ? "Today" : formatAppDate(selectedDay.key)}
            {selectedDay.count > 0
              ? ` · ${selectedDay.count} loan${selectedDay.count === 1 ? "" : "s"} due`
              : " · No loans due"}
          </p>
          {selectedDay.loans.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing scheduled for this day.</p>
          ) : (
            <ul className="space-y-2">
              {selectedDay.loans.map((loan) => (
                <li key={loan.id}>
                  <Link
                    href={`/loans/${loan.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg bg-surface-container-lowest px-3 py-2 text-sm transition-colors hover:bg-surface-container-high"
                  >
                    <span className="min-w-0 truncate font-medium">{loan.item?.name ?? "Item"}</span>
                    <span
                      className={cn(
                        "shrink-0 text-xs font-semibold",
                        loan.status === "overdue" ? "text-destructive" : "text-muted-foreground"
                      )}
                    >
                      {loan.contact?.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export function DashboardPerformanceCards({
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
  const cards = [
    {
      label: "Active loans",
      value: active,
      icon: Wallet,
      iconBg: "bg-secondary-fixed text-on-secondary",
      badge: "In progress",
      badgeClass: "bg-secondary text-white",
    },
    {
      label: "Returned",
      value: returned,
      icon: Package,
      iconBg: "bg-primary-fixed text-primary",
      badge: null,
      badgeClass: "",
    },
    {
      label: "Locked",
      value: locked,
      icon: Lock,
      iconBg: "bg-muted text-muted-foreground",
      badge: locked > 0 ? "Free plan" : null,
      badgeClass: "bg-muted-foreground/20 text-muted-foreground",
    },
    {
      label: "Overdue",
      value: overdue,
      icon: TriangleAlert,
      iconBg: "bg-error-container text-destructive",
      badge: overdue > 0 ? "Needs action" : null,
      badgeClass: "bg-destructive text-white",
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-xl font-semibold">Loan overview</h2>
        <Link href="/loans" className="text-sm font-medium text-primary hover:underline">
          See all
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className="pro-card-hover flex flex-col items-center gap-3 p-5 text-center"
            >
              <div className={cn("flex size-12 items-center justify-center rounded-lg", c.iconBg)}>
                <Icon className="size-5" />
              </div>
              <p className="text-xs font-medium text-outline">{c.label}</p>
              <p className="font-heading text-2xl font-bold">{c.value}</p>
              {c.badge && (
                <span className={cn("rounded-full px-3 py-0.5 text-[10px] font-bold", c.badgeClass)}>
                  {c.badge}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {locked > 0 && (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="size-4" />
          {locked} locked loan{locked === 1 ? "" : "s"} on Free plan —{" "}
          <Link href="/settings/billing" className="font-medium text-primary hover:underline">
            upgrade
          </Link>
        </p>
      )}
    </div>
  );
}

export function DashboardRecentActivity({
  loans,
}: {
  loans: LoanWithRelations[];
}) {
  const recent = loans.slice(0, 4);

  return (
    <div className="pro-card rounded-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-heading text-lg font-semibold">Due soon</h3>
        <Link href="/loans" className="text-sm font-medium text-primary hover:underline">
          View all
        </Link>
      </div>
      {recent.length === 0 ? (
        <div className="rounded-xl border border-dashed border-outline-variant/50 bg-surface-container-low px-4 py-5">
          <p className="text-sm font-medium text-foreground">No upcoming returns this week</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Add a loan with an expected return date to see it here.
          </p>
          <div className="mt-3 flex items-center gap-3 text-xs">
            <Link href="/loans" className="font-semibold text-primary hover:underline">
              Add loan
            </Link>
            <Link href="/contacts" className="font-semibold text-muted-foreground hover:text-foreground hover:underline">
              Add contact
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {recent.map((loan) => {
            const isOverdue = loan.status === "overdue";
            return (
              <Link
                key={loan.id}
                href={`/loans/${loan.id}`}
                className="flex items-center gap-3 rounded-lg p-1 transition-colors hover:bg-surface-container-low"
              >
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full",
                    isOverdue ? "bg-error-container text-destructive" : "bg-secondary-fixed text-secondary"
                  )}
                >
                  {isOverdue ? (
                    <TriangleAlert className="size-4" />
                  ) : (
                    <RefreshCw className="size-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{loan.item?.name ?? "Item"}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {loan.contact?.name} · {formatAppDate(loan.expected_return_at)}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 text-xs font-medium",
                    isOverdue ? "text-destructive" : "text-muted-foreground"
                  )}
                >
                  {isOverdue ? "Overdue" : "Due"}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function DashboardQuickActions() {
  return (
    <div className="pro-card rounded-3xl bg-surface-container p-6">
      <h3 className="font-heading mb-4 text-lg font-semibold">Quick actions</h3>
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/contacts"
          className="pro-card flex flex-col gap-3 p-4 transition-colors hover:bg-surface-container-low"
        >
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary-fixed/30 text-primary">
            <Users className="size-5" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">Add contact</span>
        </Link>
        <Link
          href="/loans"
          className="pro-card flex flex-col gap-3 p-4 transition-colors hover:bg-surface-container-low"
        >
          <div className="flex size-10 items-center justify-center rounded-lg bg-secondary-container/20 text-secondary">
            <Wallet className="size-5" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">View loans</span>
        </Link>
      </div>
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
        <div key={t.label} className="pro-card flex flex-col items-center p-4">
          <span className={cn("font-heading text-2xl font-bold", t.className)}>{t.value}</span>
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
    <div className="pro-card p-6">
      <h3 className="font-heading mb-4 text-lg font-semibold">Status breakdown</h3>
      <div className="mb-4 flex h-3 overflow-hidden rounded-full bg-surface-container">
        {segments.map((s) =>
          s.value > 0 ? (
            <div
              key={s.label}
              className={cn("h-full", s.color)}
              style={{ width: `${(s.value / total) * 100}%` }}
            />
          ) : null
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {segments.map((s) => (
          <div key={s.label} className="rounded-lg bg-surface-container-low px-2 py-2 text-center">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="font-heading text-xl font-bold">{s.value}</p>
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

  return (
    <div className="pro-card p-6">
      <h3 className="font-heading mb-4 text-lg font-semibold">Lent vs borrowed</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-brand-green-light/15 p-4">
          <p className="text-sm font-medium text-brand-green">Lent out</p>
          <p className="font-heading text-3xl font-bold">{lentOut}</p>
          <div className="mt-2 h-1.5 rounded-full bg-surface-container">
            <div className="h-full rounded-full bg-brand-green" style={{ width: `${lentPct}%` }} />
          </div>
        </div>
        <div className="rounded-xl bg-secondary-fixed/30 p-4">
          <p className="text-sm font-medium text-secondary">Borrowed</p>
          <p className="font-heading text-3xl font-bold">{borrowed}</p>
          <div className="mt-2 h-1.5 rounded-full bg-surface-container">
            <div className="h-full rounded-full bg-secondary-container" style={{ width: `${100 - lentPct}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardUpgradeCard({ isPremium }: { isPremium: boolean }) {
  if (isPremium) {
    return (
      <div className="pro-card p-6">
        <Sparkles className="mb-2 size-5 text-primary" />
        <h3 className="font-heading text-lg font-semibold">Premium active</h3>
        <p className="mt-1 text-sm text-muted-foreground">Unlimited loans and full access.</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground card-shadow">
      <h3 className="font-heading text-lg font-semibold">Upgrade to Premium</h3>
      <p className="mt-1 text-sm opacity-80">Unlimited active loans, weekly digest, CSV export.</p>
      <Link
        href="/settings/billing"
        className={cn(
          buttonVariants({ variant: "secondary", size: "sm" }),
          "mt-4 w-full gap-1 rounded-lg"
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
    <div className="pro-card rounded-3xl p-6">
      <h3 className="font-heading text-lg font-semibold">Top contacts</h3>
      <p className="mb-4 text-xs text-muted-foreground">By trust score and loan history</p>
      <div className="space-y-4">
        {contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Add contacts with loan history to see rankings.</p>
        ) : (
          contacts.map((c) => (
            <Link key={c.id} href={`/contacts/${c.id}`} className="flex items-center gap-3 group">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-container text-sm font-semibold text-primary">
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-end justify-between gap-2">
                  <p className="truncate text-sm font-semibold group-hover:text-primary">{c.name}</p>
                  <span className="text-xs font-bold text-brand-green">
                    {c.score > 0 ? `${c.score}/100` : "—"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {c.loans} loan{c.loans === 1 ? "" : "s"}
                </p>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-container">
                  <div
                    className="h-full rounded-full bg-brand-green-light"
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
  totalItems,
}: {
  active: number;
  overdue: number;
  returned: number;
  locked: number;
  totalItems?: number;
}) {
  const onTimePct =
    returned + overdue > 0 ? Math.round((returned / (returned + overdue)) * 100) : 100;

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 flex h-36 flex-col justify-between rounded-xl bg-secondary p-6 text-on-secondary card-shadow lg:col-span-4">
        <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase">
          At a glance
        </span>
        <div>
          <h2 className="font-heading text-2xl font-semibold">
            {overdue > 0 ? `${overdue} need attention` : "All caught up"}
          </h2>
          <p className="mt-1 text-sm opacity-90">
            {onTimePct}% of completed loans returned on time
          </p>
        </div>
      </div>
      <div className="pro-card col-span-6 flex flex-col justify-between p-5 lg:col-span-2">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Package className="size-5" />
        </div>
        <div>
          <p className="font-heading text-3xl font-bold">{totalItems ?? active + returned}</p>
          <p className="text-xs text-muted-foreground">Total tracked</p>
        </div>
      </div>
      <div className="pro-card col-span-6 flex flex-col justify-between p-5 lg:col-span-2">
        <div className="flex size-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
          <RefreshCw className="size-5" />
        </div>
        <div>
          <p className="font-heading text-3xl font-bold">{active}</p>
          <p className="text-xs text-muted-foreground">Active</p>
        </div>
      </div>
      <div className="pro-card col-span-12 flex flex-col justify-between p-5 lg:col-span-4">
        <p className="text-sm font-medium text-muted-foreground">Loan health</p>
        <div className="mt-2 flex items-end gap-4">
          <div>
            <p className="font-heading text-3xl font-bold text-destructive">{overdue}</p>
            <p className="text-xs text-muted-foreground">Overdue</p>
          </div>
          <div>
            <p className="font-heading text-3xl font-bold text-brand-green">{returned}</p>
            <p className="text-xs text-muted-foreground">Returned</p>
          </div>
          {locked > 0 && (
            <div>
              <p className="font-heading text-3xl font-bold">{locked}</p>
              <p className="text-xs text-muted-foreground">Locked</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
