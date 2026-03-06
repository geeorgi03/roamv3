import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';
import { checkSessionLimit } from '../lib/planGate.js';
import type { Session, MusicTrack, Clip } from '@roam/types';

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
app.post('/', checkSessionLimit, async (c) => {
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

/** GET /sessions/:id — get one session with music_track and clips (must belong to user) */
app.get('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  const { data, error } = await supabase
    .from('sessions')
    .select('*, music_tracks(*), clips(*)')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return c.json({ error: 'Not found' }, 404);
    return c.json({ error: error.message }, 500);
  }

  const { music_tracks, clips, ...sessionFields } = data as Session & {
    music_tracks: MusicTrack[];
    clips: Clip[];
  };
  (clips as Clip[]).sort(
    (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
  );
  const session = sessionFields as Session;
  const music_track: MusicTrack | null = music_tracks?.[0] ?? null;

  return c.json({ session, music_track, clips: clips as Clip[] });
});

export const sessionsRoutes = app;
