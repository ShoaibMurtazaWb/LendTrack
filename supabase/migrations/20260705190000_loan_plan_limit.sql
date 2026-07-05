-- Enforce free-tier active loan limit server-side (5 active loans)

CREATE OR REPLACE FUNCTION public.check_active_loan_limit()
RETURNS trigger AS $$
DECLARE
  active_count int;
  user_plan text;
BEGIN
  IF NEW.status IS DISTINCT FROM 'active' THEN
    RETURN NEW;
  END IF;

  SELECT plan INTO user_plan FROM public.profiles WHERE id = NEW.user_id;

  IF user_plan = 'premium' THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO active_count
  FROM public.loans
  WHERE user_id = NEW.user_id
    AND status = 'active'
    AND id IS DISTINCT FROM NEW.id;

  IF active_count >= 5 THEN
    RAISE EXCEPTION 'PLAN_LIMIT: Free plan allows up to 5 active loans. Upgrade to Premium for unlimited loans.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER enforce_active_loan_limit
  BEFORE INSERT OR UPDATE OF status ON public.loans
  FOR EACH ROW
  EXECUTE FUNCTION public.check_active_loan_limit();
