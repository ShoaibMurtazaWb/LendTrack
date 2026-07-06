"use client";

import { useMemo } from "react";
import { SearchCombobox } from "@/components/SearchCombobox";
import {
  ITEM_CATEGORIES,
  getItemCategory,
  resolveCategoryFromInput,
  type ItemCategoryId,
} from "@/lib/item-categories";

type CategoryComboboxProps = {
  value: string;
  categoryId: ItemCategoryId | null;
  onValueChange: (label: string, categoryId: ItemCategoryId | null) => void;
  id?: string;
  disabled?: boolean;
};

export function CategoryCombobox({
  value,
  categoryId,
  onValueChange,
  id,
  disabled,
}: CategoryComboboxProps) {
  const options = useMemo(
    () =>
      ITEM_CATEGORIES.map((cat) => ({
        id: cat.id,
        label: cat.label,
        searchText: `${cat.id} ${cat.label}`.toLowerCase(),
      })),
    []
  );

  const renderIcon = (option: { id: string }) => {
    const cat = getItemCategory(option.id);
    const Icon = cat.icon;
    return (
      <span
        className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${cat.bg}`}
      >
        <Icon className={`size-4 ${cat.fg}`} strokeWidth={1.75} />
      </span>
    );
  };

  return (
    <div className="space-y-2">
      <SearchCombobox
        id={id}
        disabled={disabled}
        options={options}
        value={value}
        selectedId={categoryId}
        onValueChange={(label, selectedId) => {
          if (selectedId) {
            onValueChange(label, selectedId as ItemCategoryId);
          } else {
            onValueChange(label, null);
          }
        }}
        onCreateSelect={(query) => {
          const resolved = resolveCategoryFromInput(query);
          const cat = getItemCategory(resolved);
          onValueChange(cat.label, resolved);
        }}
        placeholder="Search categories or type a new one…"
        createLabel={(query) => {
          const resolved = resolveCategoryFromInput(query);
          const cat = getItemCategory(resolved);
          return `Use "${cat.label}" for "${query}"`;
        }}
        hint="Each category gets an icon automatically on your loans."
        renderOptionStart={renderIcon}
      />
      {categoryId && (
        <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          {renderIcon({ id: categoryId })}
          <span>
            Icon preview: <span className="font-medium text-foreground">{getItemCategory(categoryId).label}</span>
          </span>
        </div>
      )}
    </div>
  );
}
