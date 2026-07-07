export const FREE_ACTIVE_LOAN_LIMIT = 5;

export function isPlanLimitError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("plan_limit") ||
    m.includes("free plan allows") ||
    m.includes("5 active loans")
  );
}
