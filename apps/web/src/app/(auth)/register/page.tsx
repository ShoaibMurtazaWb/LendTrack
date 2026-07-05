"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Handshake, Mail, Lock, User } from "lucide-react";
import { useRegister } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const router = useRouter();
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

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] size-[60%] rounded-full bg-secondary-container/30 blur-[120px]" />
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
            <h1 className="font-heading text-2xl font-semibold text-on-surface">Join the neighborhood</h1>
            <p className="mt-1 text-on-surface-variant">Start tracking your lend and borrow history.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-outline" />
                <Input
                  id="fullName"
                  className="h-12 rounded-xl border-outline-variant bg-surface-container-lowest pl-10"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-outline" />
                <Input
                  id="email"
                  type="email"
                  required
                  className="h-12 rounded-xl border-outline-variant bg-surface-container-lowest pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-outline" />
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  className="h-12 rounded-xl border-outline-variant bg-surface-container-lowest pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {register.isError && (
              <p className="text-sm text-error">{register.error.message}</p>
            )}

            <Button
              type="submit"
              className="h-12 w-full rounded-full text-base font-bold active:scale-95"
              disabled={register.isPending}
            >
              {register.isPending ? "Creating account…" : "Create account"}
              {!register.isPending && <ArrowRight className="size-4" />}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-on-surface-variant">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-primary hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
