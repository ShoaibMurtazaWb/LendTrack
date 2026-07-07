export const CONTACT_SELF_ERROR = "You can't lend to or borrow from yourself.";

export function isOwnContactEmail(
  userEmail: string | null | undefined,
  contactEmail: string | null | undefined
): boolean {
  if (!userEmail?.trim() || !contactEmail?.trim()) return false;
  return userEmail.trim().toLowerCase() === contactEmail.trim().toLowerCase();
}

export function assertNotSelfContact(
  userEmail: string | null | undefined,
  contactEmail: string | null | undefined
): void {
  if (isOwnContactEmail(userEmail, contactEmail)) {
    throw new Error(CONTACT_SELF_ERROR);
  }
}
