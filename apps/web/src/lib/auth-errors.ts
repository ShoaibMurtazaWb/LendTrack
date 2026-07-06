/** Supabase Auth email rate limit for password reset (per email, per hour). */
export const PASSWORD_RESET_EMAIL_LIMIT = 2;
export const PASSWORD_RESET_RATE_WINDOW = "hour";

export function formatAuthErrorMessage(message: string): string {
  const lower = message.toLowerCase();

  if (
    lower.includes("rate limit") ||
    lower.includes("email limit") ||
    lower.includes("too many")
  ) {
    return `Too many reset emails. You can request up to ${PASSWORD_RESET_EMAIL_LIMIT} password reset emails per ${PASSWORD_RESET_RATE_WINDOW}. Please wait and try again later.`;
  }

  return message;
}
