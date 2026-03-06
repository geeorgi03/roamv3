import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';
import type { Clip } from '@roam/types';

const ALLOWED_TAG_FIELDS = [
  'move_name',
  'style',
  'energy',
  'difficulty',
  'bpm',
  'notes',
] as const;

const app = new Hono<{ Variables: { userId: string } }>()
  .use('*', requireAuth);

/** PATCH /clips/:id/tags — update only tag fields on a clip (flat route) */
app.patch('/:id/tags', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  let body: Record<string, unknown>;
  try {
    body = await c.req.json<Record<string, unknown>>();
  } catch {
    return c.json({ error: 'Invalid request body' }, 400);
  }
  const updates: Record<string, unknown> = {};
  if (body && typeof body === 'object') {
    for (const key of ALLOWED_TAG_FIELDS) {
      if (key in body) updates[key] = body[key];
    }
  }

  const { data: clipRow, error: fetchError } = await supabase
    .from('clips')
    .select('id, session_id, move_name, style, energy, difficulty, bpm, notes, sessions!inner(user_id)')
    .eq('id', id)
    .eq('sessions.user_id', userId)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return c.json({ error: 'Not found' }, 404);
    }
    return c.json({ error: 'Internal server error' }, 500);
  }
  if (!clipRow) {
    return c.json({ error: 'Not found' }, 404);
  }

  if (Object.keys(updates).length === 0) {
    const { data: existing } = await supabase
      .from('clips')
      .select('*')
      .eq('id', id)
      .single();
    if (!existing) return c.json({ error: 'Not found' }, 404);
    return c.json(existing as Clip);
  }

  const clipData = clipRow as Record<string, unknown>;
  const currentTagState: Record<string, unknown> = {};
  for (const key of ALLOWED_TAG_FIELDS) {
    currentTagState[key] = clipData[key] ?? null;
  }

  const { data, error } = await supabase.rpc('update_clip_tags_with_history', {
    p_clip_id: id,
    p_user_id: userId,
    p_snapshot: currentTagState,
    p_updates: updates,
  });

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data as Clip);
});

export const tagsRoutes = app;
