import { createAdminClient } from "@/lib/supabase-admin";
import {
  isMailConfigured,
  sendLoanDueSoonReminder,
  sendLoanOverdueContact,
  sendLoanOverdueOwner,
  type LoanReminderContext,
  type ReminderType,
} from "@/lib/mail";
import { appUrl } from "@/lib/mail/template";

const LOAN_SELECT =
  "id, user_id, direction, loaned_at, expected_return_at, status, item:items(name), contact:contacts(name, email)";

function localDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function daysBetween(from: string, to: string) {
  const a = new Date(from + "T12:00:00");
  const b = new Date(to + "T12:00:00");
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

async function alreadySent(loanId: string, type: ReminderType) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("reminder_logs")
    .select("id")
    .eq("loan_id", loanId)
    .eq("type", type)
    .eq("status", "sent")
    .maybeSingle();

  return !!data;
}

async function logReminder(loanId: string, type: ReminderType, status: "sent" | "failed") {
  const supabase = createAdminClient();
  await supabase.from("reminder_logs").insert({ loan_id: loanId, type, status });
}

async function getOwnerEmail(userId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase.auth.admin.getUserById(userId);
  return data.user?.email ?? null;
}

type LoanRow = {
  id: string;
  user_id: string;
  direction: "lent_out" | "borrowed";
  loaned_at: string;
  expected_return_at: string;
  status: string;
  item: { name: string } | null;
  contact: { name: string; email: string | null } | null;
};

function buildContext(
  loan: LoanRow,
  ownerEmail: string,
  ownerName: string,
  extra?: Partial<LoanReminderContext>
): LoanReminderContext {
  return {
    loanId: loan.id,
    itemName: loan.item?.name ?? "Item",
    contactName: loan.contact?.name ?? "Contact",
    contactEmail: loan.contact?.email,
    ownerName,
    ownerEmail,
    loanedAt: loan.loaned_at,
    expectedReturnAt: loan.expected_return_at,
    direction: loan.direction,
    loanUrl: appUrl(`/loans/${loan.id}`),
    ...extra,
  };
}

export async function processLoanRemindersForUser(userId: string) {
  if (!isMailConfigured()) return { processed: 0, skipped: "SMTP not configured" };

  const supabase = createAdminClient();
  const today = localDateString();

  const { data: profile } = await supabase
    .from("profiles")
    .select("notification_prefs")
    .eq("id", userId)
    .single();

  if (profile?.notification_prefs?.email_reminders === false) {
    return { processed: 0, skipped: "Reminders disabled" };
  }

  const ownerEmail = await getOwnerEmail(userId);
  if (!ownerEmail) return { processed: 0, skipped: "No owner email" };

  const { data: ownerProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .single();

  const ownerName = ownerProfile?.full_name ?? "";

  const { data: loans, error } = await supabase
    .from("loans")
    .select(LOAN_SELECT)
    .eq("user_id", userId)
    .in("status", ["active", "overdue"])
    .eq("is_locked", false);

  if (error || !loans?.length) return { processed: 0 };

  let processed = 0;

  for (const loan of (loans as unknown as LoanRow[])) {
    const daysUntil = daysBetween(today, loan.expected_return_at);
    const ctx = buildContext(loan, ownerEmail, ownerName);

    // Due in 1–3 days
    if (loan.status === "active" && daysUntil >= 1 && daysUntil <= 3) {
      if (!(await alreadySent(loan.id, "pre_due"))) {
        const result = await sendLoanDueSoonReminder({ ...ctx, daysUntilDue: daysUntil });
        await logReminder(loan.id, "pre_due", result.sent ? "sent" : "failed");
        if (result.sent) processed++;
      }
    }

    // Overdue — notify owner once
    if (loan.status === "overdue" || (loan.status === "active" && daysUntil < 0)) {
      if (!(await alreadySent(loan.id, "overdue"))) {
        const overdueCtx = { ...ctx, daysOverdue: Math.abs(daysUntil) };
        const ownerResult = await sendLoanOverdueOwner(overdueCtx);
        await logReminder(loan.id, "overdue", ownerResult.sent ? "sent" : "failed");
        if (ownerResult.sent) processed++;

        // Notify contact (borrower/lender party) once
        if (loan.contact?.email && !(await alreadySent(loan.id, "overdue_contact"))) {
          const contactResult = await sendLoanOverdueContact(overdueCtx);
          await logReminder(loan.id, "overdue_contact", contactResult.sent ? "sent" : "failed");
          if (contactResult.sent) processed++;
        }
      }
    }
  }

  return { processed };
}

export async function processAllLoanReminders() {
  if (!isMailConfigured()) return { users: 0, processed: 0 };

  const supabase = createAdminClient();
  const { data: profiles } = await supabase.from("profiles").select("id");

  let total = 0;
  for (const profile of profiles ?? []) {
    const result = await processLoanRemindersForUser(profile.id);
    total += result.processed ?? 0;
  }

  return { users: profiles?.length ?? 0, processed: total };
}
