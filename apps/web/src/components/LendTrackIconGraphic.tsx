import Image from "next/image";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Brand colors from official LendTrack icon */
export const LOGO_BLUE = "#0080F4";
export const LOGO_GRAY = "#9AA6B2";

type LendTrackIconGraphicProps = Omit<ComponentProps<typeof Image>, "src" | "alt"> & {
  size?: number;
  "aria-label"?: string;
};

/** Official LendTrack mark from /logo-icon.svg */
export function LendTrackIconGraphic({
  size = 40,
  width,
  height,
  className,
  "aria-label": ariaLabel,
  ...props
}: LendTrackIconGraphicProps) {
  const w = typeof width === "number" ? width : size;
  const h = typeof height === "number" ? height : size;

  return (
    <Image
      src="/logo-icon.svg"
      alt={ariaLabel ?? ""}
      width={w}
      height={h}
      className={cn("shrink-0", className)}
      style={{ width: w, height: h }}
      aria-hidden={ariaLabel ? undefined : true}
      {...props}
    />
  );
}
