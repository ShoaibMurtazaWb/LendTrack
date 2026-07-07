-- Stronger fix for stack depth exceeded on contact update (mutual sync recursion)
CREATE OR REPLACE FUNCTION public.sync_mutual_contact()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  other_user_id uuid;
  my_email text;
  my_name text;
BEGIN
  IF current_setting('lendtrack.syncing_mutual_contact', true) = 'on' THEN
    RETURN NEW;
  END IF;

  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  IF NEW.email IS NULL OR NEW.deleted_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.email IS NOT DISTINCT FROM OLD.email THEN
    RETURN NEW;
  END IF;

  SELECT id INTO other_user_id
  FROM auth.users
  WHERE lower(email) = lower(NEW.email);

  IF other_user_id IS NULL OR other_user_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  NEW.linked_user_id := other_user_id;

  SELECT email INTO my_email FROM auth.users WHERE id = NEW.user_id;
  SELECT full_name INTO my_name FROM public.profiles WHERE id = NEW.user_id;

  PERFORM set_config('lendtrack.syncing_mutual_contact', 'on', true);

  IF NOT EXISTS (
    SELECT 1 FROM public.contacts
    WHERE user_id = other_user_id
      AND lower(email) = lower(my_email)
      AND deleted_at IS NULL
  ) THEN
    INSERT INTO public.contacts (user_id, name, email, linked_user_id)
    VALUES (
      other_user_id,
      COALESCE(NULLIF(trim(my_name), ''), split_part(my_email, '@', 1)),
      my_email,
      NEW.user_id
    );
  ELSE
    UPDATE public.contacts
    SET linked_user_id = NEW.user_id
    WHERE user_id = other_user_id
      AND lower(email) = lower(my_email)
      AND deleted_at IS NULL;
  END IF;

  PERFORM set_config('lendtrack.syncing_mutual_contact', 'off', true);

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    PERFORM set_config('lendtrack.syncing_mutual_contact', 'off', true);
    RAISE;
END;
$$;

DROP TRIGGER IF EXISTS sync_mutual_contact_trigger ON public.contacts;
CREATE TRIGGER sync_mutual_contact_trigger
  BEFORE INSERT OR UPDATE OF email ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_mutual_contact();
