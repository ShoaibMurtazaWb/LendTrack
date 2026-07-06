import Link from "next/link";
import { LendTrackLogoFull } from "@/components/LendTrackLogo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Privacy Policy — LendTrack",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-4 py-4 md:px-8">
        <Link href="/">
          <LendTrackLogoFull height={28} />
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-12 md:px-8">
        <h1 className="font-heading text-3xl font-bold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: July 2026</p>

        <div className="prose prose-neutral mt-8 max-w-none space-y-6 text-muted-foreground dark:prose-invert">
          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground">What we collect</h2>
            <p>
              LendTrack stores the information you provide: account details (name, email), contacts,
              items, loans, messages between linked neighbors, and notification preferences. Item photos
              you upload are stored in secure cloud storage.
            </p>
          </section>
          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground">How we use it</h2>
            <p>
              Your data powers loan tracking, trust scores, email reminders, and in-app messaging. We do
              not sell your personal information. Payment processing is handled by Stripe; we do not store
              full card numbers.
            </p>
          </section>
          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground">Who can see your data</h2>
            <p>
              Your loans, contacts, and items are private to your account. Linked neighbors can message
              you only after mutual contact linking. We use row-level security so users cannot access
              each other&apos;s records.
            </p>
          </section>
          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground">Your choices</h2>
            <p>
              You can update your profile, turn off email reminders in Settings, and delete contacts. For
              account deletion or a data export request, contact support at the email listed on our
              website.
            </p>
          </section>
        </div>

        <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "mt-10 rounded-xl")}>
          Back to home
        </Link>
      </main>
    </div>
  );
}
