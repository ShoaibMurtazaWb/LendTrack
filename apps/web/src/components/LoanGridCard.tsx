"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, BadgeCheck, Eye, Handshake, MessageSquare, Pencil, Sparkles, Trash2 } from "lucide-react";
import type { Item } from "@lendtrack/shared-types";
import { ItemThumbnail } from "@/components/ItemThumbnail";
import { useNewLoanDialog } from "@/components/loans/NewLoanDialogProvider";
import { LockedBadge, StatusBadge } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { getCategoryLabel, getItemCategory } from "@/lib/item-categories";
import { cn } from "@/lib/utils";
import { formatAppDate } from "@/lib/format-date";
import { localDateString } from "@/lib/loan-sync";

type LoanGridCardProps = {
  href: string;
  item?: Pick<Item, "name" | "photo_url" | "category"> | null;
  contactName: string;
  direction: string;
  dueDate: string;
  status: string;
  isLocked?: boolean;
  editHref?: string;
  onDelete?: () => void;
};

function daysRemaining(dueDate: string): number | null {
  const key = dueDate?.includes("T") ? dueDate.slice(0, 10) : dueDate;
  if (!key) return null;
  const due = new Date(`${key}T12:00:00`);
  const today = new Date(`${localDateString()}T12:00:00`);
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

function daysLabel(days: number | null, isOverdue: boolean) {
  if (days === null) return null;
  if (isOverdue || days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `${days}d left`;
}

export function LoanGridCard({
  href,
  item,
  contactName,
  direction,
  dueDate,
  status,
  isLocked = false,
  editHref,
  onDelete,
}: LoanGridCardProps) {
  const isOverdue = status === "overdue";
  const isLent = direction === "lent_out";
  const contactLine = isLent ? `Lent to ${contactName}` : `Borrowed from ${contactName}`;
  const days = daysRemaining(dueDate);
  const daysText = daysLabel(days, isOverdue);
  const category = getItemCategory(item?.category);
  const CategoryIcon = category.icon;

  return (
    <article
      className={cn(
        "pro-card-hover group relative flex flex-col overflow-hidden",
        isLocked && "opacity-65"
      )}
    >
      <Link href={href} className="flex flex-1 flex-col">
        <div className="relative h-36 overflow-hidden bg-muted">
          {item?.photo_url ? (
            <div className="flex h-full w-full items-center justify-center bg-gray-50 p-3">
              <div className="relative h-full w-full">
                <Image
                  src={item.photo_url}
                  alt={item?.name ?? "Item photo"}
                  fill
                  className="max-h-full max-w-full object-contain"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  unoptimized
                />
              </div>
            </div>
          ) : (
            <ItemThumbnail
              name={item?.name}
              photoUrl={item?.photo_url}
              category={item?.category}
              size="card"
              className="h-full rounded-none"
            />
          )}
          <div className="absolute right-3 top-3">
            <StatusBadge status={status} />
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 text-base font-semibold leading-snug group-hover:text-primary">
                {item?.name ?? "Item"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{contactLine}</p>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                category.bg,
                category.fg
              )}
            >
              <CategoryIcon className="size-3" strokeWidth={2} />
              {getCategoryLabel(item?.category)}
            </span>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium",
                isLent
                  ? "bg-brand-green-light/60 text-brand-green"
                  : "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
              )}
            >
              {isLent ? "Lent out" : "Borrowed"}
            </span>
            {isLocked && <LockedBadge />}
          </div>

          <div className="mt-auto flex items-end justify-between border-t border-border pt-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Due date
              </p>
              <p className={cn("text-sm font-semibold", isOverdue && "text-destructive")}>
                {formatAppDate(dueDate)}
              </p>
            </div>
            {daysText && (
              <span
                className={cn(
                  "rounded-lg px-2 py-1 text-xs font-semibold",
                  isOverdue
                    ? "bg-destructive/10 text-destructive"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {daysText}
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="absolute right-3 top-[9.5rem] flex gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
        <Link
          href={href}
          className="flex size-8 items-center justify-center rounded-lg border border-border bg-card/95 shadow-sm backdrop-blur hover:bg-muted"
          aria-label="View loan"
        >
          <Eye className="size-3.5" />
        </Link>
        {editHref && (
          <Link
            href={editHref}
            className="flex size-8 items-center justify-center rounded-lg border border-border bg-card/95 shadow-sm backdrop-blur hover:bg-muted"
            aria-label="Edit loan"
          >
            <Pencil className="size-3.5" />
          </Link>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete();
            }}
            className="flex size-8 items-center justify-center rounded-lg border border-border bg-card/95 shadow-sm backdrop-blur hover:bg-destructive/10"
            aria-label="Delete loan"
          >
            <Trash2 className="size-3.5 text-destructive" />
          </button>
        )}
      </div>
    </article>
  );
}

export function ContactGridCard({
  id,
  name,
  email,
  phone,
  isVerified,
  completedLoans,
  activeLoans,
  trustScore,
  hasScore,
}: {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  isVerified: boolean;
  completedLoans?: number;
  activeLoans?: number;
  trustScore?: number | null;
  hasScore?: boolean;
}) {
  const { openNewLoan } = useNewLoanDialog();
  const showScore = hasScore === true && trustScore != null;

  return (
    <div className="pro-card-hover flex min-h-[300px] flex-col p-5">
      <div className="mb-4 flex gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-muted text-xl font-semibold text-primary">
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link href={`/contacts/${id}`} className="truncate text-base font-semibold hover:text-primary">
              {name}
            </Link>
            {isVerified ? (
              <span className="flex shrink-0 items-center gap-1 rounded-md bg-brand-green-light px-2 py-0.5 text-[10px] font-semibold text-brand-green">
                <BadgeCheck className="size-3" />
                Verified
              </span>
            ) : (
              <span className="flex shrink-0 items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                <Sparkles className="size-3" />
                New
              </span>
            )}
          </div>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {email ?? phone ?? "Lending contact"}
          </p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 rounded-lg bg-muted p-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Trust</p>
          <p className="text-xl font-semibold text-primary">{showScore ? trustScore : "—"}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Open</p>
          <p className="text-xl font-semibold">{activeLoans ?? 0}</p>
        </div>
      </div>

      {completedLoans != null && completedLoans > 0 && (
        <p className="mb-4 text-xs text-muted-foreground">
          {completedLoans} completed loan{completedLoans === 1 ? "" : "s"}
        </p>
      )}

      <div className="mt-auto space-y-2">
        <Link
          href={`/messages/${id}`}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-medium transition-colors hover:bg-muted"
        >
          <MessageSquare className="size-4" />
          Message
        </Link>
        <Button type="button" className="w-full gap-2 rounded-lg" onClick={() => openNewLoan(id)}>
          <Handshake className="size-4" />
          New loan
          <ArrowUpRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
