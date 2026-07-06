"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type QueryErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
};

export function QueryErrorState({
  title = "Something went wrong",
  message = "We couldn't load this data. Check your connection and try again.",
  onRetry,
  className,
}: QueryErrorStateProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-destructive/25 bg-destructive/5 px-6 py-10 text-center",
        className
      )}
      role="alert"
    >
      <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="size-5 text-destructive" aria-hidden />
      </div>
      <h2 className="font-heading text-lg font-semibold text-foreground">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button type="button" variant="outline" onClick={onRetry} className="mt-5 gap-2 rounded-xl">
          <RefreshCw className="size-4" aria-hidden />
          Try again
        </Button>
      )}
    </div>
  );
}
