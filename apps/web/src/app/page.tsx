"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Bell, Users } from "lucide-react";
import { LendTrackLogoFull, LendTrackLogoMark } from "@/components/LendTrackLogo";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/providers/AuthProvider";
import { cn } from "@/lib/utils";

function scrollToFeatures() {
  document.getElementById("features")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function HomePage() {
  const router = useRouter();
  const { session, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && session) {
      router.replace("/dashboard");
    }
  }, [isLoading, session, router]);

  if (isLoading || session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/15">
            <LendTrackLogoMark size={40} className="animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 z-50 w-full border-b border-border/60 bg-background/95 glass-header">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 md:gap-6 md:px-8">
          <Link href="/" className="relative z-10 shrink-0" aria-label="LendTrack home">
            <LendTrackLogoFull height={32} />
          </Link>

          <nav
            className="relative z-10 hidden min-w-0 flex-1 items-center justify-center gap-6 sm:flex"
            aria-label="Main"
          >
            <button
              type="button"
              onClick={scrollToFeatures}
              className="cursor-pointer text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </button>
            <Link
              href="/privacy"
              className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              Terms
            </Link>
          </nav>

          <div className="relative z-10 ml-auto flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={scrollToFeatures}
              className="cursor-pointer text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground sm:hidden"
            >
              Features
            </button>
            <ThemeToggle />
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden sm:inline-flex")}
            >
              Log in
            </Link>
            <Link href="/register" className={cn(buttonVariants({ size: "sm" }), "rounded-xl")}>
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-24 pt-32 md:px-8">
        <section className="mb-10 flex flex-col items-center text-center">
          <div className="relative mb-6">
            <LendTrackLogoFull height={72} className="md:h-[88px] md:w-auto" />
          </div>
          <h1 className="sr-only">LendTrack</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Track what you lend. Remember what you borrow.
            <br className="hidden md:block" /> A neighborly ledger built for communal trust.
          </p>
          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/register"
              className={cn(buttonVariants({ size: "lg" }), "rounded-xl px-10 shadow-md")}
            >
              Create free account
            </Link>
            <Link
              href="/login"
              className={cn(buttonVariants({ size: "lg", variant: "outline" }), "rounded-xl px-10")}
            >
              Log in
            </Link>
          </div>
        </section>

        <section id="features" className="scroll-mt-28 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col justify-between rounded-2xl border border-border/60 bg-card p-6 shadow-sm md:col-span-2">
            <div>
              <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10">
                <LendTrackLogoMark size={32} />
              </div>
              <h3 className="font-heading text-xl font-semibold">Built on trust</h3>
              <p className="mt-2 text-muted-foreground">
                Manage exchanges with neighbors, friends, and family with transparency and gentle
                reminders.
              </p>
            </div>
            <div className="mt-6 flex -space-x-3">
              {[Users, Users, Users].map((Icon, i) => (
                <div
                  key={i}
                  className="flex size-10 items-center justify-center rounded-full border-2 border-background bg-secondary text-primary"
                >
                  <Icon className="size-4" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
            <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
              <Shield className="size-5" />
            </div>
            <h4 className="font-bold">Private by design</h4>
            <p className="mt-2 text-sm text-muted-foreground">
              Your neighborhood exchanges stay between you. No invasive tracking.
            </p>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-primary/30 bg-primary p-6 text-primary-foreground shadow-sm">
            <div>
              <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-primary-foreground/20">
                <Bell className="size-5" />
              </div>
              <h4 className="font-bold">Gentle nudges</h4>
              <p className="mt-2 text-sm opacity-90">
                Auto-reminders that feel like a friendly tap on the shoulder.
              </p>
            </div>
            <div className="mt-4 rounded-lg bg-primary-foreground/10 p-2 text-xs">
              Reminder: &quot;That drill? 😉&quot;
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 bg-muted/30 px-4 py-8 md:px-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 md:flex-row">
          <div>
            <LendTrackLogoFull height={24} />
            <p className="text-sm text-muted-foreground">© 2026 LendTrack. Neighborhood organized.</p>
          </div>
          <div className="flex gap-6 text-xs font-semibold text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <a href="mailto:support@lendtrack.app" className="hover:text-foreground">
              Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
