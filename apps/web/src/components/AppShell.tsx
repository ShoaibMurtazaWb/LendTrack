"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLogout, useProfile } from "@/hooks/useAuth";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/loans", label: "Loans" },
  { href: "/contacts", label: "Contacts" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: profile } = useProfile();
  const logout = useLogout();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/dashboard" className="text-xl font-bold text-emerald-700">
            LendTrack
          </Link>
          <nav className="hidden gap-6 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium ${
                  pathname.startsWith(item.href)
                    ? "text-emerald-700"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {profile && (
              <span className="hidden text-sm text-slate-500 sm:inline">
                {profile.full_name || "User"} · {profile.plan}
              </span>
            )}
            <button
              onClick={() => logout.mutate()}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
