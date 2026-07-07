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
import { MobileGlobalSearch } from "@/components/MobileGlobalSearch";
import { NotificationBell } from "@/components/NotificationBell";
import { NewLoanFab } from "@/components/NewLoanFab";
import { routeShowsGlobalSearch } from "@/lib/app-routes";
import { NewLoanDialogProvider } from "@/components/loans/NewLoanDialogProvider";
import { UserAccountMenu } from "@/components/UserAccountMenu";
import { LendTrackLogoFull, LendTrackLogoMark } from "@/components/LendTrackLogo";
import { SidebarPlanLink } from "@/components/billing/SidebarPlanLink";
import { useSyncOverdueLoans } from "@/hooks/useSyncOverdue";
import { cn } from "@/lib/utils";

const RAIL_WIDTH_CLASS = "w-[72px]";
const RAIL_OFFSET_CLASS = "md:ml-[72px]";

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
      className="group relative mx-2 flex flex-col items-center"
      aria-label={label}
    >
      <span
        className={cn(
          "flex size-11 items-center justify-center rounded-2xl transition-all duration-200",
          active
            ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
            : "text-slate-400 hover:bg-white/10 hover:text-white"
        )}
      >
        <Icon className="size-5" strokeWidth={active ? 2.25 : 2} />
      </span>
      <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        {label}
      </span>
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
  hideFab?: boolean;
};

export function AppShell({
  children,
  variant = "default",
  backHref = "/dashboard",
  backLabel,
  title,
  hideBottomNav = false,
  hideFab = false,
}: AppShellProps) {
  const pathname = usePathname();
  const showGlobalSearch = routeShowsGlobalSearch(pathname);
  useSyncOverdueLoans();

  if (variant === "minimal") {
    return (
      <NewLoanDialogProvider>
        <div className="min-h-screen bg-background">
          <header className="sticky top-0 z-50 border-b border-border bg-card/90 glass-header">
            <div className="flex h-16 items-center justify-between px-4 md:px-8">
              <div className="flex items-center gap-3">
                <Link
                  href={backHref}
                  className="flex size-9 items-center justify-center rounded-lg hover:bg-muted"
                  aria-label={backLabel ?? "Go back"}
                >
                  <ArrowLeft className="size-4" />
                </Link>
                <h1 className="text-lg font-semibold">{title ?? "LendTrack"}</h1>
              </div>
              <UserAccountMenu />
            </div>
          </header>
          <main className="page-canvas py-6">{children}</main>
        </div>
      </NewLoanDialogProvider>
    );
  }

  return (
    <NewLoanDialogProvider>
      <div className="flex min-h-screen bg-background">
        <aside
          className={cn(
            "fixed left-0 top-0 z-50 hidden h-full flex-col bg-rail py-5 md:flex",
            RAIL_WIDTH_CLASS
          )}
        >
          <Link
            href="/dashboard"
            className="mb-6 flex h-10 items-center justify-center"
            aria-label="LendTrack home"
          >
            <LendTrackLogoMark size={32} className="brightness-0 invert" />
          </Link>

          <nav className="flex flex-1 flex-col gap-1">
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

          <SidebarPlanLink />
        </aside>

        <div className={cn("flex min-h-screen min-w-0 flex-1 flex-col", RAIL_OFFSET_CLASS)}>
          <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-4 border-b border-border/60 bg-background/90 px-4 glass-header md:h-16 md:px-8">
            <div className="flex min-w-0 items-center gap-3 md:hidden">
              <Link href="/dashboard" aria-label="LendTrack home">
                <LendTrackLogoFull height={28} />
              </Link>
            </div>

            {showGlobalSearch ? (
              <div className="hidden max-w-md flex-1 md:block">
                <GlobalSearch />
              </div>
            ) : (
              <div className="hidden flex-1 md:block" aria-hidden />
            )}

            <div className="ml-auto flex shrink-0 items-center gap-1 md:gap-2">
              {showGlobalSearch && <MobileGlobalSearch />}
              <div className="hidden sm:block">
                <NotificationBell />
              </div>
              <Link
                href="/settings"
                className="hidden rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:flex"
                aria-label="Settings"
              >
                <Settings className="size-5" />
              </Link>
              <UserAccountMenu />
            </div>
          </header>

          <main className="flex-1 pb-[5.5rem] md:pb-8">{children}</main>
        </div>

        {!hideBottomNav && (
          <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-[4.5rem] items-center justify-around border-t border-border bg-card/95 px-2 backdrop-blur-lg md:hidden">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "flex items-center justify-center rounded-xl px-5 py-1.5",
                      active && "bg-primary/10"
                    )}
                  >
                    <Icon className="size-5" strokeWidth={active ? 2.25 : 2} />
                  </span>
                  <span className="max-w-[4rem] truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}

        {!hideFab && <NewLoanFab />}
      </div>
    </NewLoanDialogProvider>
  );
}
