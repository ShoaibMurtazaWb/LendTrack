import {
  BookOpen,
  Car,
  Dumbbell,
  Flower2,
  Gamepad2,
  Package,
  Shirt,
  Smartphone,
  UtensilsCrossed,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type ItemCategoryId =
  | "tools"
  | "electronics"
  | "books"
  | "sports"
  | "kitchen"
  | "garden"
  | "clothing"
  | "toys"
  | "vehicle"
  | "other";

export type ItemCategory = {
  id: ItemCategoryId;
  label: string;
  icon: LucideIcon;
  bg: string;
  fg: string;
};

export const ITEM_CATEGORIES: ItemCategory[] = [
  { id: "tools", label: "Tools", icon: Wrench, bg: "bg-amber-100 dark:bg-amber-950", fg: "text-amber-700 dark:text-amber-300" },
  { id: "electronics", label: "Electronics", icon: Smartphone, bg: "bg-blue-100 dark:bg-blue-950", fg: "text-blue-700 dark:text-blue-300" },
  { id: "books", label: "Books", icon: BookOpen, bg: "bg-violet-100 dark:bg-violet-950", fg: "text-violet-700 dark:text-violet-300" },
  { id: "sports", label: "Sports", icon: Dumbbell, bg: "bg-orange-100 dark:bg-orange-950", fg: "text-orange-700 dark:text-orange-300" },
  { id: "kitchen", label: "Kitchen", icon: UtensilsCrossed, bg: "bg-rose-100 dark:bg-rose-950", fg: "text-rose-700 dark:text-rose-300" },
  { id: "garden", label: "Garden", icon: Flower2, bg: "bg-emerald-100 dark:bg-emerald-950", fg: "text-emerald-700 dark:text-emerald-300" },
  { id: "clothing", label: "Clothing", icon: Shirt, bg: "bg-pink-100 dark:bg-pink-950", fg: "text-pink-700 dark:text-pink-300" },
  { id: "toys", label: "Toys & Games", icon: Gamepad2, bg: "bg-cyan-100 dark:bg-cyan-950", fg: "text-cyan-700 dark:text-cyan-300" },
  { id: "vehicle", label: "Vehicle", icon: Car, bg: "bg-slate-200 dark:bg-slate-800", fg: "text-slate-700 dark:text-slate-300" },
  { id: "other", label: "Other", icon: Package, bg: "bg-slate-100 dark:bg-slate-800", fg: "text-slate-600 dark:text-slate-300" },
];

export function getItemCategory(id?: string | null): ItemCategory {
  return ITEM_CATEGORIES.find((c) => c.id === id) ?? ITEM_CATEGORIES.find((c) => c.id === "other")!;
}

export function getCategoryLabel(id?: string | null): string {
  return getItemCategory(id).label;
}

/** Match typed text to a known category id, or infer icon category from name. */
export function resolveCategoryFromInput(input: string): ItemCategoryId {
  const n = input.trim().toLowerCase();
  if (!n) return "other";

  const exact = ITEM_CATEGORIES.find(
    (c) => c.id === n || c.label.toLowerCase() === n
  );
  if (exact) return exact.id;

  const partial = ITEM_CATEGORIES.find(
    (c) => c.label.toLowerCase().includes(n) || n.includes(c.label.toLowerCase())
  );
  if (partial) return partial.id;

  return guessCategoryFromName(input);
}

export function guessCategoryFromName(name: string): ItemCategoryId {
  const n = name.toLowerCase();
  if (/drill|hammer|wrench|ladder|mower|tool|saw|screw/.test(n)) return "tools";
  if (/phone|laptop|camera|charger|tablet|speaker|electronic/.test(n)) return "electronics";
  if (/book|novel|magazine|comic/.test(n)) return "books";
  if (/ball|racket|bike|sport|gym|dumbbell/.test(n)) return "sports";
  if (/pan|pot|plate|cup|kitchen|blender|microwave/.test(n)) return "kitchen";
  if (/plant|garden|hose|shovel|flower|lawn/.test(n)) return "garden";
  if (/shirt|jacket|dress|coat|cloth|shoe/.test(n)) return "clothing";
  if (/game|toy|puzzle|console/.test(n)) return "toys";
  if (/car|bike|scooter|vehicle|helmet/.test(n)) return "vehicle";
  return "other";
}
