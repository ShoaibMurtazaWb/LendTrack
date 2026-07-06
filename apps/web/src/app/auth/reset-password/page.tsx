"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { LendTrackLogoMark } from "@/components/LendTrackLogo";
import { useResetPassword } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const resetPassword = useResetPassword();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return;
    try {
      await resetPassword.mutateAsync(password);
      router.replace("/dashboard");
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

          {!ready ? (
            <p className="mt-6 text-sm text-muted-foreground">
              Open the reset link from your email to continue. If the link expired,{" "}
              <Link href="/forgot-password" className="text-primary hover:underline">
                request a new one
              </Link>
              .
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="h-11 pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input
                  id="confirm"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="h-11"
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
                disabled={resetPassword.isPending || password !== confirm}
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
