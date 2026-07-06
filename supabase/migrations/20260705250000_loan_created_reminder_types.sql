-- Extend reminder types for loan creation emails
ALTER TABLE public.reminder_logs DROP CONSTRAINT IF EXISTS reminder_logs_type_check;
ALTER TABLE public.reminder_logs ADD CONSTRAINT reminder_logs_type_check
  CHECK (type IN (
    'pre_due',
    'overdue',
    'overdue_contact',
    'loan_created',
    'loan_created_contact',
    'weekly_digest'
  ));
