import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';
import type { ClipAnnotation, AnnotationType, TextPayload, ArrowPayload, CirclePayload } from '@roam/types';

const ANNOTATION_TYPES: AnnotationType[] = ['text', 'arrow', 'circle'];

const app = new Hono<{ Variables: { userId: string } }>()
  .use('*', requireAuth);

/** Verify clip belongs to user via session */
async function getClipForUser(clipId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('clips')
    .select('id, sessions!inner(user_id)')
    .eq('id', clipId)
    .eq('sessions.user_id', userId)
    .single();
  return !!data;
}

function validatePayload(type: AnnotationType, payload: unknown): payload is TextPayload | ArrowPayload | CirclePayload {
  if (!payload || typeof payload !== 'object') return false;
  const p = payload as Record<string, unknown>;
  switch (type) {
    case 'text':
      return typeof p.x === 'number' && typeof p.y === 'number' && typeof p.text === 'string';
    case 'arrow':
      return (
        typeof p.x1 === 'number' &&
        typeof p.y1 === 'number' &&
        typeof p.x2 === 'number' &&
        typeof p.y2 === 'number'
      );
    case 'circle':
      return typeof p.cx === 'number' && typeof p.cy === 'number' && typeof p.r === 'number';
    default:
      return false;
  }
}

/** GET /clips/:id/annotations — list annotations for clip */
app.get('/:id/annotations', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const owns = await getClipForUser(id, userId);
  if (!owns) return c.json({ error: 'Not found' }, 404);

  const { data, error } = await supabase
    .from('clip_annotations')
    .select('*')
    .eq('clip_id', id)
    .order('timecode_ms', { ascending: true });

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data as ClipAnnotation[]);
});

/** POST /clips/:id/annotations — create annotation */
app.post('/:id/annotations', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const owns = await getClipForUser(id, userId);
  if (!owns) return c.json({ error: 'Not found' }, 404);

  let body: { type?: string; timecode_ms?: number; payload?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid request body' }, 400);
  }

  const type = body?.type;
  const timecode_ms = body?.timecode_ms;
  const payload = body?.payload;

  if (
    !type ||
    !ANNOTATION_TYPES.includes(type as AnnotationType) ||
    typeof timecode_ms !== 'number' ||
    !validatePayload(type as AnnotationType, payload)
  ) {
    return c.json({ error: 'type (text|arrow|circle), timecode_ms, and valid payload are required' }, 400);
  }

  const { data, error } = await supabase
    .from('clip_annotations')
    .insert({
      clip_id: id,
      timecode_ms,
      type,
      payload,
    })
    .select('*')
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data as ClipAnnotation, 201);
});

export const annotationsRoutes = app;
