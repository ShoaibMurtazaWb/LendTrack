"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { LogOut, Monitor, Moon, Settings, Sun } from "lucide-react";
import { useLogout, useProfile } from "@/hooks/useAuth";
import { useAuth } from "@/providers/AuthProvider";
import { cn } from "@/lib/utils";

export function UserAccountMenu({ className }: { className?: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const logout = useLogout();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
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

  const handleLogout = async () => {
    setOpen(false);
    await logout.mutateAsync();
    router.replace("/login");
  };

  const initial = (profile?.full_name || user?.email || "U").charAt(0).toUpperCase();
  const displayName = profile?.full_name?.trim() || "Your account";
  const isDark = mounted && resolvedTheme === "dark";
  const isSystem = mounted && theme === "system";

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex size-10 cursor-pointer items-center justify-center rounded-full border-2 border-primary/20 bg-surface-container text-sm font-semibold text-primary transition-colors hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
      >
        {initial}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 overflow-hidden rounded-xl border border-border bg-card shadow-lg"
        >
          <div className="border-b border-border px-4 py-3">
            <p className="truncate font-semibold text-foreground">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            <p className="mt-1 text-xs capitalize text-muted-foreground">{profile?.plan ?? "free"} plan</p>
          </div>

          <div className="p-1">
            <Link
              href="/settings"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent"
            >
              <Settings className="size-4 text-muted-foreground" />
              Profile & settings
            </Link>
          </div>

          <div className="border-t border-border p-2">
            <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Theme
            </p>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                role="menuitem"
                onClick={() => setTheme("light")}
                className={cn(
                  "flex cursor-pointer items-center justify-center gap-1 rounded-lg px-1.5 py-2 text-[11px] font-medium",
                  theme === "light" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                )}
              >
                <Sun className="size-3.5" />
                Light
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => setTheme("dark")}
                className={cn(
                  "flex cursor-pointer items-center justify-center gap-1 rounded-lg px-1.5 py-2 text-[11px] font-medium",
                  theme === "dark" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                )}
              >
                <Moon className="size-3.5" />
                Dark
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => setTheme("system")}
                className={cn(
                  "flex cursor-pointer items-center justify-center gap-1 rounded-lg px-1.5 py-2 text-[11px] font-medium",
                  isSystem ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                )}
              >
                <Monitor className="size-3.5" />
                Auto
              </button>
            </div>
            {isSystem && (
              <p className="px-2 pt-1 text-[10px] text-muted-foreground">
                Currently {isDark ? "dark" : "light"} from system
              </p>
            )}
          </div>

          <div className="border-t border-border p-1">
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              disabled={logout.isPending}
              className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
            >
              <LogOut className="size-4" />
              {logout.isPending ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
