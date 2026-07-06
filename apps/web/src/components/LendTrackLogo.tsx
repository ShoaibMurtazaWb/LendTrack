import Image from "next/image";
import { LendTrackIconGraphic, LOGO_BLUE, LOGO_GRAY } from "@/components/LendTrackIconGraphic";
import { cn } from "@/lib/utils";

export { LOGO_BLUE, LOGO_GRAY };

type LendTrackLogoProps = {
  variant?: "full" | "icon";
  className?: string;
  height?: number;
};

export function LendTrackLogo({
  variant = "full",
  className,
  height = 32,
}: LendTrackLogoProps) {
  const src = variant === "icon" ? "/logo-icon.svg" : "/logo.svg";
  const aspect = variant === "icon" ? 1 : 320 / 70;

  return (
    <Image
      src={src}
      alt="LendTrack"
      width={Math.round(height * aspect)}
      height={height}
      className={cn("h-auto w-auto shrink-0", className)}
      style={{ height, width: Math.round(height * aspect) }}
      priority
    />
  );
}

export function LendTrackLogoMark({
  className,
  size = 40,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <LendTrackIconGraphic
      size={size}
      className={className}
      aria-label="LendTrack"
    />
  );
}

export function LendTrackLogoFull({
  className,
  height = 32,
}: {
  className?: string;
  height?: number;
}) {
  const width = (height * 320) / 70;

  return (
    <Image
      src="/logo.svg"
      alt="LendTrack"
      width={Math.round(width)}
      height={height}
      className={cn("h-auto w-auto shrink-0", className)}
      style={{ height, width: Math.round(width) }}
      priority
    />
  );
}
