import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';
import { checkSessionLimit } from '../lib/planGate.js';
import type { Session, MusicTrack, Clip } from '@roam/types';

const app = new Hono<{ Variables: { userId: string; userEmail: string | null } }>()
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
  const userEmail = c.get('userEmail');
  const body = await c.req.json<{ name?: string }>();
  const name = typeof body?.name === 'string' ? body.name.trim() || 'Untitled Session' : 'Untitled Session';

  // Ensure public.users exists for this auth user (prevents FK failures when migrations/triggers weren't applied).
  // users.email is NOT NULL, so if we don't have it, fail loudly instead of inserting an invalid row.
  if (!userEmail) {
    return c.json({ error: 'User email missing; cannot create profile row' }, 500);
  }
  const { error: userUpsertError } = await supabase
    .from('users')
    .upsert({ id: userId, email: userEmail, plan: 'free' }, { onConflict: 'id' });
  if (userUpsertError) {
    return c.json({ error: userUpsertError.message }, 500);
  }

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
  const music_track: MusicTrack | null =
    (Array.isArray(music_tracks) && music_tracks.length > 0
      ? (music_tracks as MusicTrack[])[0]
      : null) ?? null;

  return c.json({ session, music_track, clips: clips as Clip[] });
});

export const sessionsRoutes = app;
