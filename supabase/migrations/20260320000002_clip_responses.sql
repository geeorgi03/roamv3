-- Viewer responses to shared clips (edge function uses service role; RLS for direct API access)

CREATE TABLE clip_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clip_id uuid NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
  token_id uuid REFERENCES share_tokens(id) ON DELETE SET NULL,
  text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE clip_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY clip_responses_anon_insert ON clip_responses
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY clip_responses_owner_select ON clip_responses
  FOR SELECT TO authenticated
  USING (
    clip_id IN (SELECT id FROM clips WHERE user_id = auth.uid())
  );
