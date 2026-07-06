"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { PASSWORD_RESET_EMAIL_LIMIT, PASSWORD_RESET_RATE_WINDOW } from "@/lib/auth-errors";
import { useForgotPassword } from "@/hooks/useAuth";
import { RedirectIfAuthenticated, PublicPageLoader } from "@/components/PublicRoute";
import { LendTrackLogoMark } from "@/components/LendTrackLogo";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const { session, isLoading } = useAuth();
  const forgotPassword = useForgotPassword();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await forgotPassword.mutateAsync(email);
      setSent(true);
    } catch {
      // shown below
    }
  };

  if (isLoading || session) {
    return (
      <>
        <RedirectIfAuthenticated />
        <PublicPageLoader />
      </>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <main className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <LendTrackLogoMark size={48} aria-label="LendTrack" />
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm md:p-8">
          <Link
            href="/login"
            className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to login
          </Link>

          <h1 className="font-heading text-2xl font-semibold">Reset your password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            We&apos;ll email you a link to choose a new password. You can request up to{" "}
            {PASSWORD_RESET_EMAIL_LIMIT} reset emails per {PASSWORD_RESET_RATE_WINDOW}.
          </p>

          {sent ? (
            <p className="mt-6 text-sm text-foreground" role="status">
              If an account exists for <strong>{email}</strong>, you&apos;ll receive a reset link shortly.
              Check your inbox and spam folder.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="h-11 pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {forgotPassword.isError && (
                <p className="text-sm text-destructive" role="alert">
                  {forgotPassword.error.message}
                </p>
              )}

              <Button type="submit" className="h-11 w-full rounded-xl" disabled={forgotPassword.isPending}>
                {forgotPassword.isPending ? "Sending…" : "Send reset link"}
              </Button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
