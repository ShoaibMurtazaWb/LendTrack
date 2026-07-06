-- Direct messaging between linked LendTrack users (contacts with linked_user_id)

CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_one_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_two_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT conversations_user_order CHECK (user_one_id < user_two_id),
  CONSTRAINT conversations_distinct_users CHECK (user_one_id <> user_two_id),
  UNIQUE (user_one_id, user_two_id)
);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  CONSTRAINT messages_body_length CHECK (
    char_length(trim(body)) > 0 AND char_length(body) <= 4000
  )
);

CREATE INDEX messages_conversation_created_idx ON public.messages(conversation_id, created_at DESC);
CREATE INDEX conversations_user_one_idx ON public.conversations(user_one_id);
CREATE INDEX conversations_user_two_idx ON public.conversations(user_two_id);

CREATE OR REPLACE FUNCTION public.touch_conversation_updated_at()
RETURNS trigger AS $$
BEGIN
  UPDATE public.conversations SET updated_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER messages_touch_conversation
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.touch_conversation_updated_at();

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

GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(uuid) TO authenticated;

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY conversations_select ON public.conversations
  FOR SELECT USING (auth.uid() IN (user_one_id, user_two_id));

CREATE POLICY messages_select ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND auth.uid() IN (c.user_one_id, c.user_two_id)
    )
  );

CREATE POLICY messages_insert ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND auth.uid() IN (c.user_one_id, c.user_two_id)
    )
  );

CREATE POLICY messages_mark_read ON public.messages
  FOR UPDATE USING (
    sender_id <> auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND auth.uid() IN (c.user_one_id, c.user_two_id)
    )
  )
  WITH CHECK (read_at IS NOT NULL);

-- Messaging partners can see each other's display name
CREATE POLICY profiles_select_messaging_partners ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE auth.uid() IN (c.user_one_id, c.user_two_id)
        AND id IN (c.user_one_id, c.user_two_id)
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
