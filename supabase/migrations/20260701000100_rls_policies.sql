-- Row Level Security policies

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_logs ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- Contacts
CREATE POLICY "Users can view own contacts"
  ON public.contacts FOR SELECT
  USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Users can insert own contacts"
  ON public.contacts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own contacts"
  ON public.contacts FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own contacts"
  ON public.contacts FOR DELETE
  USING (user_id = auth.uid());

-- Items
CREATE POLICY "Users can view own items"
  ON public.items FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own items"
  ON public.items FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own items"
  ON public.items FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own items"
  ON public.items FOR DELETE
  USING (user_id = auth.uid());

-- Loans
CREATE POLICY "Users can view own loans"
  ON public.loans FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own loans"
  ON public.loans FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own loans"
  ON public.loans FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own loans"
  ON public.loans FOR DELETE
  USING (user_id = auth.uid());

-- Reminder logs: no client access (service role only)
CREATE POLICY "No client access to reminder_logs"
  ON public.reminder_logs FOR ALL
  USING (false);
