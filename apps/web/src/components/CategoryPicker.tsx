"use client";

import { ITEM_CATEGORIES, type ItemCategoryId } from "@/lib/item-categories";
import { cn } from "@/lib/utils";

export function CategoryPicker({
  value,
  onChange,
}: {
  value: ItemCategoryId;
  onChange: (id: ItemCategoryId) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {ITEM_CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const selected = value === cat.id;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onChange(cat.id)}
            title={cat.label}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-1 rounded-xl border p-2 transition-all active:scale-95",
              selected
                ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                : "border-border/60 bg-card hover:border-primary/40"
            )}
          >
            <span className={cn("flex size-9 items-center justify-center rounded-lg", cat.bg)}>
              <Icon className={cn("size-4", cat.fg)} />
            </span>
            <span className="line-clamp-1 text-[10px] font-semibold leading-tight">{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
}
