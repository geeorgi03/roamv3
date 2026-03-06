import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';
import { evaluateClipLimit } from '../lib/planGate.js';
import type { Clip } from '@roam/types';

const app = new Hono<{ Variables: { userId: string } }>()
  .use('*', requireAuth);

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

/** GET /sessions/:sessionId/clips — list clips for a session */
app.get('/:sessionId/clips', async (c) => {
  const userId = c.get('userId');
  const sessionId = c.req.param('sessionId');
  const session = await getSessionForUser(sessionId, userId);
  if (!session) return c.json({ error: 'Not found' }, 404);

  const { data, error } = await supabase
    .from('clips')
    .select('*')
    .eq('session_id', sessionId)
    .order('recorded_at', { ascending: false });

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ clips: data as Clip[] });
});

/** POST /sessions/:sessionId/clips — create a clip */
app.post('/:sessionId/clips', async (c) => {
  const userId = c.get('userId');
  const sessionId = c.req.param('sessionId');
  const session = await getSessionForUser(sessionId, userId);
  if (!session) return c.json({ error: 'Not found' }, 404);

  const limitResult = await evaluateClipLimit(userId);
  if (!limitResult.allowed) return c.json(limitResult.body, limitResult.status);

  const body = await c.req.json<{
    local_id: string;
    label?: string | null;
    recorded_at: string;
    mux_upload_id?: string | null;
    mux_playback_id?: string | null;
    mux_asset_id?: string | null;
    mux_passthrough?: Record<string, unknown> | null;
    upload_status?: Clip['upload_status'];
    move_name?: string | null;
    style?: string | null;
    energy?: string | null;
    difficulty?: string | null;
    bpm?: number | null;
    notes?: string | null;
  }>();

  if (!body?.local_id || typeof body.recorded_at !== 'string') {
    return c.json({ error: 'local_id and recorded_at are required' }, 400);
  }

  const row = {
    session_id: sessionId,
    local_id: body.local_id,
    label: body.label ?? 'Clip',
    recorded_at: body.recorded_at,
    mux_upload_id: body.mux_upload_id ?? null,
    mux_playback_id: body.mux_playback_id ?? null,
    mux_asset_id: body.mux_asset_id ?? null,
    mux_passthrough: body.mux_passthrough ?? null,
    upload_status: body.upload_status ?? 'local',
    move_name: body.move_name ?? null,
    style: body.style ?? null,
    energy: body.energy ?? null,
    difficulty: body.difficulty ?? null,
    bpm: body.bpm ?? null,
    notes: body.notes ?? null,
  };

  const { data, error } = await supabase
    .from('clips')
    .insert(row)
    .select('*')
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data as Clip, 201);
});

/** GET /sessions/:sessionId/clips/:clipId — get one clip */
app.get('/:sessionId/clips/:clipId', async (c) => {
  const userId = c.get('userId');
  const sessionId = c.req.param('sessionId');
  const clipId = c.req.param('clipId');
  const session = await getSessionForUser(sessionId, userId);
  if (!session) return c.json({ error: 'Not found' }, 404);

  const { data, error } = await supabase
    .from('clips')
    .select('*')
    .eq('id', clipId)
    .eq('session_id', sessionId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return c.json({ error: 'Not found' }, 404);
    return c.json({ error: error.message }, 500);
  }
  return c.json(data as Clip);
});

/** PATCH /sessions/:sessionId/clips/:clipId — update a clip */
app.patch('/:sessionId/clips/:clipId', async (c) => {
  const userId = c.get('userId');
  const sessionId = c.req.param('sessionId');
  const clipId = c.req.param('clipId');
  const session = await getSessionForUser(sessionId, userId);
  if (!session) return c.json({ error: 'Not found' }, 404);

  const body = await c.req.json<Partial<{
    label: string | null;
    mux_upload_id: string | null;
    mux_playback_id: string | null;
    mux_asset_id: string | null;
    mux_passthrough: Record<string, unknown> | null;
    upload_status: Clip['upload_status'];
    move_name: string | null;
    style: string | null;
    energy: string | null;
    difficulty: string | null;
    bpm: number | null;
    notes: string | null;
    recorded_at: string;
  }>>();

  const updates: Record<string, unknown> = {};
  if (body && typeof body === 'object') {
    const allowed = [
      'label', 'mux_upload_id', 'mux_playback_id', 'mux_asset_id', 'mux_passthrough',
      'upload_status', 'move_name', 'style', 'energy', 'difficulty', 'bpm', 'notes', 'recorded_at',
    ] as const;
    for (const key of allowed) {
      if (key in body) updates[key] = (body as Record<string, unknown>)[key];
    }
  }
  if (Object.keys(updates).length === 0) {
    const { data: existing } = await supabase
      .from('clips')
      .select('*')
      .eq('id', clipId)
      .eq('session_id', sessionId)
      .single();
    if (!existing) return c.json({ error: 'Not found' }, 404);
    return c.json(existing as Clip);
  }

  const { data, error } = await supabase
    .from('clips')
    .update(updates)
    .eq('id', clipId)
    .eq('session_id', sessionId)
    .select('*')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return c.json({ error: 'Not found' }, 404);
    return c.json({ error: error.message }, 500);
  }
  return c.json(data as Clip);
});

export const clipsRoutes = app;
