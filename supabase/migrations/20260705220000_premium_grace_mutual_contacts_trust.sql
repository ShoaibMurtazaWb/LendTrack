-- Loan locking for free-tier grace after premium expires
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS is_locked boolean NOT NULL DEFAULT false;

-- Link contacts to registered LendTrack users
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS linked_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS contacts_linked_user_idx ON public.contacts(linked_user_id);
CREATE INDEX IF NOT EXISTS loans_is_locked_idx ON public.loans(is_locked);

CREATE UNIQUE INDEX IF NOT EXISTS contacts_user_email_unique
  ON public.contacts (user_id, lower(email))
  WHERE deleted_at IS NULL AND email IS NOT NULL;

-- Lock/unlock loans based on plan (oldest 5 active/overdue stay unlocked on free)
CREATE OR REPLACE FUNCTION public.apply_loan_plan_locks(p_user_id uuid)
RETURNS void AS $$
DECLARE
  user_plan text;
BEGIN
  SELECT plan INTO user_plan FROM public.profiles WHERE id = p_user_id;

  IF user_plan = 'premium' THEN
    UPDATE public.loans SET is_locked = false WHERE user_id = p_user_id;
    RETURN;
  END IF;

  UPDATE public.loans
  SET is_locked = false
  WHERE user_id = p_user_id AND status NOT IN ('active', 'overdue');

  WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn
    FROM public.loans
    WHERE user_id = p_user_id AND status IN ('active', 'overdue')
  )
  UPDATE public.loans l
  SET is_locked = (r.rn > 5)
  FROM ranked r
  WHERE l.id = r.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sync mutual contact when email matches a registered user
CREATE OR REPLACE FUNCTION public.sync_mutual_contact()
RETURNS trigger AS $$
DECLARE
  other_user_id uuid;
  my_email text;
  my_name text;
BEGIN
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

DROP TRIGGER IF EXISTS sync_mutual_contact_trigger ON public.contacts;
CREATE TRIGGER sync_mutual_contact_trigger
  BEFORE INSERT OR UPDATE OF email ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_mutual_contact();

-- When a new user signs up, link existing contacts and create reverse entries
CREATE OR REPLACE FUNCTION public.link_contacts_for_new_user()
RETURNS trigger AS $$
DECLARE
  user_email text;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.id;
  IF user_email IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE public.contacts
  SET linked_user_id = NEW.id
  WHERE lower(email) = lower(user_email)
    AND user_id != NEW.id
    AND deleted_at IS NULL;

  INSERT INTO public.contacts (user_id, name, email, linked_user_id)
  SELECT
    c.user_id,
    COALESCE(NULLIF(trim(NEW.full_name), ''), split_part(user_email, '@', 1)),
    user_email,
    NEW.id
  FROM public.contacts c
  WHERE lower(c.email) = lower(user_email)
    AND c.user_id != NEW.id
    AND c.deleted_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.contacts existing
      WHERE existing.user_id = c.user_id
        AND lower(existing.email) = lower(user_email)
        AND existing.deleted_at IS NULL
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS link_contacts_for_new_user_trigger ON public.profiles;
CREATE TRIGGER link_contacts_for_new_user_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.link_contacts_for_new_user();

-- Updated loan limit: only unlocked active loans count toward free limit
CREATE OR REPLACE FUNCTION public.check_active_loan_limit()
RETURNS trigger AS $$
DECLARE
  active_count int;
  user_plan text;
BEGIN
  IF NEW.status IS DISTINCT FROM 'active' OR NEW.is_locked = true THEN
    RETURN NEW;
  END IF;

  SELECT plan INTO user_plan FROM public.profiles WHERE id = NEW.user_id;

  IF user_plan = 'premium' THEN
    NEW.is_locked := false;
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO active_count
  FROM public.loans
  WHERE user_id = NEW.user_id
    AND status = 'active'
    AND is_locked = false
    AND id IS DISTINCT FROM NEW.id;

  IF active_count >= 5 THEN
    RAISE EXCEPTION 'PLAN_LIMIT: Free plan allows up to 5 active loans. Upgrade to Premium for unlimited loans.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Prevent edits on locked loans (except unlocking via plan change)
CREATE OR REPLACE FUNCTION public.prevent_locked_loan_changes()
RETURNS trigger AS $$
BEGIN
  IF OLD.is_locked = true AND NEW.is_locked = true THEN
    IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('returned', 'lost') THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'LOAN_LOCKED: This loan is locked. Upgrade to Premium to manage all active loans.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_locked_loan_changes_trigger ON public.loans;
CREATE TRIGGER prevent_locked_loan_changes_trigger
  BEFORE UPDATE ON public.loans
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_locked_loan_changes();

-- Contact trust score (0–100) based on loan history with this contact
CREATE OR REPLACE FUNCTION public.get_contact_trust(p_contact_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid;
  v_total int;
  v_returned int;
  v_on_time int;
  v_overdue int;
  v_lost int;
  v_active int;
  v_linked boolean;
  v_score int;
BEGIN
  SELECT user_id, linked_user_id IS NOT NULL
  INTO v_user_id, v_linked
  FROM public.contacts
  WHERE id = p_contact_id AND deleted_at IS NULL;

  IF v_user_id IS NULL OR v_user_id != auth.uid() THEN
    RETURN NULL;
  END IF;

  SELECT
    COUNT(*)::int,
    COUNT(*) FILTER (WHERE status = 'returned')::int,
    COUNT(*) FILTER (WHERE status = 'returned' AND (returned_at IS NULL OR returned_at <= expected_return_at))::int,
    COUNT(*) FILTER (WHERE status = 'overdue')::int,
    COUNT(*) FILTER (WHERE status = 'lost')::int,
    COUNT(*) FILTER (WHERE status = 'active')::int
  INTO v_total, v_returned, v_on_time, v_overdue, v_lost, v_active
  FROM public.loans
  WHERE contact_id = p_contact_id AND user_id = v_user_id;

  v_score := 50;
  v_score := v_score + LEAST(v_on_time * 8, 32);
  v_score := v_score - (v_overdue * 12);
  v_score := v_score - (v_lost * 20);
  v_score := v_score + CASE WHEN v_linked THEN 10 ELSE 0 END;
  v_score := GREATEST(0, LEAST(100, v_score));

  RETURN jsonb_build_object(
    'trust_score', v_score,
    'total_loans', v_total,
    'returned_on_time', v_on_time,
    'overdue', v_overdue,
    'lost', v_lost,
    'active', v_active,
    'is_verified_neighbor', v_linked,
    'rating_label', CASE
      WHEN v_score >= 85 THEN 'Excellent'
      WHEN v_score >= 70 THEN 'Good'
      WHEN v_score >= 50 THEN 'Fair'
      WHEN v_score >= 30 THEN 'Caution'
      ELSE 'Poor'
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.get_contact_trust(uuid) TO authenticated;

-- Login audit log
CREATE TABLE IF NOT EXISTS public.login_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ip_address text,
  user_agent text,
  device_label text,
  location_hint text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.login_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY login_sessions_select ON public.login_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY login_sessions_insert ON public.login_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX login_sessions_user_idx ON public.login_sessions(user_id, created_at DESC);
