export type MailRecipient = {
  to: string;
  name?: string;
};

export type MailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SendResult = { sent: true } | { sent: false; reason: string };

export type ReminderType =
  | "pre_due"
  | "overdue"
  | "overdue_contact"
  | "loan_created"
  | "loan_created_contact"
  | "weekly_digest";

export type LoanMailContext = {
  loanId: string;
  itemName: string;
  contactName: string;
  contactEmail?: string | null;
  ownerName: string;
  ownerEmail: string;
  loanedAt: string;
  expectedReturnAt: string;
  direction: "lent_out" | "borrowed";
  loanUrl: string;
  daysUntilDue?: number;
  daysOverdue?: number;
};

/** @deprecated use LoanMailContext */
export type LoanReminderContext = LoanMailContext;
