"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bell,
  Check,
  ChevronDown,
  Shield,
  Users,
  Wallet,
  MessageSquare,
  BarChart3,
} from "lucide-react";
import { LendTrackLogoFull, LendTrackLogoMark } from "@/components/LendTrackLogo";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/providers/AuthProvider";
import { cn } from "@/lib/utils";

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

const FEATURES = [
  {
    icon: Wallet,
    title: "Track every loan",
    description: "Record what you lent out or borrowed with due dates, notes, and photos.",
  },
  {
    icon: Users,
    title: "Know your neighbors",
    description: "Build a contact directory with trust scores based on real loan history.",
  },
  {
    icon: Bell,
    title: "Gentle reminders",
    description: "Email nudges before items are due — friendly, not awkward.",
  },
  {
    icon: Shield,
    title: "Private by design",
    description: "Your lending circle stays between you and your contacts. No social feed.",
  },
];

const STEPS = [
  { step: "01", title: "Add a contact", body: "Save neighbors, friends, or family you lend to or borrow from." },
  { step: "02", title: "Record a loan", body: "Log the item, direction, and return date in under a minute." },
  { step: "03", title: "Stay on top of it", body: "Dashboard alerts, weekly calendar, and reminders keep you organized." },
];

const FAQ = [
  {
    q: "Is LendTrack free?",
    a: "Yes. The free plan covers core tracking. Premium unlocks unlimited active loans, CSV export, and weekly digests.",
  },
  {
    q: "Do my contacts need an account?",
    a: "No. You can track loans with anyone. If they join with the same email, accounts link automatically.",
  },
  {
    q: "What happens when something is overdue?",
    a: "LendTrack flags it on your dashboard and can email you a reminder — you handle the conversation.",
  },
];

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
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
            <LendTrackLogoMark size={40} className="animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 z-50 w-full border-b border-border/60 bg-background/90 glass-header">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-8">
          <Link href="/" aria-label="LendTrack home">
            <LendTrackLogoFull height={30} />
          </Link>
          <nav className="hidden items-center gap-8 sm:flex" aria-label="Main">
            <button type="button" onClick={() => scrollTo("features")} className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Features
            </button>
            <button type="button" onClick={() => scrollTo("how-it-works")} className="text-sm font-medium text-muted-foreground hover:text-foreground">
              How it works
            </button>
            <button type="button" onClick={() => scrollTo("pricing")} className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Pricing
            </button>
            <button type="button" onClick={() => scrollTo("faq")} className="text-sm font-medium text-muted-foreground hover:text-foreground">
              FAQ
            </button>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden sm:inline-flex")}>
              Log in
            </Link>
            <Link href="/register" className={cn(buttonVariants({ size: "sm" }), "rounded-lg")}>
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-950 px-4 pb-24 pt-32 text-white md:px-8 md:pb-32 md:pt-40">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/30 via-slate-950 to-slate-950" />
        <div className="relative mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/80">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            Neighborhood lending, organized
          </span>
          <h1 className="mt-8 text-4xl font-semibold tracking-tight md:text-6xl md:leading-[1.1]">
            Track what you lend.
            <br />
            <span className="text-violet-400">Remember what you borrow.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
            LendTrack is the calm, private ledger for neighbors, friends, and family — with due dates,
            trust scores, and gentle reminders built in.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/register" className={cn(buttonVariants({ size: "lg" }), "rounded-lg px-8")}>
              Start free <ArrowRight className="ml-1 size-4" />
            </Link>
            <button
              type="button"
              onClick={() => scrollTo("features")}
              className={cn(buttonVariants({ size: "lg", variant: "outline" }), "rounded-lg border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white")}
            >
              See how it works
            </button>
          </div>
          <div className="mt-12 text-sm text-slate-400">
            Built for everyday lending between people you trust
          </div>
        </div>

        {/* Product preview mockup */}
        <div className="relative mx-auto mt-16 max-w-5xl">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/50">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <div className="flex gap-1.5">
                <span className="size-3 rounded-full bg-red-500/80" />
                <span className="size-3 rounded-full bg-amber-500/80" />
                <span className="size-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="mx-auto text-xs text-slate-500">app.lendtrack.io/dashboard</span>
            </div>
            <div className="flex min-h-[280px] bg-slate-50 p-4 md:p-6">
              <div className="mr-4 hidden w-14 shrink-0 rounded-xl bg-slate-900 md:block" />
              <div className="flex-1 space-y-4">
                <div className="hero-gradient h-28 rounded-xl" />
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Active", value: "12" },
                    { label: "Due this week", value: "4" },
                    { label: "Overdue", value: "1" },
                  ].map((card) => (
                    <div key={card.label} className="h-16 rounded-lg bg-white px-3 py-2 shadow-sm">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{card.label}</p>
                      <p className="mt-1 text-lg font-semibold text-slate-800">{card.value}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-20 rounded-lg bg-white px-3 py-2 shadow-sm">
                    <p className="text-xs font-semibold text-slate-700">Due soon</p>
                    <div className="mt-2 space-y-1.5">
                      <div className="h-2 rounded-full bg-slate-200" />
                      <div className="h-2 w-4/5 rounded-full bg-slate-200" />
                      <div className="h-2 w-3/5 rounded-full bg-slate-200" />
                    </div>
                  </div>
                  <div className="h-20 rounded-lg bg-white px-3 py-2 shadow-sm">
                    <p className="text-xs font-semibold text-slate-700">Top contacts</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="size-7 rounded-full bg-violet-100" />
                      <div className="h-2 w-2/3 rounded-full bg-slate-200" />
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="size-7 rounded-full bg-emerald-100" />
                      <div className="h-2 w-1/2 rounded-full bg-slate-200" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-24 px-4 py-24 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Everything you need to lend with confidence</h2>
            <p className="mt-4 text-muted-foreground">
              No spreadsheets. No awkward texts. Just a clear record of who has what, and when it&apos;s due back.
            </p>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="pro-card-hover p-6">
                  <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-24 bg-muted/50 px-4 py-24 md:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-semibold tracking-tight">How it works</h2>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.step} className="pro-card p-8">
                <span className="text-4xl font-bold text-primary/20">{s.step}</span>
                <h3 className="mt-4 text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-24 px-4 py-24 md:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-semibold tracking-tight">Simple pricing</h2>
          <p className="mt-4 text-center text-muted-foreground">Start free. Upgrade when you need more.</p>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="pro-card p-8">
              <h3 className="text-lg font-semibold">Free</h3>
              <p className="mt-2 text-4xl font-semibold">$0</p>
              <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                {["Up to 5 active loans", "Unlimited contacts", "Due date reminders", "Trust scores"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="size-4 text-brand-green" /> {item}
                  </li>
                ))}
              </ul>
              <Link href="/register" className={cn(buttonVariants({ variant: "outline" }), "mt-8 w-full rounded-lg")}>
                Get started
              </Link>
            </div>
            <div className="pro-card relative border-primary/30 p-8 shadow-lg shadow-primary/10">
              <span className="absolute -top-3 right-6 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                Popular
              </span>
              <h3 className="text-lg font-semibold">Premium</h3>
              <p className="mt-2 text-4xl font-semibold">$6<span className="text-base font-normal text-muted-foreground">/mo</span></p>
              <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                {["Unlimited active loans", "Weekly digest emails", "CSV export", "Priority support"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="size-4 text-brand-green" /> {item}
                  </li>
                ))}
              </ul>
              <Link href="/register" className={cn(buttonVariants(), "mt-8 w-full rounded-lg")}>
                Start free trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-24 bg-muted/50 px-4 py-24 md:px-8">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-3xl font-semibold tracking-tight">FAQ</h2>
          <div className="mt-12 space-y-4">
            {FAQ.map((item) => (
              <details key={item.q} className="pro-card group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                  {item.q}
                  <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-24 md:px-8">
        <div className="hero-gradient mx-auto max-w-4xl rounded-2xl px-8 py-16 text-center text-white shadow-xl">
          <h2 className="text-3xl font-semibold">Ready to organize your lending?</h2>
          <p className="mx-auto mt-4 max-w-lg text-white/80">
            Join neighbors who track loans without the awkwardness. Free to start — no credit card required.
          </p>
          <Link href="/register" className={cn(buttonVariants({ size: "lg" }), "mt-8 rounded-lg bg-white text-primary hover:bg-white/90")}>
            Create free account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card px-4 py-16 md:px-8">
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <LendTrackLogoFull height={28} />
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              The neighborhood lending ledger. Track items, build trust, and never lose track of what you shared.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Product</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><button type="button" onClick={() => scrollTo("features")} className="hover:text-foreground">Features</button></li>
              <li><button type="button" onClick={() => scrollTo("pricing")} className="hover:text-foreground">Pricing</button></li>
              <li><Link href="/register" className="hover:text-foreground">Sign up</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Legal</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-foreground">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-foreground">Terms</Link></li>
              <li><a href="mailto:support@lendtrack.app" className="hover:text-foreground">Support</a></li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-12 flex max-w-6xl flex-col items-center justify-between gap-4 border-t border-border pt-8 text-sm text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} LendTrack. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <BarChart3 className="size-4" />
            <MessageSquare className="size-4" />
            <Shield className="size-4" />
          </div>
        </div>
      </footer>
    </div>
  );
}
