"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { LendTrackLogoMark } from "@/components/LendTrackLogo";
import { useResetPassword } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { establishRecoverySession } from "@/lib/auth-recovery";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type Phase = "loading" | "form" | "error";

const inputClassName = cn(
  "h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-base outline-none",
  "transition-colors placeholder:text-muted-foreground",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
);

export default function ResetPasswordPage() {
  const router = useRouter();
  const resetPassword = useResetPassword();
  const [phase, setPhase] = useState<Phase>("loading");
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY") {
        setPhase("form");
        setBootstrapError(null);
      }
    });

    void (async () => {
      const result = await establishRecoverySession();
      if (!mounted) return;
      if (result.ok) {
        setPhase("form");
        setBootstrapError(null);
      } else {
        setPhase("error");
        setBootstrapError(result.message);
      }
    })();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return;

    const { data: sessionCheck } = await supabase.auth.getSession();
    if (!sessionCheck.session) {
      setBootstrapError("Your reset session expired. Please request a new link.");
      setPhase("error");
      return;
    }

    try {
      await resetPassword.mutateAsync(password);
      await supabase.auth.signOut();
      router.replace("/login?reset=success");
    } catch {
      // shown below
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <main className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <LendTrackLogoMark size={48} aria-label="LendTrack" />
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm md:p-8">
          <h1 className="font-heading text-2xl font-semibold">Choose a new password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter a new password for your LendTrack account.
          </p>

          {phase === "loading" && (
            <p className="mt-6 text-sm text-muted-foreground" role="status">
              Verifying your reset link…
            </p>
          )}

          {phase === "error" && (
            <div className="mt-6 space-y-3">
              <p className="text-sm text-destructive" role="alert">
                {bootstrapError ?? "This reset link is invalid or has expired."}
              </p>
              <Link href="/forgot-password" className="text-sm font-semibold text-primary hover:underline">
                Request a new reset link
              </Link>
            </div>
          )}

          {phase === "form" && (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className={cn(inputClassName, "pl-10")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm password</Label>
                <input
                  id="confirm"
                  name="confirm"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className={inputClassName}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>

              {password && confirm && password !== confirm && (
                <p className="text-sm text-destructive" role="alert">
                  Passwords do not match.
                </p>
              )}

              {resetPassword.isError && (
                <p className="text-sm text-destructive" role="alert">
                  {resetPassword.error.message}
                </p>
              )}

              <Button
                type="submit"
                className="h-11 w-full rounded-xl"
                disabled={resetPassword.isPending || !password || password !== confirm}
              >
                {resetPassword.isPending ? "Updating…" : "Update password"}
              </Button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
