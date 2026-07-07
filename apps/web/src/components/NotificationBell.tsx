"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CalendarClock, MessageSquare, TriangleAlert } from "lucide-react";
import { useDashboardSummary } from "@/hooks/useLoans";
import { useConversations } from "@/hooks/useMessages";
import { useNotificationRealtime } from "@/hooks/useNotificationRealtime";
import { formatAppDate } from "@/lib/format-date";
import {
  dismissDueSoonAlert,
  dismissOverdueAlert,
  isDueSoonDismissed,
  isOverdueDismissed,
} from "@/lib/notification-dismissals";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  useNotificationRealtime();

  const [open, setOpen] = useState(false);
  const [dismissRevision, bumpDismissals] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const { data: dashboard } = useDashboardSummary();
  const { data: conversations } = useConversations();

  const unreadMessages = conversations?.reduce((sum, c) => sum + c.unread_count, 0) ?? 0;
  const overdueCount = dashboard?.overdue_count ?? 0;
  const dueSoon = dashboard?.upcoming_due?.slice(0, 3) ?? [];

  void dismissRevision;

  const showOverdue = overdueCount > 0 && !isOverdueDismissed(overdueCount);
  const visibleDueSoon = dueSoon.filter((loan) => !isDueSoonDismissed(loan.id));
  const loanAlertCount = (showOverdue ? 1 : 0) + visibleDueSoon.length;
  const totalAlerts = loanAlertCount + unreadMessages;

  const refreshDismissals = () => bumpDismissals((v) => v + 1);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  const markLoanAlertsRead = () => {
    if (showOverdue) dismissOverdueAlert(overdueCount);
    for (const loan of visibleDueSoon) dismissDueSoonAlert(loan.id);
    refreshDismissals();
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full p-2 text-foreground transition-colors hover:bg-surface-container-high"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Notifications"
      >
        <Bell className="size-5" />
        {totalAlerts > 0 && (
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-secondary ring-2 ring-surface" />
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-80 overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest shadow-lg"
        >
          <div className="flex items-start justify-between gap-2 border-b border-outline-variant/30 px-4 py-3">
            <div>
              <p className="font-heading font-semibold">Notifications</p>
              <p className="text-xs text-muted-foreground">
                {totalAlerts === 0 ? "You're all caught up" : `${totalAlerts} item${totalAlerts === 1 ? "" : "s"} need attention`}
              </p>
            </div>
            {loanAlertCount > 0 && (
              <button
                type="button"
                onClick={markLoanAlertsRead}
                className="shrink-0 text-xs font-medium text-primary hover:underline"
              >
                Mark read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {showOverdue && (
              <Link
                href="/loans"
                onClick={() => {
                  dismissOverdueAlert(overdueCount);
                  refreshDismissals();
                  setOpen(false);
                }}
                className="flex gap-3 rounded-lg p-3 transition-colors hover:bg-error-container/30"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-error-container text-destructive">
                  <TriangleAlert className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-destructive">
                    {overdueCount} overdue loan{overdueCount === 1 ? "" : "s"}
                  </p>
                  <p className="text-xs text-muted-foreground">Review and follow up</p>
                </div>
              </Link>
            )}

            {visibleDueSoon.map((loan) => (
              <Link
                key={loan.id}
                href={`/loans/${loan.id}`}
                onClick={() => {
                  dismissDueSoonAlert(loan.id);
                  refreshDismissals();
                  setOpen(false);
                }}
                className="flex gap-3 rounded-lg p-3 transition-colors hover:bg-surface-container-low"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary-fixed text-secondary">
                  <CalendarClock className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{loan.item?.name ?? "Loan"}</p>
                  <p className="text-xs text-muted-foreground">
                    Due {formatAppDate(loan.expected_return_at)} · {loan.contact?.name}
                  </p>
                </div>
              </Link>
            ))}

            {unreadMessages > 0 && (
              <Link
                href="/messages"
                onClick={() => setOpen(false)}
                className="flex gap-3 rounded-lg p-3 transition-colors hover:bg-surface-container-low"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary">
                  <MessageSquare className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {unreadMessages} unread message{unreadMessages === 1 ? "" : "s"}
                  </p>
                  <p className="text-xs text-muted-foreground">Open your inbox</p>
                </div>
              </Link>
            )}

            {totalAlerts === 0 && (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                No overdue loans, due dates, or unread messages right now.
              </p>
            )}
          </div>

          <div className="border-t border-outline-variant/30 p-2">
            <Link
              href="/loans"
              onClick={() => setOpen(false)}
              className={cn(
                "block rounded-lg px-3 py-2 text-center text-sm font-medium text-primary hover:bg-surface-container-low"
              )}
            >
              View all loans
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
