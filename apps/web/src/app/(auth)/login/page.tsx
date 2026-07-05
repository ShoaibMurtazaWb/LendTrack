"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Handshake, Mail, Lock } from "lucide-react";
import { useLogin } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
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

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] size-[60%] rounded-full bg-secondary-container/30 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[5%] size-[50%] rounded-full bg-primary-fixed/20 blur-[100px]" />
      </div>

      <main className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary shadow-sm">
            <Handshake className="size-6 text-on-primary" />
          </div>
          <span className="font-heading text-2xl font-semibold text-primary">LendTrack</span>
        </div>

        <div className="glass-card rounded-xl border border-outline-variant/30 p-6 md:p-8">
          <div className="mb-6">
            <h1 className="font-heading text-2xl font-semibold text-on-surface">Welcome back</h1>
            <p className="mt-1 text-on-surface-variant">
              Manage your neighborhood lending with ease.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-on-surface-variant">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-outline" />
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="neighbor@example.com"
                  className="h-12 rounded-xl border-outline-variant bg-surface-container-lowest pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-on-surface-variant">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-outline" />
                <Input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="h-12 rounded-xl border-outline-variant bg-surface-container-lowest pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {login.isError && (
              <p className="text-sm text-error">{login.error.message}</p>
            )}

            <Button
              type="submit"
              className="mt-2 h-12 w-full rounded-full text-base font-bold active:scale-95"
              disabled={login.isPending}
            >
              {login.isPending ? "Signing in…" : "Sign in"}
              {!login.isPending && <ArrowRight className="size-4" />}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-on-surface-variant">
            Need an account?{" "}
            <Link href="/register" className="font-bold text-primary hover:underline">
              Register
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
