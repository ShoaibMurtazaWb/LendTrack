-- Prevent stack depth exceeded when sync_mutual_contact triggers nested contact writes
CREATE OR REPLACE FUNCTION public.sync_mutual_contact()
RETURNS trigger AS $$
DECLARE
  other_user_id uuid;
  my_email text;
  my_name text;
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  IF NEW.email IS NULL OR NEW.deleted_at IS NOT NULL THEN
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
