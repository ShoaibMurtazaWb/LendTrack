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
  placeholder?: string;
};

export function CategoryCombobox({
  value,
  categoryId,
  onValueChange,
  id,
  disabled,
  placeholder = "Select a category…",
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

  const renderIcon = (optionId: string) => {
    const cat = getItemCategory(optionId);
    const Icon = cat.icon;
    return (
      <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${cat.bg}`}>
        <Icon className={`size-4 ${cat.fg}`} strokeWidth={1.75} />
      </span>
    );
  };

  return (
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
      placeholder={placeholder}
      createLabel={(query) => {
        const resolved = resolveCategoryFromInput(query);
        const cat = getItemCategory(resolved);
        return `Use "${cat.label}" for "${query}"`;
      }}
      hint="Pick a category or type a custom one — each gets its own icon."
      renderOptionStart={(opt) => renderIcon(opt.id)}
      renderInputStart={(selectedId) => (selectedId ? renderIcon(selectedId) : null)}
    />
  );
}
