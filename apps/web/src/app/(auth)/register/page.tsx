"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Mail, User } from "lucide-react";
import { isDuplicateAccountError } from "@/lib/auth-errors";
import { useRegister } from "@/hooks/useAuth";
import { RedirectIfAuthenticated, PublicPageLoader } from "@/components/PublicRoute";
import { LendTrackLogoMark } from "@/components/LendTrackLogo";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const router = useRouter();
  const { session, isLoading } = useAuth();
  const register = useRegister();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register.mutateAsync({ email, password, full_name: fullName });
      router.push("/dashboard");
    } catch {
      // error shown below
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
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] size-[60%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[5%] size-[50%] rounded-full bg-secondary/20 blur-[100px]" />
      </div>

      <main className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <LendTrackLogoMark size={48} aria-label="LendTrack" />
          <span className="mt-3 font-heading text-2xl font-semibold text-primary">LendTrack</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm md:p-8">
          <div className="mb-6">
            <h1 className="font-heading text-2xl font-semibold text-foreground">Join the neighborhood</h1>
            <p className="mt-1 text-muted-foreground">Start tracking your lend and borrow history.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  id="fullName"
                  required
                  autoComplete="name"
                  placeholder="Your name"
                  className="h-11 pl-10"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="neighbor@example.com"
                  className="h-11 pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {register.isError && (
              <p className="text-sm text-destructive" role="alert">
                {register.error.message}
                {isDuplicateAccountError(register.error.message) && (
                  <>
                    {" "}
                    <Link href="/login" className="font-semibold underline hover:text-destructive/80">
                      Log in
                    </Link>
                  </>
                )}
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              By creating an account you agree to our{" "}
              <Link href="/terms" className="text-primary hover:underline">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </p>

            <Button type="submit" className="h-11 w-full rounded-xl" disabled={register.isPending}>
              {register.isPending ? "Creating account…" : "Create account"}
              {!register.isPending && <ArrowRight className="size-4" />}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
