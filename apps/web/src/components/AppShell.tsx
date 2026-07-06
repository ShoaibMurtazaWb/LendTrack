"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NewLoanDialogProvider } from "@/components/loans/NewLoanDialogProvider";
import { UserAccountMenu } from "@/components/UserAccountMenu";
import { LendTrackLogoFull, LendTrackLogoMark } from "@/components/LendTrackLogo";
import { useSyncOverdueLoans } from "@/hooks/useSyncOverdue";
import { cn } from "@/lib/utils";

/** Narrow purple rail — active pill inset from left edge */
const RAIL_WIDTH = "3.75rem"; // 60px

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/loans", label: "Loans", icon: Wallet },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/settings", label: "Settings", icon: Settings },
];

function RailNavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "relative flex h-11 w-full items-center justify-center",
        active ? "text-primary" : "text-[#d3bbff] hover:text-white"
      )}
      aria-label={label}
      title={label}
    >
      {active && <span className="rail-tab-bg" aria-hidden />}
      <Icon className="relative z-10 size-5" strokeWidth={active ? 2.25 : 2} />
    </Link>
  );
}

type AppShellProps = {
  children: React.ReactNode;
  variant?: "default" | "minimal";
  backHref?: string;
  backLabel?: string;
  title?: string;
  hideBottomNav?: boolean;
};

export function AppShell({
  children,
  variant = "default",
  backHref = "/dashboard",
  backLabel,
  title,
  hideBottomNav = false,
}: AppShellProps) {
  const pathname = usePathname();
  useSyncOverdueLoans();

  if (variant === "minimal") {
    return (
      <NewLoanDialogProvider>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b border-border bg-background/90 glass-header">
          <div className="flex h-16 items-center justify-between px-4 md:px-8">
            <div className="flex items-center gap-3">
              <Link
                href={backHref}
                className="flex size-9 items-center justify-center rounded-lg border border-border hover:bg-accent"
                aria-label={backLabel ?? "Go back"}
              >
                <ArrowLeft className="size-4" />
              </Link>
              <h1 className="font-heading text-lg font-semibold">{title ?? "LendTrack"}</h1>
            </div>
            <UserAccountMenu />
          </div>
        </header>
        <main className="px-4 py-6 md:px-8">{children}</main>
      </div>
      </NewLoanDialogProvider>
    );
  }

  return (
    <NewLoanDialogProvider>
    <div className="flex min-h-screen bg-background">
      <aside
        className="fixed left-0 top-0 z-50 hidden h-full flex-col overflow-visible bg-primary py-5 md:flex"
        style={{ width: RAIL_WIDTH }}
      >
        <Link
          href="/dashboard"
          className="mb-6 flex h-10 items-center justify-center"
          aria-label="LendTrack home"
        >
          <LendTrackLogoMark size={36} />
        </Link>

        <nav className="flex flex-1 flex-col">
          {navItems.map((item) => (
            <RailNavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={pathname.startsWith(item.href)}
            />
          ))}
        </nav>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col md:ml-[3.75rem]">
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border/60 bg-background/85 px-4 glass-header md:h-16 md:px-8">
          <div className="flex items-center md:hidden">
            <Link href="/dashboard" aria-label="LendTrack home">
              <LendTrackLogoFull height={28} />
            </Link>
          </div>

          <div className="hidden max-w-md flex-1 md:block">
            <GlobalSearch />
          </div>

          <UserAccountMenu />
        </header>

        <main className="flex-1 px-4 py-5 pb-20 md:px-8 md:py-6 md:pb-6">{children}</main>
      </div>

      {!hideBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-14 items-center justify-around border-t border-border bg-card px-1 shadow-lg md:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2 py-1 text-[9px] font-semibold transition-colors",
                  active
                    ? "rounded-xl bg-secondary text-secondary-foreground"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="size-4" />
                <span className="max-w-[3.5rem] truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
    </NewLoanDialogProvider>
  );
}
