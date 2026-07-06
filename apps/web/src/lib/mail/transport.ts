import nodemailer from "nodemailer";
import type { MailPayload, SendResult } from "./types";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE !== "false",
    auth: { user, pass },
  });

  return transporter;
}

export function isMailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function deliverMail(payload: MailPayload): Promise<SendResult> {
  const transport = getTransporter();
  if (!transport) return { sent: false, reason: "SMTP not configured" };

  const from = process.env.EMAIL_FROM || "LendTrack <noreply@lendtrack.app>";

  try {
    await transport.sendMail({ from, ...payload });
    return { sent: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Send failed";
    return { sent: false, reason: message };
  }
}
