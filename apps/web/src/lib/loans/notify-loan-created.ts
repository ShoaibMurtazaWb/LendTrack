import { createAdminClient } from "@/lib/supabase-admin";
import {
  isMailConfigured,
  sendLoanCreatedContact,
  sendLoanCreatedOwner,
  type LoanMailContext,
} from "@/lib/mail";
import { appUrl } from "@/lib/mail/template";

const LOAN_SELECT =
  "id, user_id, direction, loaned_at, expected_return_at, item:items(name), contact:contacts(name, email)";

type LoanRow = {
  id: string;
  user_id: string;
  direction: "lent_out" | "borrowed";
  loaned_at: string;
  expected_return_at: string;
  item: { name: string } | null;
  contact: { name: string; email: string | null } | null;
};

export async function notifyLoanCreated(loanId: string, userId: string) {
  if (!isMailConfigured()) return { sent: 0, skipped: "SMTP not configured" };

  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, notification_prefs")
    .eq("id", userId)
    .single();

  if (profile?.notification_prefs?.email_reminders === false) {
    return { sent: 0, skipped: "Reminders disabled" };
  }

  const { data: loan, error } = await supabase
    .from("loans")
    .select(LOAN_SELECT)
    .eq("id", loanId)
    .eq("user_id", userId)
    .single();

  if (error || !loan) return { sent: 0, skipped: "Loan not found" };

  const row = loan as unknown as LoanRow;
  const { data: authUser } = await supabase.auth.admin.getUserById(userId);
  const ownerEmail = authUser.user?.email;
  if (!ownerEmail) return { sent: 0, skipped: "No owner email" };

  const ctx: LoanMailContext = {
    loanId: row.id,
    itemName: row.item?.name ?? "Item",
    contactName: row.contact?.name ?? "Contact",
    contactEmail: row.contact?.email,
    ownerName: profile?.full_name ?? "",
    ownerEmail,
    loanedAt: row.loaned_at,
    expectedReturnAt: row.expected_return_at,
    direction: row.direction,
    loanUrl: appUrl(`/loans/${row.id}`),
  };

  let sent = 0;

  const ownerResult = await sendLoanCreatedOwner(ctx);
  await supabase.from("reminder_logs").insert({
    loan_id: loanId,
    type: "loan_created",
    status: ownerResult.sent ? "sent" : "failed",
  });
  if (ownerResult.sent) sent++;

  if (row.contact?.email) {
    const contactResult = await sendLoanCreatedContact(ctx);
    await supabase.from("reminder_logs").insert({
      loan_id: loanId,
      type: "loan_created_contact",
      status: contactResult.sent ? "sent" : "failed",
    });
    if (contactResult.sent) sent++;
  }

  return { sent };
}
