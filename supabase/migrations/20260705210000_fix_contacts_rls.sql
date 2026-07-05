-- Fix contacts soft-delete: SELECT policy blocked RETURNING rows with deleted_at set.
-- Also ensure UPDATE WITH CHECK allows archiving.

DROP POLICY IF EXISTS "Users can view own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can update own contacts" ON public.contacts;

-- App filters deleted_at IS NULL; policy allows all own rows (needed for update return)
CREATE POLICY "Users can view own contacts"
  ON public.contacts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own contacts"
  ON public.contacts FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
