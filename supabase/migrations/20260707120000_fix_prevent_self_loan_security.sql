-- prevent_self_loan must read auth.users as SECURITY DEFINER (fixes "permission denied for table users")
CREATE OR REPLACE FUNCTION public.prevent_self_loan()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_email text;
BEGIN
  SELECT email INTO owner_email FROM auth.users WHERE id = NEW.user_id;

  IF owner_email IS NULL THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.contacts c
    WHERE c.id = NEW.contact_id
      AND c.user_id = NEW.user_id
      AND c.email IS NOT NULL
      AND lower(trim(c.email)) = lower(trim(owner_email))
  ) THEN
    RAISE EXCEPTION 'LOAN_SELF: You cannot lend to or borrow from yourself.';
  END IF;

  RETURN NEW;
END;
$$;
