import Link from "next/link";
import { ChevronRight, Handshake } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  active: "bg-primary/10 text-primary",
  overdue: "bg-error/10 text-error",
  returned: "bg-secondary-container text-on-secondary-container",
  lost: "bg-surface-container text-on-surface-variant",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold capitalize",
        statusStyles[status] ?? "bg-surface-container text-on-surface-variant"
      )}
    >
      {status}
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
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-on-surface md:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm italic text-on-surface-variant">{subtitle}</p>
        )}
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
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
  contactName,
  direction,
  dueDate,
  status,
}: {
  href: string;
  itemName: string;
  contactName: string;
  direction: string;
  dueDate: string;
  status: string;
}) {
  const isOverdue = status === "overdue";
  const directionLabel = direction === "lent_out" ? "Lent to" : "Borrowed from";

  return (
    <Link
      href={href}
      className="card-elevation card-elevation-hover flex items-center gap-4 rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-4 transition-colors hover:border-primary/40 active:scale-[0.99]"
    >
      <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-primary">
        <Handshake className="size-6" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-semibold text-on-surface">{itemName}</h3>
          <StatusBadge status={status} />
        </div>
        <p className="text-sm text-on-surface-variant">
          {directionLabel} {contactName} ·{" "}
          <span className={cn(isOverdue && "font-medium text-error")}>Due {dueDate}</span>
        </p>
      </div>
      <ChevronRight className="size-5 shrink-0 text-outline-variant" />
    </Link>
  );
}

export function EmptyState({
  message,
  href,
  linkLabel,
}: {
  message: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low/30 px-6 py-14 text-center">
      <p className="mx-auto max-w-sm text-on-surface-variant">{message}</p>
      {href && linkLabel && (
        <Link
          href={href}
          className={cn(buttonVariants(), "mt-5 rounded-xl active:scale-95")}
        >
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-56 animate-pulse rounded-lg bg-surface-container" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-28 animate-pulse rounded-xl bg-surface-container" />
        <div className="h-28 animate-pulse rounded-xl bg-surface-container" />
      </div>
      <div className="h-24 animate-pulse rounded-xl bg-surface-container" />
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
    <div className="grid grid-cols-2 gap-1 rounded-xl border border-outline-variant bg-surface-container-high p-1">
      <button
        type="button"
        onClick={() => onChange("lent_out")}
        className={cn(
          "rounded-lg py-2.5 text-sm font-semibold transition-all active:scale-95",
          value === "lent_out"
            ? "bg-primary text-on-primary shadow-sm"
            : "text-on-surface-variant hover:bg-surface-container-lowest/50"
        )}
      >
        Lent out
      </button>
      <button
        type="button"
        onClick={() => onChange("borrowed")}
        className={cn(
          "rounded-lg py-2.5 text-sm font-semibold transition-all active:scale-95",
          value === "borrowed"
            ? "bg-primary text-on-primary shadow-sm"
            : "text-on-surface-variant hover:bg-surface-container-lowest/50"
        )}
      >
        Borrowed
      </button>
    </div>
  );
}
