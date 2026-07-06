"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Mail, Lock } from "lucide-react";
import { useLogin } from "@/hooks/useAuth";
import { RedirectIfAuthenticated, PublicPageLoader } from "@/components/PublicRoute";
import { LendTrackLogoMark } from "@/components/LendTrackLogo";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const { session, isLoading } = useAuth();
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login.mutateAsync({ email, password });
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
            <h1 className="font-heading text-2xl font-semibold text-foreground">Welcome back</h1>
            <p className="mt-1 text-muted-foreground">
              Manage your neighborhood lending with ease.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
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
                  aria-invalid={login.isError}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="h-11 pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={login.isError}
                />
              </div>
            </div>

            {login.isError && (
              <p className="text-sm text-destructive" role="alert">
                {login.error.message}
              </p>
            )}

            <Button type="submit" className="mt-2 h-11 w-full rounded-xl" disabled={login.isPending}>
              {login.isPending ? "Signing in…" : "Sign in"}
              {!login.isPending && <ArrowRight className="size-4" />}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Need an account?{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Register
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
