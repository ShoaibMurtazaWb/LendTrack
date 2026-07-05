import Link from "next/link";
import { Handshake, Shield, Bell, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-surface/80 px-4 shadow-sm glass-header md:px-8">
        <span className="font-heading text-xl font-semibold text-primary">LendTrack</span>
        <nav className="hidden items-center gap-6 md:flex">
          <span className="text-sm font-bold text-primary">Features</span>
          <span className="text-sm font-semibold text-on-surface-variant">Privacy First</span>
        </nav>
        <Link
          href="/settings/billing"
          className="hidden rounded-full bg-primary px-6 py-2 text-sm font-bold text-on-primary md:inline-flex"
        >
          Premium
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-24 pt-32 md:px-8">
        <section className="mb-10 flex flex-col items-center text-center">
          <div className="relative mb-6 size-28 md:size-36">
            <div className="absolute inset-0 rounded-xl bg-primary-fixed opacity-20 blur-2xl" />
            <div className="relative flex size-full items-center justify-center rounded-xl bg-primary-container shadow-md">
              <Handshake className="size-14 text-on-primary-container md:size-16" />
            </div>
          </div>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-on-background md:text-5xl">
            LendTrack
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-on-surface-variant">
            Track what you lend. Remember what you borrow.
            <br className="hidden md:block" /> A neighborly ledger built for communal trust.
          </p>
          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/register"
              className={cn(
                buttonVariants({ size: "lg" }),
                "rounded-full px-10 py-6 text-base font-bold shadow-md active:scale-95"
              )}
            >
              Get started
            </Link>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "rounded-full border-2 border-outline-variant px-10 py-6 text-base font-bold text-primary active:scale-95"
              )}
            >
              Log in
            </Link>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <div className="card-elevation md:col-span-2 flex flex-col justify-between rounded-xl border border-outline-variant bg-surface-container-low p-6">
            <div>
              <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary-fixed/20 text-primary">
                <Handshake className="size-6" />
              </div>
              <h3 className="font-heading text-xl font-semibold text-on-surface">Built on Trust</h3>
              <p className="mt-2 text-on-surface-variant">
                Manage exchanges with neighbors, friends, and family with transparency and gentle
                reminders.
              </p>
            </div>
            <div className="mt-6 flex -space-x-3">
              {[Users, Users, Users].map((Icon, i) => (
                <div
                  key={i}
                  className="flex size-10 items-center justify-center rounded-full border-2 border-surface bg-secondary-container text-xs font-bold text-primary"
                >
                  <Icon className="size-4" />
                </div>
              ))}
            </div>
          </div>

          <div className="card-elevation rounded-xl border border-outline-variant bg-surface-container-high/30 p-6">
            <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-secondary-container/50 text-secondary">
              <Shield className="size-5" />
            </div>
            <h4 className="font-bold text-on-surface">Private by Design</h4>
            <p className="mt-2 text-sm text-on-surface-variant">
              Your neighborhood exchanges stay between you. No invasive tracking.
            </p>
          </div>

          <div className="card-elevation flex flex-col justify-between rounded-xl border border-primary/20 bg-primary-container p-6 text-on-primary-container">
            <div>
              <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-on-primary-container/20">
                <Bell className="size-5" />
              </div>
              <h4 className="font-bold">Gentle Nudges</h4>
              <p className="mt-2 text-sm opacity-90">
                Auto-reminders that feel like a friendly tap on the shoulder.
              </p>
            </div>
            <div className="mt-4 rounded-lg bg-white/10 p-2 text-xs">
              Reminder: &quot;That drill? 😉&quot;
            </div>
          </div>
        </section>

        <section className="mt-16 flex flex-wrap items-center justify-around gap-6 border-y border-outline-variant/30 py-8 opacity-60">
          {["Neighborly Weekly", "The Ledger Times", "TrustPilot 4.9", "Communal Living"].map(
            (name) => (
              <span key={name} className="font-heading text-sm italic text-on-surface-variant">
                {name}
              </span>
            )
          )}
        </section>
      </main>

      <footer className="border-t border-outline-variant bg-surface-container-low px-4 py-8 md:px-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 md:flex-row">
          <div>
            <span className="font-bold text-primary">LendTrack</span>
            <p className="text-sm text-on-surface-variant">© 2024 LendTrack. Neighborhood organized.</p>
          </div>
          <div className="flex gap-6 text-xs font-bold text-on-surface-variant">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
