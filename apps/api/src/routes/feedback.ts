import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';
import type { ClipComment } from '@roam/types';

const app = new Hono<{ Variables: { userId: string } }>()
  .use('*', requireAuth);

/** Verify clip belongs to user via session; returns clip_id or null */
async function getClipForUser(
  clipId: string,
  userId: string
): Promise<{ clip_id: string; session_id: string } | null> {
  const { data } = await supabase
    .from('clips')
    .select('id, session_id, sessions!inner(user_id)')
    .eq('id', clipId)
    .eq('sessions.user_id', userId)
    .single();
  return data ? { clip_id: data.id, session_id: data.session_id } : null;
}

/** GET /clips/:id/feedback-requests — get feedback request status */
app.get('/:id/feedback-requests', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const clip = await getClipForUser(id, userId);
  if (!clip) return c.json({ error: 'Not found' }, 404);

  const { data, error } = await supabase
    .from('feedback_requests')
    .select('status')
    .eq('clip_id', id)
    .maybeSingle();

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ status: data?.status ?? null });
});

/** POST /clips/:id/feedback-requests — create or reopen feedback request */
app.post('/:id/feedback-requests', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const clip = await getClipForUser(id, userId);
  if (!clip) return c.json({ error: 'Not found' }, 404);

  const { error } = await supabase
    .from('feedback_requests')
    .upsert(
      {
        clip_id: id,
        session_id: clip.session_id,
        status: 'open',
      },
      {
        onConflict: 'clip_id',
        ignoreDuplicates: false,
      }
    );

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ ok: true }, 201);
});

/** DELETE /clips/:id/feedback-requests — close feedback request */
app.delete('/:id/feedback-requests', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const clip = await getClipForUser(id, userId);
  if (!clip) return c.json({ error: 'Not found' }, 404);

  const { error } = await supabase
    .from('feedback_requests')
    .update({ status: 'closed' })
    .eq('clip_id', id);

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ ok: true }, 200);
});

/** GET /clips/:id/comments — list comments for clip */
app.get('/:id/comments', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const clip = await getClipForUser(id, userId);
  if (!clip) return c.json({ error: 'Not found' }, 404);

  const { data, error } = await supabase
    .from('clip_comments')
    .select('*')
    .eq('clip_id', id)
    .order('timecode_ms', { ascending: true });

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data as ClipComment[]);
});

export const feedbackRoutes = app;
