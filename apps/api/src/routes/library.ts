import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';
import type { Clip } from '@roam/types';

const app = new Hono<{ Variables: { userId: string } }>()
  .use('*', requireAuth);

/** GET /library — list ready clips owned by user (cursor paginated) */
app.get('/', async (c) => {
  const userId = c.get('userId');

  const url = new URL(c.req.url);
  const q = url.searchParams.get('q') ?? undefined;
  const style = url.searchParams.get('style') ?? undefined;
  const energy = url.searchParams.get('energy') ?? undefined;
  const difficulty = url.searchParams.get('difficulty') ?? undefined;
  const bpmMin = url.searchParams.get('bpm_min') ?? undefined;
  const bpmMax = url.searchParams.get('bpm_max') ?? undefined;
  const cursor = url.searchParams.get('cursor') ?? undefined;

  const rawLimit = Number(url.searchParams.get('limit') ?? '20');
  const limit = Math.min(50, Math.max(1, Number.isFinite(rawLimit) ? rawLimit : 20));

  let query = supabase
    .from('clips')
    .select('*, sessions!inner(user_id)')
    .eq('upload_status', 'ready')
    .eq('sessions.user_id', userId);

  if (q && q.trim()) {
    const qq = q.trim();
    const sanitized = qq.replace(/[^a-zA-Z0-9 _%-]/g, ' ').trim();
    if (sanitized) {
      query = query.or(`move_name.ilike.%${sanitized}%,notes.ilike.%${sanitized}%`);
    }
  }
  if (style) query = query.eq('style', style);
  if (energy) query = query.eq('energy', energy);
  if (difficulty) query = query.eq('difficulty', difficulty);

  if (bpmMin != null && bpmMin !== '') {
    const n = Number(bpmMin);
    if (Number.isFinite(n)) query = query.gte('bpm', n);
  }
  if (bpmMax != null && bpmMax !== '') {
    const n = Number(bpmMax);
    if (Number.isFinite(n)) query = query.lte('bpm', n);
  }

  if (cursor) query = query.lt('recorded_at', cursor);

  const { data, error } = await query
    .order('recorded_at', { ascending: false })
    .limit(limit);

  if (error) return c.json({ error: error.message }, 500);
  const clips = (data ?? []) as Clip[];

  const next_cursor =
    clips.length === limit ? (clips[clips.length - 1]?.recorded_at ?? null) : null;

  return c.json({ clips, next_cursor });
});

export const libraryRoutes = app;

