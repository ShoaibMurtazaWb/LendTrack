"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { LendTrackLogoMark } from "@/components/LendTrackLogo";
import { useAuth } from "@/providers/AuthProvider";

/** Redirect authenticated users away from public-only pages (home, login, register). */
export function RedirectIfAuthenticated({ to = "/dashboard" }: { to?: string }) {
  const router = useRouter();
  const { session, isLoading } = useAuth();
  const redirected = useRef(false);

  useEffect(() => {
    if (isLoading || !session || redirected.current) return;
    redirected.current = true;
    router.replace(to);
  }, [isLoading, session, router, to]);

  return null;
}

export function PublicPageLoader() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <LendTrackLogoMark size={40} className="animate-pulse" />
      <p className="mt-3 text-sm text-muted-foreground">Loading…</p>
    </div>
  );
}
