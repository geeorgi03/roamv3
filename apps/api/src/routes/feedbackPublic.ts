import { Hono } from 'hono';
import { supabase } from '../lib/supabase.js';

const app = new Hono();

/** POST /feedback — submit feedback (no auth); body: { clip_id, timecode_ms, text, commenter_name, share_token } */
app.post('/', async (c) => {
  let body: {
    clip_id?: string;
    timecode_ms?: number;
    text?: string;
    commenter_name?: string;
    share_token?: string;
  };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid request body' }, 400);
  }

  const clip_id = body?.clip_id;
  const timecode_ms = body?.timecode_ms;
  const text = body?.text;
  const commenter_name = body?.commenter_name ?? null;
  const share_token = body?.share_token;

  if (!clip_id || typeof timecode_ms !== 'number' || typeof text !== 'string' || text.trim() === '') {
    return c.json({ error: 'clip_id, timecode_ms, and text are required' }, 400);
  }

  if (!share_token || typeof share_token !== 'string' || share_token.trim() === '') {
    return c.json({ error: 'share_token is required' }, 400);
  }

  const { data: clipRow, error: clipError } = await supabase
    .from('clips')
    .select('id, session_id')
    .eq('id', clip_id)
    .single();

  if (clipError || !clipRow) {
    return c.json({ error: 'Clip not found' }, 404);
  }

  const { data: shareTokenRows, error: tokenError } = await supabase
    .from('share_tokens')
    .select('session_id')
    .eq('token', share_token)
    .is('revoked_at', null)
    .limit(1);

  if (tokenError) return c.json({ error: tokenError.message }, 500);

  const shareToken = shareTokenRows?.[0] ?? null;
  if (!shareToken || shareToken.session_id !== clipRow.session_id) {
    return c.json({ error: 'Invalid or expired share token' }, 403);
  }

  const { data: openRequests, error: fetchError } = await supabase
    .from('feedback_requests')
    .select('id, session_id')
    .eq('clip_id', clip_id)
    .eq('status', 'open')
    .limit(1);

  if (fetchError) return c.json({ error: fetchError.message }, 500);
  const openRequest = openRequests?.[0] ?? null;
  if (!openRequest) {
    return c.json({ error: 'Feedback not open for this clip' }, 403);
  }

  const { error } = await supabase
    .from('clip_comments')
    .insert({
      clip_id,
      session_id: openRequest.session_id,
      timecode_ms,
      text: text.trim(),
      commenter_name: typeof commenter_name === 'string' ? commenter_name.trim() || null : null,
    });

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ ok: true }, 201);
});

export const publicFeedbackRoutes = app;
