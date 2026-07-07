-- Block users from adding themselves as a contact or creating self-loans

CREATE OR REPLACE FUNCTION public.prevent_self_contact()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_email text;
BEGIN
  IF NEW.email IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT email INTO owner_email FROM auth.users WHERE id = NEW.user_id;

  IF owner_email IS NOT NULL AND lower(trim(NEW.email)) = lower(trim(owner_email)) THEN
    RAISE EXCEPTION 'CONTACT_SELF: You cannot add yourself as a contact.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_self_contact_trigger ON public.contacts;
CREATE TRIGGER prevent_self_contact_trigger
  BEFORE INSERT OR UPDATE OF email ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_contact();

CREATE OR REPLACE FUNCTION public.prevent_self_loan()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.contacts c
    JOIN auth.users u ON u.id = NEW.user_id
    WHERE c.id = NEW.contact_id
      AND c.user_id = NEW.user_id
      AND c.email IS NOT NULL
      AND lower(trim(c.email)) = lower(trim(u.email))
  ) THEN
    RAISE EXCEPTION 'LOAN_SELF: You cannot lend to or borrow from yourself.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_self_loan_trigger ON public.loans;
CREATE TRIGGER prevent_self_loan_trigger
  BEFORE INSERT ON public.loans
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_loan();
