"use client";

import Image from "next/image";
import { getItemCategory } from "@/lib/item-categories";
import { cn } from "@/lib/utils";

type ItemThumbnailProps = {
  name?: string;
  photoUrl?: string | null;
  category?: string | null;
  size?: "sm" | "md" | "lg" | "card";
  className?: string;
};

const sizeMap = {
  sm: { box: "size-10", icon: "size-5", text: "text-xs" },
  md: { box: "size-14", icon: "size-7", text: "text-sm" },
  lg: { box: "size-20", icon: "size-9", text: "text-base" },
  card: { box: "h-36 w-full", icon: "size-12", text: "text-lg" },
};

export function ItemThumbnail({
  name,
  photoUrl,
  category,
  size = "md",
  className,
}: ItemThumbnailProps) {
  const cat = getItemCategory(category);
  const Icon = cat.icon;
  const s = sizeMap[size];
  const isCard = size === "card";

  if (photoUrl) {
    const isBlob = photoUrl.startsWith("blob:");

    if (isBlob) {
      return (
        <div
          className={cn(
            "relative overflow-hidden bg-muted",
            isCard ? "h-36 w-full rounded-t-2xl" : cn(s.box, "shrink-0 rounded-xl"),
            className
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoUrl} alt={name ?? "Item"} className="size-full object-cover" />
        </div>
      );
    }

    return (
      <div
        className={cn(
          "relative overflow-hidden bg-muted",
          isCard ? "h-36 w-full rounded-t-2xl" : cn(s.box, "shrink-0 rounded-xl"),
          className
        )}
      >
        <Image
          src={photoUrl}
          alt={name ?? "Item"}
          fill
          className="object-cover"
          sizes={isCard ? "400px" : "80px"}
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-1",
        cat.bg,
        isCard ? "h-36 w-full rounded-t-2xl" : cn(s.box, "shrink-0 rounded-xl"),
        className
      )}
    >
      <Icon className={cn(s.icon, cat.fg)} strokeWidth={1.75} />
      {isCard && (
        <span className={cn("font-semibold capitalize", cat.fg, s.text)}>{cat.label}</span>
      )}
    </div>
  );
}
