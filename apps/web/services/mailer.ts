// =============================================================================
// LendTrack :: Email Mailer Service (Web Server)
// apps/web/services/mailer.ts
// =============================================================================

import nodemailer from 'nodemailer';

const smtpHost = process.env.SMTP_HOST || 'localhost';
const smtpPort = parseInt(process.env.SMTP_PORT || '1025', 10);
const smtpUser = process.env.SMTP_USER || '';
const smtpPass = process.env.SMTP_PASS || '';
const emailFrom = process.env.EMAIL_FROM || 'noreply@lendtrack.app';

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: smtpUser && smtpPass ? {
    user: smtpUser,
    pass: smtpPass,
  } : undefined,
});

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendMailOptions) {
  try {
    const info = await transporter.sendMail({
      from: `"LendTrack" <${emailFrom}>`,
      to,
      subject,
      html,
    });
    console.log(`[Mailer Server] Email sent to ${to}. ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Mailer Server] Error sending email to ${to}:`, error);
    return { success: false, error };
  }
}

function renderTemplate(title: string, bodyContent: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: 'Outfit', -apple-system, sans-serif;
          background-color: #0b0f19;
          color: #f3f4f6;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: rgba(17, 24, 39, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }
        .header {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          color: #ffffff;
        }
        .content {
          padding: 40px 30px;
          line-height: 1.6;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          color: #ffffff !important;
          text-decoration: none;
          padding: 12px 28px;
          border-radius: 30px;
          font-weight: 600;
          margin: 20px 0;
        }
        .footer {
          background: #0d1222;
          padding: 20px 30px;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
        .footer a {
          color: #818cf8;
          text-decoration: none;
        }
        .info-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 15px;
          margin: 15px 0;
        }
        .label {
          color: #9ca3af;
          font-size: 13px;
          font-weight: 500;
        }
        .value {
          color: #f3f4f6;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>LendTrack</h1>
        </div>
        <div class="content">
          ${bodyContent}
        </div>
        <div class="footer">
          <p>Sent by LendTrack. Tracking tools & items lent or borrowed.</p>
          <p><a href="http://localhost:3000/settings">Manage notification settings</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendPreDueReminderEmail({
  to,
  userName,
  itemName,
  contactName,
  expectedReturnAt,
  direction,
}: {
  to: string;
  userName: string;
  itemName: string;
  contactName: string;
  expectedReturnAt: string;
  direction: 'lent_out' | 'borrowed';
}) {
  const isLent = direction === 'lent_out';
  const title = `Reminder: Loan due soon`;
  const subject = `[LendTrack] "${itemName}" is due back soon!`;
  
  const text = isLent 
    ? `<p>Hi ${userName},</p>
       <p>This is a quick reminder that the item you lent out is expected to be returned soon.</p>
       <div class="info-card">
         <p><span class="label">Item:</span> <span class="value">${itemName}</span></p>
         <p><span class="label">Lent To:</span> <span class="value">${contactName}</span></p>
         <p><span class="label">Expected Return:</span> <span class="value">${expectedReturnAt}</span></p>
       </div>`
    : `<p>Hi ${userName},</p>
       <p>This is a quick reminder that the item you borrowed is due back soon.</p>
       <div class="info-card">
         <p><span class="label">Item:</span> <span class="value">${itemName}</span></p>
         <p><span class="label">Borrowed From:</span> <span class="value">${contactName}</span></p>
         <p><span class="label">Expected Return:</span> <span class="value">${expectedReturnAt}</span></p>
       </div>`;

  const bodyContent = `
    ${text}
    <div style="text-align: center;">
      <a href="http://localhost:3000/dashboard" class="button">View Dashboard</a>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html: renderTemplate(title, bodyContent),
  });
}

export async function sendOverdueReminderEmail({
  to,
  userName,
  itemName,
  contactName,
  expectedReturnAt,
  direction,
}: {
  to: string;
  userName: string;
  itemName: string;
  contactName: string;
  expectedReturnAt: string;
  direction: 'lent_out' | 'borrowed';
}) {
  const isLent = direction === 'lent_out';
  const title = `Overdue Alert`;
  const subject = `[LendTrack OVERDUE] "${itemName}" was expected back on ${expectedReturnAt}!`;

  const text = isLent
    ? `<p>Hi ${userName},</p>
       <p style="color: #ef4444; font-weight: 600;">The following item lent out is now OVERDUE:</p>
       <div class="info-card" style="border-left: 4px solid #ef4444;">
         <p><span class="label">Item:</span> <span class="value">${itemName}</span></p>
         <p><span class="label">Lent To:</span> <span class="value">${contactName}</span></p>
         <p><span class="label">Due Date:</span> <span class="value">${expectedReturnAt}</span></p>
       </div>`
    : `<p>Hi ${userName},</p>
       <p style="color: #ef4444; font-weight: 600;">The following item you borrowed is now OVERDUE:</p>
       <div class="info-card" style="border-left: 4px solid #ef4444;">
         <p><span class="label">Item:</span> <span class="value">${itemName}</span></p>
         <p><span class="label">Borrowed From:</span> <span class="value">${contactName}</span></p>
         <p><span class="label">Due Date:</span> <span class="value">${expectedReturnAt}</span></p>
       </div>`;

  const bodyContent = `
    ${text}
    <div style="text-align: center;">
      <a href="http://localhost:3000/dashboard" class="button">View Overdue Loan</a>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html: renderTemplate(title, bodyContent),
  });
}
