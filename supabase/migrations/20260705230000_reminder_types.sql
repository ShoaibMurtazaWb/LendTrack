-- Extend reminder types for contact overdue notifications
ALTER TABLE public.reminder_logs DROP CONSTRAINT IF EXISTS reminder_logs_type_check;
ALTER TABLE public.reminder_logs ADD CONSTRAINT reminder_logs_type_check
  CHECK (type IN ('pre_due', 'overdue', 'overdue_contact', 'weekly_digest'));

CREATE UNIQUE INDEX IF NOT EXISTS reminder_logs_loan_type_unique
  ON public.reminder_logs (loan_id, type);
