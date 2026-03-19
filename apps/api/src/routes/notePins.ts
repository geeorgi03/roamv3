import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';

type NotePin = {
  id: string;
  session_id: string;
  timecode_ms: number;
  text: string | null;
  audio_storage_path: string | null;
  color: string | null;
  created_at: string;
};

const app = new Hono<{ Variables: { userId: string } }>().use('*', requireAuth);

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

/** GET /sessions/:id/notes — list note pins for a session */
app.get('/:id/notes', async (c) => {
  const userId = c.get('userId');
  const sessionId = c.req.param('id');
  const session = await getSessionForUser(sessionId, userId);
  if (!session) return c.json({ error: 'Not found' }, 404);

  const { data, error } = await supabase
    .from('note_pins')
    .select('*')
    .eq('session_id', sessionId)
    .order('timecode_ms', { ascending: true });

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ notes: (data ?? []) as NotePin[] });
});

/**
 * POST /sessions/:id/notes — create a note pin
 *
 * Response shape (canonical):
 *   201 Created — { note: NotePin }
 *
 * Consumers should parse `{ note }` wrapper; legacy raw-object fallback
 * is tolerated client-side but new code must use the canonical shape.
 */
app.post('/:id/notes', async (c) => {
  const userId = c.get('userId');
  const sessionId = c.req.param('id');
  const session = await getSessionForUser(sessionId, userId);
  if (!session) return c.json({ error: 'Not found' }, 404);

  const body = await c.req.json<{
    timecode_ms: number;
    text?: string | null;
    audio_storage_path?: string | null;
    color?: string | null;
  }>();

  if (!Number.isFinite(body?.timecode_ms)) {
    return c.json({ error: 'timecode_ms is required' }, 400);
  }

  const row = {
    session_id: sessionId,
    timecode_ms: Math.max(0, Math.floor(body.timecode_ms)),
    text:
      typeof body.text === 'string'
        ? body.text.trim() || null
        : body.text ?? null,
    audio_storage_path:
      typeof body.audio_storage_path === 'string'
        ? body.audio_storage_path.trim() || null
        : body.audio_storage_path ?? null,
    color: typeof body.color === 'string' ? body.color : body.color ?? null,
  };

  if (!row.text && !row.audio_storage_path) {
    return c.json({ error: 'Note must include text or audio' }, 400);
  }

  const { data, error } = await supabase
    .from('note_pins')
    .insert(row)
    .select('*')
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ note: data as NotePin }, 201);
});

/** DELETE /sessions/:id/notes/:noteId — delete a note pin */
app.delete('/:id/notes/:noteId', async (c) => {
  const userId = c.get('userId');
  const sessionId = c.req.param('id');
  const noteId = c.req.param('noteId');
  const session = await getSessionForUser(sessionId, userId);
  if (!session) return c.json({ error: 'Not found' }, 404);

  const { error } = await supabase
    .from('note_pins')
    .delete()
    .eq('id', noteId)
    .eq('session_id', sessionId);

  if (error) return c.json({ error: error.message }, 500);
  return c.body(null, 204);
});

export const notePinsRoutes = app;

