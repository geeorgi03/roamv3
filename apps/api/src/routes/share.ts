import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';

const app = new Hono<{ Variables: { userId: string } }>().use('*', requireAuth);

/** Ensure session belongs to user; returns session id or null */
async function getSessionForUser(sessionId: string, userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single();
  return data?.id ?? null;
}

const SHARE_BASE_URL = process.env.SHARE_BASE_URL ?? 'http://localhost:3000';

/** POST /sessions/:id/share — create or return existing share URL */
app.post('/:id/share', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const session = await getSessionForUser(id, userId);
  if (!session) return c.json({ error: 'Not found' }, 404);

  const { data: existing } = await supabase
    .from('share_tokens')
    .select('token')
    .eq('session_id', id)
    .is('revoked_at', null)
    .limit(1)
    .maybeSingle();

  if (existing?.token) {
    const url = `${SHARE_BASE_URL}/s/${existing.token}`;
    return c.json({ url }, 200);
  }

  const { data: inserted, error } = await supabase
    .from('share_tokens')
    .insert({ session_id: id })
    .select('token')
    .single();

  if (error) return c.json({ error: error.message }, 500);
  const url = `${SHARE_BASE_URL}/s/${inserted.token}`;
  return c.json({ url }, 201);
});

/** DELETE /sessions/:id/share — revoke share link */
app.delete('/:id/share', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const session = await getSessionForUser(id, userId);
  if (!session) return c.json({ error: 'Not found' }, 404);

  const { error } = await supabase
    .from('share_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('session_id', id)
    .is('revoked_at', null);

  if (error) return c.json({ error: error.message }, 500);
  return c.body(null, 204);
});

export const shareRoutes = app;
