"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Check, ArrowLeft, Sparkles, Zap } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { PageHeader, PageSkeleton } from "@/components/page-layout";
import { useProfile } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import type { Subscription } from "@lendtrack/shared-types";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

async function billingFetch(path: string, options?: RequestInit) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const res = await fetch(`/api/billing${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token}`,
      ...options?.headers,
    },
  });

  return res.json();
}

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Great for getting started",
    features: ["Up to 5 active loans", "Email due-date reminders", "Contact & item tracking"],
    cta: "Current plan",
    highlighted: false,
  },
  {
    id: "premium",
    name: "Premium",
    price: "$5",
    period: "/ month",
    description: "For power lenders & borrowers",
    features: [
      "Unlimited active loans",
      "Priority email reminders",
      "Weekly digest emails",
      "Export loan history (coming soon)",
    ],
    cta: "Upgrade to Premium",
    highlighted: true,
  },
] as const;

export default function BillingPage() {
  const { data: profile } = useProfile();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    supabase
      .from("subscriptions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setSubscription(data);
        setLoading(false);
      });
  }, [profile?.plan]);

  const currentPlan = profile?.plan ?? "free";

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const res = await billingFetch("/checkout", { method: "POST" });
      if (res.url) {
        window.location.href = res.url;
        return;
      }
      toast.error(
        res.error ||
          "Stripe is not configured yet. Add STRIPE_SECRET_KEY and STRIPE_PRICE_ID_PREMIUM to enable checkout."
      );
    } catch {
      toast.error("Could not start checkout. Please try again later.");
    } finally {
      setUpgrading(false);
    }
  };

  const handleCancel = async () => {
    try {
      const res = await billingFetch("/cancel", { method: "POST" });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Subscription canceled. You will keep Premium until the period ends.");
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setSubscription(data);
    } catch {
      toast.error("Failed to cancel subscription");
    }
  };

  return (
    <AuthGuard>
      <AppShell>
        <PageHeader
          title="Billing & plans"
          description="Choose the plan that fits how much you lend and borrow"
          action={
            <Link
              href="/settings"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2")}
            >
              <ArrowLeft className="size-4" />
              Back to settings
            </Link>
          }
        />

        {loading ? (
          <PageSkeleton />
        ) : (
          <div className="space-y-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Your current plan:</span>
              <Badge className="capitalize">{currentPlan}</Badge>
              {subscription?.current_period_end && currentPlan === "premium" && (
                <span className="text-sm text-muted-foreground">
                  · Renews {new Date(subscription.current_period_end).toLocaleDateString()}
                </span>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {PLANS.map((plan) => {
                const isCurrent = currentPlan === plan.id;
                return (
                  <Card
                    key={plan.id}
                    className={cn(
                      "relative flex flex-col",
                      plan.highlighted && "border-primary shadow-md"
                    )}
                  >
                    {plan.highlighted && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="gap-1">
                          <Sparkles className="size-3" />
                          Recommended
                        </Badge>
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {plan.id === "premium" ? <Zap className="size-5 text-primary" /> : null}
                        {plan.name}
                      </CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                      <div className="pt-2">
                        <span className="text-3xl font-bold">{plan.price}</span>
                        <span className="text-muted-foreground">{plan.period}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <ul className="space-y-2">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-sm">
                            <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      {plan.id === "premium" ? (
                        isCurrent ? (
                          <Button variant="outline" className="w-full" onClick={handleCancel}>
                            Cancel subscription
                          </Button>
                        ) : (
                          <Button className="w-full" onClick={handleUpgrade} disabled={upgrading}>
                            {upgrading ? "Redirecting…" : plan.cta}
                          </Button>
                        )
                      ) : (
                        <Button variant="secondary" className="w-full" disabled={isCurrent}>
                          {isCurrent ? "Current plan" : "Downgrade via canceling Premium"}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">What happens when you upgrade?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">Step 1:</strong> Click &quot;Upgrade to Premium&quot; — you&apos;ll
                  be redirected to Stripe Checkout (secure payment).
                </p>
                <p>
                  <strong className="text-foreground">Step 2:</strong> After payment, your plan updates automatically
                  and the 5-loan limit is removed.
                </p>
                <p>
                  <strong className="text-foreground">Step 3:</strong> Enable weekly digest in Settings → Notifications.
                </p>
                <p className="text-xs">
                  Stripe must be configured in your environment for checkout to work. Until then, contact the
                  developer to enable billing.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </AppShell>
    </AuthGuard>
  );
}
