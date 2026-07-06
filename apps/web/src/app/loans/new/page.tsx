"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { AppShell } from "@/components/AppShell";
import { PageSkeleton } from "@/components/page-layout";

function NewLoanRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const contact = searchParams.get("contact");
    const query = contact ? `?new=1&contact=${contact}` : "?new=1";
    router.replace(`/loans${query}`);
  }, [router, searchParams]);

  return null;
}

export default function NewLoanPage() {
  return (
    <AuthGuard>
      <Suspense
        fallback={
          <AppShell>
            <PageSkeleton />
          </AppShell>
        }
      >
        <NewLoanRedirect />
      </Suspense>
    </AuthGuard>
  );
}
