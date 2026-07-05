"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Handshake,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLogout, useProfile } from "@/hooks/useAuth";
import { useSyncOverdueLoans } from "@/hooks/useSyncOverdue";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/loans", label: "Loans", icon: Handshake },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

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
  const router = useRouter();
  const { data: profile } = useProfile();
  const logout = useLogout();
  useSyncOverdueLoans();

  const handleLogout = async () => {
    await logout.mutateAsync();
    router.replace("/login");
  };

  const isPremium = profile?.plan === "premium";

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <header className="fixed top-0 z-50 flex h-16 w-full items-center border-b border-outline-variant bg-surface/80 px-4 shadow-sm glass-header md:px-8">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          {variant === "minimal" ? (
            <div className="flex items-center gap-3">
              <Link
                href={backHref}
                className="-ml-2 rounded-full p-2 text-on-surface transition-colors hover:bg-surface-container-high active:scale-95"
                aria-label={backLabel ?? "Go back"}
              >
                <ArrowLeft className="size-5" />
              </Link>
              <h1 className="font-heading text-xl font-semibold text-on-surface">
                {title ?? "LendTrack"}
              </h1>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-8">
                <Link href="/dashboard" className="font-heading text-xl font-semibold text-primary">
                  LendTrack
                </Link>
                <nav className="hidden items-center gap-1 md:flex">
                  {navItems.map((item) => {
                    const active = pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-sm font-semibold transition-colors active:scale-95",
                          active
                            ? "bg-secondary-container/50 text-primary"
                            : "text-on-surface-variant hover:bg-surface-container-high/50 hover:text-primary"
                        )}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>
              <div className="flex items-center gap-3">
                {isPremium ? (
                  <span className="hidden rounded-full border border-outline-variant/30 bg-secondary-container px-3 py-1 text-xs font-bold text-on-secondary-container sm:inline-flex">
                    Premium
                  </span>
                ) : (
                  <Link
                    href="/settings/billing"
                    className="hidden rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-on-primary transition-all hover:brightness-110 active:scale-95 sm:inline-flex"
                  >
                    Premium
                  </Link>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  disabled={logout.isPending}
                  className="hidden text-on-surface-variant md:inline-flex"
                >
                  <LogOut className="size-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-24 md:px-8">{children}</main>

      {!hideBottomNav && variant === "default" && (
        <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around overflow-x-auto rounded-t-xl border-t border-outline-variant bg-surface px-4 pt-2 pb-4 shadow-lg md:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center px-4 py-2 transition-all active:scale-95",
                  active
                    ? "rounded-full bg-primary px-6 text-on-primary"
                    : "text-on-secondary-container hover:text-primary"
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.5 : 2} />
                <span className="text-xs font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
