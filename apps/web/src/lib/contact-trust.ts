import type { ContactTrust } from "@lendtrack/shared-types";

/** Completed loan outcomes used for trust scoring */
export function completedLoanCount(trust: ContactTrust | null | undefined): number {
  if (!trust) return 0;
  if (typeof trust.completed_loans === "number") return trust.completed_loans;
  return (
    (trust.returned_on_time ?? 0) +
    (trust.returned_late ?? 0) +
    (trust.overdue ?? 0) +
    (trust.lost ?? 0)
  );
}

export function contactHasTrustScore(trust: ContactTrust | null | undefined): boolean {
  if (!trust || trust.trust_score == null) return false;
  if (trust.has_score === false) return false;
  if (trust.has_score === true) return completedLoanCount(trust) > 0;
  // Legacy RPC (no has_score) — hide default 50 when there is no completed history
  return completedLoanCount(trust) > 0;
}

export function contactTrustScore(trust: ContactTrust | null | undefined): number | null {
  return contactHasTrustScore(trust) ? trust!.trust_score : null;
}
