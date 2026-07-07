"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function AnimatedNumber({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) {
      setDisplay(0);
      return;
    }
    const duration = 500;
    const start = performance.now();
    const from = display;
    let frame: number;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span className={cn("animate-count tabular-nums", className)}>{display}</span>;
}
