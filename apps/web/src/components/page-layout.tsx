import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronRight, Lock, Shield, ShieldCheck } from "lucide-react";
import type { ContactTrust, Item } from "@lendtrack/shared-types";
import { ItemThumbnail } from "@/components/ItemThumbnail";
import { formatAppDate } from "@/lib/format-date";
import { contactHasTrustScore, contactTrustScore } from "@/lib/contact-trust";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  active: "bg-brand-green-light/50 text-brand-green",
  overdue: "bg-red-100 text-destructive dark:bg-red-950/40",
  returned: "bg-muted text-muted-foreground",
  lost: "bg-muted text-muted-foreground",
};

const statusHints: Record<string, string> = {
  active: "Loan is still open",
  overdue: "Past due date, not yet returned",
  returned: "Item was returned",
  lost: "Item was not returned and marked as lost or unrecoverable",
};

export function StatusBadge({ status }: { status: string }) {
  const hint = statusHints[status];
  return (
    <span
      title={hint}
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        statusStyles[status] ?? "bg-muted text-muted-foreground"
      )}
    >
      {status}
    </span>
  );
}

export function LockedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold text-muted-foreground">
      <Lock className="size-3" />
      Locked
    </span>
  );
}

export function AnalyticsStat({
  label,
  value,
  hint,
  variant = "default",
  icon,
}: {
  label: string;
  value: number | string;
  hint?: string;
  variant?: "default" | "success" | "warning" | "danger";
  icon?: React.ReactNode;
}) {
  const variants = {
    default: "border-border/60 bg-card",
    success: "border-primary/30 bg-primary/5",
    warning: "border-amber-500/30 bg-amber-500/5",
    danger: "border-destructive/30 bg-destructive/5",
  };

  return (
    <div className={cn("rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md", variants[variant])}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
        {icon}
      </div>
      <p className="font-heading text-3xl font-bold tracking-tight md:text-4xl">{value}</p>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function TrustScoreCard({ trust, loading }: { trust?: ContactTrust | null; loading?: boolean }) {
  if (loading) {
    return <div className="h-48 animate-pulse rounded-xl bg-muted" />;
  }
  if (!trust) return null;

  const hasScore = contactHasTrustScore(trust);
  const score = contactTrustScore(trust) ?? 0;

  const scoreColor = !hasScore
    ? "text-muted-foreground"
    : score >= 85
      ? "text-primary"
      : score >= 70
        ? "text-emerald-600 dark:text-emerald-400"
        : score >= 50
          ? "text-amber-600 dark:text-amber-400"
          : "text-destructive";

  const barColor = !hasScore
    ? "bg-muted-foreground/30"
    : score >= 85
      ? "bg-primary"
      : score >= 70
        ? "bg-emerald-500"
        : score >= 50
          ? "bg-amber-500"
          : "bg-destructive";

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-heading text-lg font-semibold">
            <Shield className="size-5 text-primary" />
            Trust score
          </h3>
          <p className="text-sm text-muted-foreground">
            Based on completed loans only — returned, overdue, or lost. Active loans are not scored.
          </p>
        </div>
        {trust.is_verified_neighbor && (
          <span className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <ShieldCheck className="size-3.5" />
            Verified
          </span>
        )}
      </div>

      {hasScore ? (
        <>
          <div className="flex items-end gap-4">
            <span className={cn("font-heading text-5xl font-semibold", scoreColor)}>{score}</span>
            <span className="mb-2 text-lg font-medium text-muted-foreground">/ 100 · {trust.rating_label}</span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full transition-all duration-700", barColor)}
              style={{ width: `${score}%` }}
            />
          </div>
        </>
      ) : (
        <div className="rounded-lg bg-muted/50 px-4 py-6 text-center">
          <p className="font-medium text-muted-foreground">No history yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Score appears after a loan is returned, marked overdue, or lost.
          </p>
        </div>
      )}

      <div className="mt-5 grid grid-cols-3 gap-x-5 gap-y-4 text-sm sm:grid-cols-6">
        <div className="min-w-[4.5rem]">
          <span className="block whitespace-nowrap text-xs text-muted-foreground sm:text-sm">Completed</span>
          <p className="font-semibold">{trust.completed_loans ?? 0}</p>
        </div>
        <div className="min-w-[4.5rem]">
          <span className="block whitespace-nowrap text-xs text-muted-foreground sm:text-sm">On time</span>
          <p className="font-semibold">{trust.returned_on_time}</p>
        </div>
        <div className="min-w-[4.5rem]">
          <span className="block whitespace-nowrap text-xs text-muted-foreground sm:text-sm">Returned late</span>
          <p className="font-semibold">{trust.returned_late ?? 0}</p>
        </div>
        <div className="min-w-[4.5rem]">
          <span className="block whitespace-nowrap text-xs text-muted-foreground sm:text-sm">Overdue</span>
          <p className="font-semibold">{trust.overdue}</p>
        </div>
        <div className="min-w-[4.5rem]" title="Item was not returned and marked as lost or unrecoverable">
          <span className="block whitespace-nowrap text-xs text-muted-foreground sm:text-sm">Lost</span>
          <p className="font-semibold">{trust.lost}</p>
        </div>
        <div className="min-w-[4.5rem]" title="Open loans — shown for context, not included in score">
          <span className="block whitespace-nowrap text-xs text-muted-foreground sm:text-sm">In progress</span>
          <p className="font-semibold">{trust.active ?? 0}</p>
        </div>
      </div>
    </div>
  );
}

const directionStyles: Record<string, string> = {
  lent_out: "bg-brand-green-light text-brand-green",
  borrowed: "bg-secondary/30 text-secondary-foreground",
};

export function DirectionBadge({ direction }: { direction: string }) {
  const label = direction === "lent_out" ? "Lent out" : "Borrowed";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold",
        directionStyles[direction] ?? "bg-surface-container text-on-surface-variant"
      )}
    >
      {label}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  action,
  subtitle,
}: {
  title: string;
  description?: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm font-medium text-primary">{subtitle}</p>
        )}
        {description && (
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: number | string;
  variant?: "default" | "error" | "primary-container";
}) {
  const variants = {
    default: "border-outline-variant/20 bg-surface-container-low text-primary",
    error: "border-outline-variant/20 bg-surface-container-low text-error",
    "primary-container": "border-primary/20 bg-primary-container text-on-primary-container",
  };

  return (
    <div
      className={cn(
        "card-elevation rounded-xl border p-4",
        variants[variant]
      )}
    >
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-on-surface-variant">
        {label}
      </span>
      <div className="flex items-baseline gap-2">
        <span className="font-heading text-2xl font-semibold">{value}</span>
        {variant === "default" && (
          <span className="size-2 animate-pulse rounded-full bg-primary" />
        )}
        {variant === "error" && value !== 0 && value !== "0" && (
          <span className="size-2 rounded-full bg-error" />
        )}
      </div>
    </div>
  );
}

export function LoanCard({
  href,
  itemName,
  item,
  contactName,
  direction,
  dueDate,
  status,
  isLocked = false,
  variant = "card",
}: {
  href: string;
  itemName: string;
  item?: Pick<Item, "name" | "photo_url" | "category"> | null;
  contactName: string;
  direction: string;
  dueDate: string;
  status: string;
  isLocked?: boolean;
  variant?: "card" | "list";
}) {
  const isOverdue = status === "overdue";
  const directionLabel = direction === "lent_out" ? "Lent to" : "Borrowed from";

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-4 p-4 transition-colors hover:bg-muted/40 active:scale-[0.99]",
        variant === "card" && "rounded-2xl border border-border bg-card shadow-sm hover:border-primary/30 hover:shadow-md",
        variant === "list" && status === "overdue" && "bg-red-50/50 dark:bg-red-950/20",
        isLocked && "opacity-60"
      )}
    >
      <ItemThumbnail
        name={item?.name ?? itemName}
        photoUrl={item?.photo_url}
        category={item?.category}
        size="md"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-base font-semibold">{itemName}</h3>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
            {isLocked && <LockedBadge />}
            <DirectionBadge direction={direction} />
            <StatusBadge status={status} />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {directionLabel} {contactName} ·{" "}
          <span className={cn(isOverdue && "font-medium text-destructive")}>
            Due {formatAppDate(dueDate)}
          </span>
        </p>
      </div>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
    </Link>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  message,
  href,
  linkLabel,
  onAction,
  actionLabel,
}: {
  icon?: LucideIcon;
  title?: string;
  message: string;
  href?: string;
  linkLabel?: string;
  onAction?: () => void;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center shadow-sm">
      {Icon && (
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-7" />
        </div>
      )}
      {title && <h3 className="text-lg font-semibold">{title}</h3>}
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{message}</p>
      {onAction && actionLabel && (
        <Button type="button" onClick={onAction} className="mt-6 rounded-lg">
          {actionLabel}
        </Button>
      )}
      {!onAction && href && linkLabel && (
        <Link href={href} className={cn(buttonVariants(), "mt-6 rounded-lg")}>
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-56 animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-28 animate-pulse rounded-xl bg-muted" />
        <div className="h-28 animate-pulse rounded-xl bg-muted" />
      </div>
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}

export function DirectionToggle({
  value,
  onChange,
}: {
  value: "lent_out" | "borrowed";
  onChange: (v: "lent_out" | "borrowed") => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-muted/50 p-1">
      <button
        type="button"
        onClick={() => onChange("lent_out")}
        aria-pressed={value === "lent_out"}
        className={cn(
          "cursor-pointer rounded-lg py-2.5 text-sm font-semibold transition-all active:scale-95",
          value === "lent_out"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-background/80"
        )}
      >
        Lent out
      </button>
      <button
        type="button"
        onClick={() => onChange("borrowed")}
        aria-pressed={value === "borrowed"}
        className={cn(
          "cursor-pointer rounded-lg py-2.5 text-sm font-semibold transition-all active:scale-95",
          value === "borrowed"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-background/80"
        )}
      >
        Borrowed
      </button>
    </div>
  );
}
