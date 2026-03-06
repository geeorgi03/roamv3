import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';
import type { SectionClip } from '@roam/types';

const app = new Hono<{ Variables: { userId: string } }>()
  .use('*', requireAuth);

/** Verify session belongs to user */
async function getSessionForUser(sessionId: string, userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single();
  return data?.id ?? null;
}

/** GET /sessions/:id/assembly — list section clips for session */
app.get('/:id/assembly', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const session = await getSessionForUser(id, userId);
  if (!session) return c.json({ error: 'Not found' }, 404);

  const { data, error } = await supabase
    .from('section_clips')
    .select('*')
    .eq('session_id', id)
    .order('section_start_ms', { ascending: true })
    .order('position', { ascending: true });

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data as SectionClip[]);
});

/** PUT /sessions/:id/assembly — replace section clips atomically */
app.put('/:id/assembly', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const session = await getSessionForUser(id, userId);
  if (!session) return c.json({ error: 'Not found' }, 404);

  let body: { assignments?: Array<{ section_label: string; section_start_ms: number; clip_id: string; position: number }> };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid request body' }, 400);
  }

  const assignments = body?.assignments ?? [];

  const { data, error } = await supabase.rpc('replace_section_clips', {
    p_session_id: id,
    p_user_id: userId,
    p_assignments: assignments,
  });

  if (error) return c.json({ error: error.message }, 500);
  return c.json((data ?? []) as SectionClip[]);
});

export const assemblyRoutes = app;
