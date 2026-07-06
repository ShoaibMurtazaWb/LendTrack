import Link from "next/link";
import { LendTrackLogoFull } from "@/components/LendTrackLogo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Terms of Service — LendTrack",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-4 py-4 md:px-8">
        <Link href="/">
          <LendTrackLogoFull height={28} />
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-12 md:px-8">
        <h1 className="font-heading text-3xl font-bold">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: July 2026</p>

        <div className="prose prose-neutral mt-8 max-w-none space-y-6 text-muted-foreground dark:prose-invert">
          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground">The service</h2>
            <p>
              LendTrack helps you track informal lending between people you know. It is a personal ledger
              tool, not a legal contract, escrow, or insurance service.
            </p>
          </section>
          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground">Your responsibility</h2>
            <p>
              You are responsible for the accuracy of loan records you create and for resolving disputes
              with contacts directly. LendTrack does not guarantee returns of borrowed items.
            </p>
          </section>
          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground">Plans & billing</h2>
            <p>
              Free accounts include up to five active loans. Premium subscriptions are billed monthly
              through Stripe and can be canceled at any time. When Premium ends, excess active loans may
              be locked until you upgrade again or close loans.
            </p>
          </section>
          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground">Acceptable use</h2>
            <p>
              Do not use LendTrack for harassment, spam, or illegal activity. We may suspend accounts that
              abuse messaging or attempt to circumvent plan limits.
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
