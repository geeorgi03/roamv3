import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';
import type { Session } from '@roam/types';

const app = new Hono<{ Variables: { userId: string } }>()
  .use('*', requireAuth);

/** GET /sessions — list sessions for the authenticated user */
app.get('/', async (c) => {
  const userId = c.get('userId');
  const { data, error } = await supabase
    .from('sessions')
    .select('id, user_id, name, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return c.json({ error: error.message }, 500);
  }
  return c.json({ sessions: data as Session[] });
});

/** POST /sessions — create a session */
app.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<{ name?: string }>();
  const name = typeof body?.name === 'string' ? body.name.trim() || 'Untitled Session' : 'Untitled Session';

  const { data, error } = await supabase
    .from('sessions')
    .insert({ user_id: userId, name })
    .select('id, user_id, name, created_at')
    .single();

  if (error) {
    return c.json({ error: error.message }, 500);
  }
  return c.json(data as Session, 201);
});

/** GET /sessions/:id — get one session (must belong to user) */
app.get('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  const { data, error } = await supabase
    .from('sessions')
    .select('id, user_id, name, created_at')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return c.json({ error: 'Not found' }, 404);
    return c.json({ error: error.message }, 500);
  }
  return c.json(data as Session);
});

export const sessionsRoutes = app;
