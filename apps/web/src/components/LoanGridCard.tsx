"use client";

import Link from "next/link";
import { ArrowUpRight, MessageSquare, Pencil } from "lucide-react";
import type { Item } from "@lendtrack/shared-types";
import { ItemThumbnail } from "@/components/ItemThumbnail";
import { useNewLoanDialog } from "@/components/loans/NewLoanDialogProvider";
import { LockedBadge, StatusBadge } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LoanGridCardProps = {
  href: string;
  item?: Pick<Item, "name" | "photo_url" | "category"> | null;
  contactName: string;
  direction: string;
  dueDate: string;
  status: string;
  isLocked?: boolean;
  editHref?: string;
};

function directionBadge(direction: string) {
  const isLent = direction === "lent_out";
  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-xs font-semibold",
        isLent ? "bg-brand-green-light text-brand-green" : "bg-secondary/40 text-secondary-foreground"
      )}
    >
      {isLent ? "Lent out" : "Borrowed"}
    </span>
  );
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
}: LoanGridCardProps) {
  const isOverdue = status === "overdue";
  const isLent = direction === "lent_out";
  const contactLine = isLent ? `Lent to ${contactName}` : `Borrowed from ${contactName}`;

  return (
    <article
      className={cn(
        "bento-card group relative overflow-hidden rounded-xl border border-border bg-card",
        isLocked && "opacity-65"
      )}
    >
      <Link href={href} className="block">
        <div className="p-5">
          <div className="mb-4 flex items-start justify-between gap-2">
            <ItemThumbnail
              name={item?.name}
              photoUrl={item?.photo_url}
              category={item?.category}
              size="lg"
            />
            <StatusBadge status={status} />
          </div>

          <h3 className="font-heading mb-1 line-clamp-2 text-lg font-semibold group-hover:text-primary">
            {item?.name ?? "Item"}
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">{contactLine}</p>

          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
            {directionBadge(direction)}
            {isLocked && <LockedBadge />}
            <span className="ml-auto text-right">
              <span className="block text-xs text-muted-foreground">Due date</span>
              <span className={cn("text-sm font-medium", isOverdue && "text-destructive")}>
                {dueDate}
              </span>
            </span>
          </div>
        </div>
      </Link>

      {editHref && (
        <Link
          href={editHref}
          className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-lg border border-border bg-card/90 opacity-0 shadow-sm backdrop-blur transition-opacity group-hover:opacity-100 hover:bg-accent"
          aria-label="Edit loan"
        >
          <Pencil className="size-3.5" />
        </Link>
      )}
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
  const showScore = hasScore !== false && trustScore != null;

  return (
    <div className="bento-card flex min-h-[320px] flex-col rounded-3xl border border-border bg-card p-6">
      <div className="mb-6 flex items-start justify-between">
        <div className="relative">
          <div className="flex size-20 items-center justify-center rounded-full border-2 border-primary/10 bg-muted text-2xl font-bold text-primary">
            {name.charAt(0).toUpperCase()}
          </div>
          {isVerified && (
            <span className="absolute -bottom-1 -right-1 rounded-full border-2 border-card bg-brand-green-light p-1 text-brand-green">
              ✓
            </span>
          )}
        </div>
        <div className="text-right">
          {showScore ? (
            <>
              <span className="font-heading text-2xl font-bold">{trustScore}</span>
              <p className="text-xs font-semibold uppercase text-brand-green">Trust score</p>
            </>
          ) : (
            <p className="text-xs font-medium italic text-muted-foreground">No history yet</p>
          )}
        </div>
      </div>

      <div className="mb-6 flex-grow">
        <Link href={`/contacts/${id}`} className="font-heading text-xl font-semibold hover:text-primary">
          {name}
        </Link>
        {email && <p className="mt-1 truncate text-sm text-muted-foreground">{email}</p>}
        {phone && !email && <p className="mt-1 text-sm text-muted-foreground">{phone}</p>}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 rounded-xl bg-muted/50 p-4">
        <div>
          <p className="text-xs text-muted-foreground">Completed</p>
          <p className="font-bold">{completedLoans ?? 0} loans</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">In progress</p>
          <p className="font-bold">{activeLoans ?? 0}</p>
        </div>
      </div>

      <Link
        href={`/messages/${id}`}
        className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3.5 text-sm font-medium transition-colors hover:bg-muted/50"
      >
        <MessageSquare className="size-4" />
        Message
      </Link>
      <Button
        type="button"
        className="flex w-full gap-2 rounded-xl"
        onClick={() => openNewLoan(id)}
      >
        New loan with {name.split(" ")[0]}
        <ArrowUpRight className="size-4" />
      </Button>
    </div>
  );
}
