-- Composite indexes for dashboard and filtered loan queries
CREATE INDEX IF NOT EXISTS loans_user_id_status_idx ON public.loans (user_id, status);
CREATE INDEX IF NOT EXISTS loans_user_id_expected_return_at_idx ON public.loans (user_id, expected_return_at);
