import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';
import { evaluateClipLimit } from '../lib/planGate.js';
import type { Clip } from '@roam/types';

const app = new Hono<{ Variables: { userId: string } }>().use('*', requireAuth);

/** GET /inbox — list clips not assigned to a session */
app.get('/', async (c) => {
  const userId = c.get('userId');
  const { data, error } = await supabase
    .from('clips')
    .select('*')
    .eq('user_id', userId)
    .is('session_id', null)
    .order('recorded_at', { ascending: false });

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ clips: (data ?? []) as Clip[] });
});

/** GET /inbox/count — lightweight count for home badges */
app.get('/count', async (c) => {
  const userId = c.get('userId');
  const { count, error } = await supabase
    .from('clips')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('session_id', null);

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ count: count ?? 0 });
});

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

/** POST /inbox — create an inbox clip (session_id = null) */
app.post('/', async (c) => {
  const userId = c.get('userId');

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
    user_id: userId,
    session_id: null,
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

/** PATCH /inbox/:id/assign — assign an inbox clip to a session, optionally to a section */
app.patch('/:id/assign', async (c) => {
  const userId = c.get('userId');
  const clipId = c.req.param('id');
  const body = await c.req.json<{ session_id?: string; section_label?: string }>();
  const sessionId = typeof body?.session_id === 'string' ? body.session_id : null;
  if (!sessionId) return c.json({ error: 'session_id is required' }, 400);

  const session = await getSessionForUser(sessionId, userId);
  if (!session) return c.json({ error: 'Not found' }, 404);

  const { data: clip, error: clipError } = await supabase
    .from('clips')
    .select('id')
    .eq('id', clipId)
    .eq('user_id', userId)
    .is('session_id', null)
    .maybeSingle();

  if (clipError) return c.json({ error: clipError.message }, 500);
  if (!clip?.id) return c.json({ error: 'Not found' }, 404);

  const { data, error } = await supabase
    .from('clips')
    .update({ session_id: sessionId })
    .eq('id', clipId)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) return c.json({ error: error.message }, 500);

  // If a section label was provided, persist the clip into section_clips
  const sectionLabel = typeof body?.section_label === 'string' ? body.section_label.trim() : null;
  if (sectionLabel) {
    // Resolve section_start_ms from the session's music track sections
    const { data: mt } = await supabase
      .from('music_tracks')
      .select('sections')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const sections = (mt?.sections as Array<{ label: string; start_ms: number }> | null) ?? [];
    const sect = sections.find((s) => s.label === sectionLabel);
    const section_start_ms = sect?.start_ms ?? 0;

    const { data: last } = await supabase
      .from('section_clips')
      .select('position')
      .eq('session_id', sessionId)
      .eq('section_label', sectionLabel)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle();
    const position = (last?.position ?? -1) + 1;

    await supabase.from('section_clips').insert({
      session_id: sessionId,
      section_label: sectionLabel,
      section_start_ms,
      clip_id: clipId,
      position,
    });
  }

  return c.json(data as Clip, 200);
});

/** DELETE /inbox/:id — delete an inbox clip */
app.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const clipId = c.req.param('id');

  const { error } = await supabase
    .from('clips')
    .delete()
    .eq('id', clipId)
    .eq('user_id', userId)
    .is('session_id', null);

  if (error) return c.json({ error: error.message }, 500);
  return c.body(null, 204);
});

export const inboxRoutes = app;

