/** Supabase Auth email rate limit for password reset (per email, per hour). */
export const PASSWORD_RESET_EMAIL_LIMIT = 2;
export const PASSWORD_RESET_RATE_WINDOW = "hour";

export const DUPLICATE_ACCOUNT_MESSAGE =
  "An account with this email already exists. Please log in instead.";

export function normalizeAuthEmail(email: string): string {
  return email.trim().toLowerCase();
}

type SignUpLikeResult = {
  user?: { identities?: { length: number }[] } | null;
  session?: unknown | null;
};

/** Supabase may return success with empty identities when email already exists. */
export function isDuplicateSignUpResult(data: SignUpLikeResult | null | undefined): boolean {
  const identities = data?.user?.identities;
  return Boolean(data?.user && Array.isArray(identities) && identities.length === 0);
}

export function isDuplicateAccountError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("already registered") ||
    lower.includes("already been registered") ||
    lower.includes("user already exists") ||
    lower.includes("email address is already") ||
    lower.includes("already exists") ||
    lower.includes("duplicate") ||
    lower === DUPLICATE_ACCOUNT_MESSAGE.toLowerCase()
  );
}

export function formatAuthErrorMessage(message: string): string {
  const lower = message.toLowerCase();

  if (isDuplicateAccountError(message)) {
    return DUPLICATE_ACCOUNT_MESSAGE;
  }

  if (
    lower.includes("rate limit") ||
    lower.includes("email limit") ||
    lower.includes("too many")
  ) {
    return `Too many reset emails. You can request up to ${PASSWORD_RESET_EMAIL_LIMIT} password reset emails per ${PASSWORD_RESET_RATE_WINDOW}. Please wait and try again later.`;
  }

  return message;
}
