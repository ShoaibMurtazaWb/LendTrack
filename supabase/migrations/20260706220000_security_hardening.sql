-- Security hardening: billing integrity, loan locks, FK ownership, messaging

-- ---------------------------------------------------------------------------
-- C1: Block client changes to billing fields on profiles
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_billing_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT auth.role()) IS DISTINCT FROM 'service_role' THEN
    IF NEW.plan IS DISTINCT FROM OLD.plan THEN
      RAISE EXCEPTION 'PROFILE_PROTECTED: plan cannot be changed directly';
    END IF;
    IF NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id THEN
      RAISE EXCEPTION 'PROFILE_PROTECTED: stripe_customer_id cannot be changed directly';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_billing_fields_trigger ON public.profiles;
CREATE TRIGGER protect_profile_billing_fields_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_billing_fields();

-- ---------------------------------------------------------------------------
-- C2: Block client changes to is_locked on loans
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_locked_loan_changes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF (SELECT auth.role()) IS DISTINCT FROM 'service_role' THEN
    IF NEW.is_locked IS DISTINCT FROM OLD.is_locked THEN
      RAISE EXCEPTION 'LOAN_LOCKED: is_locked cannot be changed directly';
    END IF;
  END IF;

  IF OLD.is_locked = true AND NEW.is_locked = true THEN
    IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('returned', 'lost') THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'LOAN_LOCKED: This loan is locked. Upgrade to Premium to manage all active loans.';
  END IF;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- C3: Validate loan item/contact belong to the same user
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_loan_references()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.items
    WHERE id = NEW.item_id AND user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'LOAN_INVALID: item does not belong to you';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.contacts
    WHERE id = NEW.contact_id
      AND user_id = NEW.user_id
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'LOAN_INVALID: contact does not belong to you';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_loan_references_trigger ON public.loans;
CREATE TRIGGER validate_loan_references_trigger
  BEFORE INSERT OR UPDATE OF item_id, contact_id, user_id ON public.loans
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_loan_references();

-- ---------------------------------------------------------------------------
-- C4: Restrict messaging to linked neighbors only
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(p_other_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_me uuid := auth.uid();
  v_one uuid;
  v_two uuid;
  v_id uuid;
BEGIN
  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_other_user_id IS NULL OR p_other_user_id = v_me THEN
    RAISE EXCEPTION 'Invalid recipient';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.contacts
    WHERE user_id = v_me
      AND linked_user_id = p_other_user_id
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'MESSAGING_DENIED: You can only message linked neighbors';
  END IF;

  IF v_me < p_other_user_id THEN
    v_one := v_me;
    v_two := p_other_user_id;
  ELSE
    v_one := p_other_user_id;
    v_two := v_me;
  END IF;

  INSERT INTO public.conversations (user_one_id, user_two_id)
  VALUES (v_one, v_two)
  ON CONFLICT (user_one_id, user_two_id) DO NOTHING;

  SELECT id INTO v_id
  FROM public.conversations
  WHERE user_one_id = v_one AND user_two_id = v_two;

  RETURN v_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- C5: Remove broad messaging profile policy (contacts supply display names)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS profiles_select_messaging_partners ON public.profiles;

-- ---------------------------------------------------------------------------
-- Restrict apply_loan_plan_locks to service role only
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.apply_loan_plan_locks(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_loan_plan_locks(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.apply_loan_plan_locks(uuid) TO service_role;

-- ---------------------------------------------------------------------------
-- Harden SECURITY DEFINER functions with search_path
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_loan_plan_locks(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.touch_conversation_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations SET updated_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- H11: Performance indexes for common queries
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS loans_user_status_idx ON public.loans (user_id, status);
CREATE INDEX IF NOT EXISTS loans_user_status_locked_idx ON public.loans (user_id, status, is_locked);
CREATE INDEX IF NOT EXISTS loans_user_expected_return_idx ON public.loans (user_id, expected_return_at);
