/** Format YYYY-MM-DD or ISO strings for display. */
export function formatAppDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = value.includes("T") ? new Date(value) : new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
