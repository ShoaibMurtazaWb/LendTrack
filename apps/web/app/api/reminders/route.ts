// =============================================================================
// LendTrack :: Daily Reminders Trigger Route Handler
// apps/web/app/api/reminders/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../services/supabaseAdmin.js';
import { sendPreDueReminderEmail, sendOverdueReminderEmail } from '../../../../services/mailer.js';

const preDueDays = parseInt(process.env.REMINDER_PRE_DUE_DAYS || '3', 10);

export async function POST(req: NextRequest) {
  try {
    const report = await runReminderCheck();
    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    console.error('[API Reminders] Error running checks:', error);
    return NextResponse.json(
      { success: false, error: { code: 'CRON_ERROR', message: error.message || 'Cron execution failed.' } },
      { status: 500 }
    );
  }
}

// GET is also supported to make testing reminders from a browser simple!
export async function GET(req: NextRequest) {
  try {
    const report = await runReminderCheck();
    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    console.error('[API Reminders] Error running checks:', error);
    return NextResponse.json(
      { success: false, error: { code: 'CRON_ERROR', message: error.message || 'Cron execution failed.' } },
      { status: 500 }
    );
  }
}

async function runReminderCheck() {
  console.log('[Reminders Trigger] Running daily loan reminder checks...');
  
  const report: {
    totalChecked: number;
    remindersSent: Array<{ loanId: string; type: string; email: string; status: string }>;
    errors: string[];
  } = {
    totalChecked: 0,
    remindersSent: [],
    errors: [],
  };

  const { data: loans, error } = await supabaseAdmin
    .from('loans')
    .select(`
      *,
      item:items(*),
      contact:contacts(*)
    `)
    .in('status', ['active', 'overdue']);

  if (error) {
    throw new Error(`Failed to fetch loans: ${error.message}`);
  }

  if (!loans || loans.length === 0) {
    console.log('[Reminders Trigger] No active/overdue loans found.');
    return report;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const today = new Date(todayStr);
  report.totalChecked = loans.length;

  for (const loan of loans) {
    if (!loan.expected_return_at) continue;

    // Fetch user profile
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', loan.user_id)
      .single();

    if (profileErr || !profile) {
      report.errors.push(`Profile not found for user ${loan.user_id}`);
      continue;
    }

    const emailRemindersEnabled = profile.notification_prefs?.email_reminders ?? true;
    if (!emailRemindersEnabled) continue;

    // Get user's email from auth.users (requires service role key)
    const { data: authUser, error: authUserErr } = await supabaseAdmin.auth.admin.getUserById(loan.user_id);
    if (authUserErr || !authUser || !authUser.user?.email) {
      report.errors.push(`Failed to fetch auth email for user ${loan.user_id}`);
      continue;
    }

    const email = authUser.user.email;
    const userName = profile.full_name || 'LendTrack User';
    const itemName = loan.item?.name || 'Item';
    const contactName = loan.contact?.name || 'Friend';
    const expectedReturnDate = new Date(loan.expected_return_at);
    const timeDiff = expectedReturnDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysDiff < 0) {
      // Overdue
      const { data: logs } = await supabaseAdmin
        .from('reminder_logs')
        .select('*')
        .eq('loan_id', loan.id)
        .eq('type', 'overdue')
        .gte('sent_at', todayStr + 'T00:00:00Z');

      if (logs && logs.length > 0) continue;

      if (loan.status !== 'overdue') {
        await supabaseAdmin
          .from('loans')
          .update({ status: 'overdue' })
          .eq('id', loan.id);
      }

      const emailResult = await sendOverdueReminderEmail({
        to: email,
        userName,
        itemName,
        contactName,
        expectedReturnAt: loan.expected_return_at,
        direction: loan.direction,
      });

      await supabaseAdmin.from('reminder_logs').insert({
        loan_id: loan.id,
        type: 'overdue',
        status: emailResult.success ? 'sent' : 'failed',
      });

      report.remindersSent.push({
        loanId: loan.id,
        type: 'overdue',
        email,
        status: emailResult.success ? 'sent' : 'failed',
      });

    } else if (daysDiff >= 0 && daysDiff <= preDueDays) {
      // Pre-due
      const { data: logs } = await supabaseAdmin
        .from('reminder_logs')
        .select('*')
        .eq('loan_id', loan.id)
        .eq('type', 'pre_due');

      if (logs && logs.length > 0) continue;

      const emailResult = await sendPreDueReminderEmail({
        to: email,
        userName,
        itemName,
        contactName,
        expectedReturnAt: loan.expected_return_at,
        direction: loan.direction,
      });

      await supabaseAdmin.from('reminder_logs').insert({
        loan_id: loan.id,
        type: 'pre_due',
        status: emailResult.success ? 'sent' : 'failed',
      });

      report.remindersSent.push({
        loanId: loan.id,
        type: 'pre_due',
        email,
        status: emailResult.success ? 'sent' : 'failed',
      });
    }
  }

  console.log(`[Reminders Trigger] Reminders sent: ${report.remindersSent.length}, Errors: ${report.errors.length}`);
  return report;
}
