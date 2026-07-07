"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type SearchComboboxOption = {
  id: string;
  label: string;
  searchText: string;
  subtitle?: string;
};

type SearchComboboxProps = {
  options: SearchComboboxOption[];
  value: string;
  selectedId: string | null;
  onValueChange: (value: string, selectedId: string | null) => void;
  placeholder?: string;
  createLabel?: (query: string) => string;
  hint?: string;
  disabled?: boolean;
  id?: string;
  renderOptionStart?: (option: SearchComboboxOption) => React.ReactNode;
  renderInputStart?: (selectedId: string | null) => React.ReactNode;
  onCreateSelect?: (query: string) => void;
};

export function SearchCombobox({
  options,
  value,
  selectedId,
  onValueChange,
  placeholder = "Search or type to add…",
  createLabel = (query) => `Add "${query}"`,
  hint,
  disabled,
  id,
  renderOptionStart,
  renderInputStart,
  onCreateSelect,
}: SearchComboboxProps) {
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const query = value.trim();
  const normalizedQuery = query.toLowerCase();

  const filtered = useMemo(() => {
    if (!normalizedQuery) return options;
    return options.filter((opt) => opt.searchText.toLowerCase().includes(normalizedQuery));
  }, [options, normalizedQuery]);

  const exactMatch = useMemo(
    () =>
      options.some(
        (opt) =>
          opt.label.toLowerCase() === normalizedQuery ||
          opt.searchText.toLowerCase() === normalizedQuery
      ),
    [options, normalizedQuery]
  );

  const showCreate = query.length > 0 && !exactMatch;
  const listItems = showCreate
    ? [
        { type: "create" as const, id: "__create__", label: createLabel(query) },
        ...filtered.map((o) => ({ type: "option" as const, ...o })),
      ]
    : filtered.map((o) => ({ type: "option" as const, ...o }));

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectOption = (opt: SearchComboboxOption) => {
    onValueChange(opt.label, opt.id);
    setOpen(false);
    setActiveIndex(-1);
  };

  const selectCreate = () => {
    if (onCreateSelect) {
      onCreateSelect(query);
    } else {
      onValueChange(query, null);
    }
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleInputChange = (next: string) => {
    const matched = options.find(
      (opt) => opt.id === selectedId && (opt.label === next || opt.searchText === next)
    );
    onValueChange(next, matched?.id ?? null);
    setOpen(true);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, listItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && open && activeIndex >= 0) {
      e.preventDefault();
      const item = listItems[activeIndex];
      if (item.type === "create") selectCreate();
      else selectOption(item);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const showDropdown = open && (listItems.length > 0 || query.length === 0);
  const inputStart = renderInputStart?.(selectedId);

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          "flex h-12 w-full items-center gap-2 rounded-xl border border-border bg-background px-3",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        {inputStart && <div className="flex shrink-0 items-center">{inputStart}</div>}
        <Input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={showDropdown && listItems.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          className="h-full min-h-0 flex-1 border-0 bg-transparent p-0 text-base shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 md:text-sm"
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {showDropdown && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-[100] mt-1 max-h-56 w-full overflow-auto rounded-lg border border-border bg-popover py-1 shadow-lg"
        >
          {listItems.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              {options.length === 0
                ? "No saved entries yet — type a name to add one"
                : "Type to search or pick from the list"}
            </li>
          ) : (
            listItems.map((item, index) => {
            if (item.type === "create") {
              return (
                <li key={item.id} role="option" aria-selected={activeIndex === index}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent",
                      activeIndex === index && "bg-accent"
                    )}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={selectCreate}
                  >
                    <Plus className="size-4 shrink-0 text-primary" />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            }

            const isSelected = selectedId === item.id;
            return (
              <li key={item.id} role="option" aria-selected={isSelected || activeIndex === index}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent",
                    (activeIndex === index || isSelected) && "bg-accent/60"
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectOption(item)}
                >
                  {renderOptionStart?.(item)}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{item.label}</span>
                    {item.subtitle && (
                      <span className="block truncate text-xs text-muted-foreground">{item.subtitle}</span>
                    )}
                  </span>
                  {isSelected && <Check className="size-4 shrink-0 text-primary" />}
                </button>
              </li>
            );
          })
          )}
        </ul>
      )}

      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      {!selectedId && query.length > 0 && !exactMatch && !hint && (
        <p className="mt-1 text-xs text-muted-foreground">Will be added as new on save</p>
      )}
    </div>
  );
}
