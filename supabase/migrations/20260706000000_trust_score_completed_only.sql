-- Trust score: only completed outcomes (returned, overdue, lost) — not in-progress active loans
CREATE OR REPLACE FUNCTION public.get_contact_trust(p_contact_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid;
  v_total int;
  v_on_time int;
  v_returned_late int;
  v_overdue int;
  v_lost int;
  v_active int;
  v_completed int;
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
    COUNT(*) FILTER (
      WHERE status = 'returned'
        AND (returned_at IS NULL OR returned_at <= expected_return_at)
    )::int,
    COUNT(*) FILTER (
      WHERE status = 'returned'
        AND returned_at IS NOT NULL
        AND returned_at > expected_return_at
    )::int,
    COUNT(*) FILTER (WHERE status = 'overdue')::int,
    COUNT(*) FILTER (WHERE status = 'lost')::int,
    COUNT(*) FILTER (WHERE status = 'active')::int
  INTO v_total, v_on_time, v_returned_late, v_overdue, v_lost, v_active
  FROM public.loans
  WHERE contact_id = p_contact_id AND user_id = v_user_id;

  v_completed := v_on_time + v_returned_late + v_overdue + v_lost;

  IF v_completed = 0 THEN
    RETURN jsonb_build_object(
      'trust_score', NULL,
      'total_loans', v_total,
      'completed_loans', 0,
      'returned_on_time', 0,
      'returned_late', 0,
      'overdue', 0,
      'lost', 0,
      'active', v_active,
      'is_verified_neighbor', v_linked,
      'rating_label', 'No history yet',
      'has_score', false
    );
  END IF;

  v_score := 60;
  v_score := v_score + LEAST(v_on_time * 10, 35);
  v_score := v_score - (v_returned_late * 12);
  v_score := v_score - (v_overdue * 15);
  v_score := v_score - (v_lost * 25);
  v_score := v_score + CASE WHEN v_linked THEN 5 ELSE 0 END;
  v_score := GREATEST(0, LEAST(100, v_score));

  RETURN jsonb_build_object(
    'trust_score', v_score,
    'total_loans', v_total,
    'completed_loans', v_completed,
    'returned_on_time', v_on_time,
    'returned_late', v_returned_late,
    'overdue', v_overdue,
    'lost', v_lost,
    'active', v_active,
    'is_verified_neighbor', v_linked,
    'has_score', true,
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
