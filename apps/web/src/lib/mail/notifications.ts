import { deliverMail } from "./transport";
import {
  buildMail,
  greeting,
  paragraph,
  keyValueTable,
  ctaButton,
  alertBox,
  bulletList,
  appUrl,
} from "./template";
import type { LoanMailContext, MailPayload, SendResult, WeeklyDigestMailContext } from "./types";

function send(payload: MailPayload): Promise<SendResult> {
  return deliverMail(payload);
}

export function sendLoginNotification(opts: {
  to: string;
  name: string;
  deviceLabel: string;
  ipAddress?: string;
  loginTime: string;
}): Promise<SendResult> {
  const title = "New sign-in detected";
  const { html, text } = buildMail(title, [
    greeting(opts.name),
    paragraph("Your LendTrack account was just accessed. Session details:"),
    keyValueTable([
      { label: "Time", value: opts.loginTime },
      { label: "Device", value: opts.deviceLabel },
      ...(opts.ipAddress ? [{ label: "IP address", value: opts.ipAddress }] : []),
    ]),
    paragraph("If this wasn't you, change your password immediately in Settings."),
  ]);

  return send({ to: opts.to, subject: "New sign-in to your LendTrack account", html, text });
}

export function sendPasswordResetEmail(opts: {
  to: string;
  name?: string;
  resetUrl: string;
}): Promise<SendResult> {
  const title = "Reset your password";
  const { html, text } = buildMail(title, [
    greeting(opts.name),
    paragraph("We received a request to reset your LendTrack password."),
    paragraph("Use the button below to choose a new password."),
    ctaButton("Reset password", opts.resetUrl),
    alertBox("If you didn't request this, you can safely ignore this email.", "info"),
  ]);

  return send({
    to: opts.to,
    subject: "Reset your LendTrack password",
    html,
    text,
  });
}

export function sendPremiumEndingSoon(opts: {
  to: string;
  name: string;
  endDate: string;
}): Promise<SendResult> {
  const url = appUrl("/settings/billing");
  const { html, text } = buildMail("Premium ending soon", [
    greeting(opts.name),
    paragraph(`Your Premium subscription ends on <strong>${opts.endDate}</strong>.`),
    bulletList([
      "Only your <strong>5 oldest active loans</strong> stay fully usable on Free",
      "Extra active loans will be <strong>locked</strong> until you upgrade again",
    ]),
    ctaButton("Renew Premium", url),
  ]);

  return send({ to: opts.to, subject: "Your LendTrack Premium is ending soon", html, text });
}

export function sendPremiumEnded(opts: {
  to: string;
  name: string;
  lockedCount: number;
}): Promise<SendResult> {
  const url = appUrl("/settings/billing");
  const { html, text } = buildMail("Premium has ended", [
    greeting(opts.name),
    paragraph("Your account is now on the <strong>Free plan</strong>."),
    opts.lockedCount > 0
      ? alertBox(
          `<strong>${opts.lockedCount}</strong> loan${opts.lockedCount === 1 ? "" : "s"} locked. Your 5 oldest active loans remain usable.`
        )
      : paragraph("Your active loans within the free limit remain fully usable."),
    ctaButton("Upgrade to Premium", url),
  ]);

  return send({ to: opts.to, subject: "Your LendTrack Premium has ended", html, text });
}

export function sendPremiumPaymentFailed(opts: {
  to: string;
  name: string;
  amountDue?: string;
}): Promise<SendResult> {
  const url = appUrl("/settings/billing");
  const { html, text } = buildMail("Payment failed", [
    greeting(opts.name),
    paragraph(
      `We couldn't process your Premium payment${opts.amountDue ? ` of <strong>${opts.amountDue}</strong>` : ""}. Update your payment method to keep unlimited loans.`
    ),
    ctaButton("Update billing & retry", url),
  ]);

  return send({ to: opts.to, subject: "Action required: Premium payment failed", html, text });
}

export function sendLoanDueSoonReminder(opts: LoanMailContext): Promise<SendResult> {
  const title = "Return date approaching";
  const directionText =
    opts.direction === "lent_out"
      ? `You lent <strong>${opts.itemName}</strong> to ${opts.contactName}.`
      : `You borrowed <strong>${opts.itemName}</strong> from ${opts.contactName}.`;

  const { html, text } = buildMail(title, [
    greeting(opts.ownerName),
    paragraph(directionText),
    keyValueTable([
      { label: "Due date", value: opts.expectedReturnAt },
      { label: "Time left", value: `${opts.daysUntilDue} day${opts.daysUntilDue === 1 ? "" : "s"}` },
    ]),
    paragraph("Follow up with your contact or mark the loan as returned once it's back."),
    ctaButton("View loan", opts.loanUrl),
  ]);

  return send({ to: opts.ownerEmail, subject: `Reminder: ${opts.itemName} due ${opts.expectedReturnAt}`, html, text });
}

export function sendLoanOverdueOwner(opts: LoanMailContext): Promise<SendResult> {
  const title = "Loan is overdue";
  const { html, text } = buildMail(title, [
    greeting(opts.ownerName),
    paragraph(
      `<strong>${opts.itemName}</strong> with ${opts.contactName} was due on ${opts.expectedReturnAt} and is now overdue.`
    ),
    alertBox("Mark the loan as <strong>Returned</strong> when you get the item back, or <strong>Lost</strong> if it won't be returned."),
    ctaButton("Manage loan", opts.loanUrl),
  ]);

  return send({ to: opts.ownerEmail, subject: `Overdue: ${opts.itemName} — action needed`, html, text });
}

export function sendLoanOverdueContact(opts: LoanMailContext): Promise<SendResult> {
  if (!opts.contactEmail) return Promise.resolve({ sent: false, reason: "No contact email" });

  const title = "Return date passed";
  const { html, text } = buildMail(title, [
    greeting(opts.contactName),
    paragraph(
      `This is a friendly reminder from LendTrack: <strong>${opts.itemName}</strong> was expected back on ${opts.expectedReturnAt}.`
    ),
    paragraph("Please return the item to the owner as soon as you can."),
    alertBox("If you've already returned it, ask the owner to update the loan status in LendTrack.", "info"),
  ]);

  return send({
    to: opts.contactEmail,
    subject: `Overdue reminder: please return ${opts.itemName}`,
    html,
    text,
  });
}

function directionLabel(direction: "lent_out" | "borrowed") {
  return direction === "lent_out" ? "Lent out" : "Borrowed";
}

export function sendLoanCreatedOwner(opts: LoanMailContext): Promise<SendResult> {
  const title = "Loan recorded";
  const summary =
    opts.direction === "lent_out"
      ? `You lent <strong>${opts.itemName}</strong> to ${opts.contactName}.`
      : `You borrowed <strong>${opts.itemName}</strong> from ${opts.contactName}.`;

  const { html, text } = buildMail(title, [
    greeting(opts.ownerName),
    paragraph(summary),
    paragraph("Your loan is saved in LendTrack. We'll remind you before the return date."),
    keyValueTable([
      { label: "Item", value: opts.itemName },
      { label: "Contact", value: opts.contactName },
      { label: "Direction", value: directionLabel(opts.direction) },
      { label: "Loaned on", value: opts.loanedAt },
      { label: "Return by", value: opts.expectedReturnAt },
    ]),
    ctaButton("View loan", opts.loanUrl),
  ]);

  return send({
    to: opts.ownerEmail,
    subject: `Loan recorded: ${opts.itemName}`,
    html,
    text,
  });
}

export function sendLoanCreatedContact(opts: LoanMailContext): Promise<SendResult> {
  if (!opts.contactEmail) return Promise.resolve({ sent: false, reason: "No contact email" });

  const title = "Lending exchange recorded";
  const summary =
    opts.direction === "lent_out"
      ? `<strong>${opts.ownerName || "Someone"}</strong> lent you <strong>${opts.itemName}</strong>. Please return it by the date below.`
      : `<strong>${opts.ownerName || "Someone"}</strong> borrowed <strong>${opts.itemName}</strong> from you. It is expected back by the date below.`;

  const { html, text } = buildMail(title, [
    greeting(opts.contactName),
    paragraph(summary),
    paragraph("This notification was sent via LendTrack because your email is on their contact list."),
    keyValueTable([
      { label: "Item", value: opts.itemName },
      { label: "Return by", value: opts.expectedReturnAt },
    ]),
    alertBox("If this looks wrong, ask the other person to update the loan in LendTrack.", "info"),
  ]);

  return send({
    to: opts.contactEmail,
    subject: `LendTrack: ${opts.itemName} — return by ${opts.expectedReturnAt}`,
    html,
    text,
  });
}

export function sendWeeklyDigest(opts: WeeklyDigestMailContext): Promise<SendResult> {
  const title = "Your weekly lending summary";
  const dueLines =
    opts.dueSoon.length > 0
      ? opts.dueSoon
          .slice(0, 5)
          .map((row) => `<li><strong>${row.itemName}</strong> with ${row.contactName} — due ${row.dueDate}</li>`)
          .join("")
      : "<li>Nothing due in the next 7 days</li>";

  const { html, text } = buildMail(title, [
    greeting(opts.ownerName),
    paragraph("Here's your LendTrack snapshot for the week ahead."),
    keyValueTable([
      { label: "Active loans", value: String(opts.activeCount) },
      { label: "Overdue", value: String(opts.overdueCount) },
      { label: "Returned (all time)", value: String(opts.returnedCount) },
    ]),
    paragraph("<strong>Due in the next 7 days</strong>"),
    `<ul style="margin:0;padding-left:20px;line-height:1.6">${dueLines}</ul>`,
    ctaButton("Open dashboard", opts.dashboardUrl),
    paragraph("You're receiving this because weekly digest is enabled in Settings."),
  ]);

  return send({
    to: opts.ownerEmail,
    subject: "Your LendTrack weekly digest",
    html,
    text,
  });
}
