/** Shared loan counting rules — keep dashboard, loans, and contacts in sync. */

export type LoanStatLike = {
  status: string;
  is_locked?: boolean;
};

/** Status `active`, not locked — matches dashboard `active_count`. */
export function isUnlockedActiveLoan(loan: LoanStatLike): boolean {
  return loan.status === "active" && !loan.is_locked;
}

/** Status `overdue`, not locked — matches dashboard `overdue_count`. */
export function isUnlockedOverdueLoan(loan: LoanStatLike): boolean {
  return loan.status === "overdue" && !loan.is_locked;
}

/** Any in-flight loan (active or overdue), not locked. */
export function isOpenLoan(loan: LoanStatLike): boolean {
  return (loan.status === "active" || loan.status === "overdue") && !loan.is_locked;
}

export function countLoanStats(loans: LoanStatLike[]) {
  let active = 0;
  let overdue = 0;
  let open = 0;
  let returned = 0;
  let locked = 0;

  for (const loan of loans) {
    if (loan.is_locked) locked++;
    if (loan.status === "returned") returned++;
    if (isUnlockedActiveLoan(loan)) active++;
    if (isUnlockedOverdueLoan(loan)) overdue++;
    if (isOpenLoan(loan)) open++;
  }

  return { active, overdue, open, returned, locked };
}
