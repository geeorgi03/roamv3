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

/** POST /sessions/:id/assembly/section-clip — append a single clip to a section */
app.post('/:id/assembly/section-clip', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const session = await getSessionForUser(id, userId);
  if (!session) return c.json({ error: 'Not found' }, 404);

  let body: { clip_id: string; section_label: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid request body' }, 400);
  }
  if (!body?.clip_id || !body?.section_label) {
    return c.json({ error: 'clip_id and section_label are required' }, 400);
  }

  // Verify the clip belongs to this session
  const { data: clip } = await supabase
    .from('clips')
    .select('id')
    .eq('id', body.clip_id)
    .eq('session_id', id)
    .maybeSingle();
  if (!clip?.id) return c.json({ error: 'Clip not found in session' }, 404);

  // Resolve section_start_ms from the session's music track
  const { data: mt } = await supabase
    .from('music_tracks')
    .select('sections')
    .eq('session_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const sections = (mt?.sections as Array<{ label: string; start_ms: number }> | null) ?? [];
  const sect = sections.find((s) => s.label === body.section_label);
  const section_start_ms = sect?.start_ms ?? 0;

  // Append at the end of the section's current clip list
  const { data: last } = await supabase
    .from('section_clips')
    .select('position')
    .eq('session_id', id)
    .eq('section_label', body.section_label)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();
  const position = (last?.position ?? -1) + 1;

  const { data, error } = await supabase
    .from('section_clips')
    .insert({
      session_id: id,
      section_label: body.section_label,
      section_start_ms,
      clip_id: body.clip_id,
      position,
    })
    .select('*')
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data as SectionClip, 201);
});

export const assemblyRoutes = app;
