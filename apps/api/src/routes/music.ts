import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';
import { checkMusicSegmentation } from '../lib/planGate.js';
import type { MusicTrack, SectionEntry } from '@roam/types';

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

const ALLOWED_AUDIO_MIMES = [
  'audio/mpeg',
  'audio/wav',
  'audio/aac',
  'audio/x-aac',
  'audio/mp3',
] as const;
const MAX_FILE_BYTES = 52_428_800; // 50 MB

const MIME_TO_EXT: Record<string, string> = {
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/aac': 'aac',
  'audio/x-aac': 'aac',
  'audio/mp3': 'mp3',
};

const YOUTUBE_URL_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;

/** POST /sessions/:id/music — upload file or submit YouTube URL */
app.post('/:id/music', async (c) => {
  const userId = c.get('userId');
  const sessionId = c.req.param('id');
  const session = await getSessionForUser(sessionId, userId);
  if (!session) return c.json({ error: 'Not found' }, 404);

  const contentType = c.req.header('Content-Type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    const gateRes = await checkMusicSegmentation(c, async () => {});
    if (gateRes) return gateRes;
    const formData = await c.req.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return c.json({ error: 'Missing or invalid file field' }, 400);
    }
    const f = file as File;
    if (!ALLOWED_AUDIO_MIMES.includes(f.type as (typeof ALLOWED_AUDIO_MIMES)[number])) {
      return c.json(
        { error: 'Invalid file type. Allowed: audio/mpeg, audio/wav, audio/aac, audio/x-aac, audio/mp3' },
        400
      );
    }
    if (f.size > MAX_FILE_BYTES) {
      return c.json({ error: 'File too large. Maximum size is 50 MB.' }, 400);
    }

    const musicTrackId = crypto.randomUUID();
    const ext = MIME_TO_EXT[f.type] ?? 'mp3';
    const storagePath = `${userId}/${sessionId}/${musicTrackId}.${ext}`;

    const buffer = await f.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from('audio')
      .upload(storagePath, buffer, { contentType: f.type });
    if (uploadError) return c.json({ error: uploadError.message }, 500);

    const { error: insertTrackError } = await supabase.from('music_tracks').insert({
      id: musicTrackId,
      session_id: sessionId,
      source_type: 'upload',
      storage_path: storagePath,
      analysis_status: 'pending',
    });
    if (insertTrackError) return c.json({ error: insertTrackError.message }, 500);

    const timeoutMs = Math.max(
      3 * 60_000,
      Math.min(15 * 60_000, 3 * 60_000 + (f.size / 1_048_576) * 30_000)
    );
    const timeoutAt = new Date(Date.now() + timeoutMs).toISOString();
    const { error: jobError } = await supabase.from('analysis_jobs').insert({
      session_id: sessionId,
      music_track_id: musicTrackId,
      status: 'pending',
      attempt_count: 0,
      timeout_at: timeoutAt,
    });
    if (jobError) {
      await supabase.from('music_tracks').delete().eq('id', musicTrackId);
      await supabase.storage.from('audio').remove([storagePath]);
      return c.json({ error: jobError.message }, 500);
    }

    return c.json({ music_track_id: musicTrackId, analysis_status: 'pending' }, 201);
  }

  // JSON / YouTube branch
  const body = await c.req.json<{ youtube_url?: string }>();
  const youtube_url = body?.youtube_url;
  if (typeof youtube_url !== 'string' || !YOUTUBE_URL_REGEX.test(youtube_url)) {
    return c.json(
      { error: 'Invalid or missing youtube_url. Must be a youtube.com/watch or youtu.be/ URL.' },
      400
    );
  }

  const musicTrackId = crypto.randomUUID();
  const { error: insertError } = await supabase.from('music_tracks').insert({
    id: musicTrackId,
    session_id: sessionId,
    source_type: 'youtube',
    source_url: youtube_url,
    analysis_status: 'complete',
  });
  if (insertError) return c.json({ error: insertError.message }, 500);

  return c.json({ music_track_id: musicTrackId, analysis_status: 'complete' }, 201);
});

/** PATCH /sessions/:id/music — save alignment (sections, downbeat_offset_ms) */
app.patch('/:id/music', async (c) => {
  const userId = c.get('userId');
  const sessionId = c.req.param('id');
  const session = await getSessionForUser(sessionId, userId);
  if (!session) return c.json({ error: 'Not found' }, 404);

  const body = await c.req.json<{ sections?: SectionEntry[]; downbeat_offset_ms?: number }>();
  const updates: Record<string, unknown> = {};
  if (body && typeof body === 'object') {
    if (Array.isArray(body.sections)) updates.sections = body.sections;
    if (typeof body.downbeat_offset_ms === 'number') updates.downbeat_offset_ms = body.downbeat_offset_ms;
  }
  if (Object.keys(updates).length === 0) {
    const { data: existing } = await supabase
      .from('music_tracks')
      .select('*')
      .eq('session_id', sessionId)
      .single();
    if (!existing) return c.json({ error: 'Not found' }, 404);
    return c.json(existing as MusicTrack);
  }

  const { data, error } = await supabase
    .from('music_tracks')
    .update(updates)
    .eq('session_id', sessionId)
    .select('*')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return c.json({ error: 'Not found' }, 404);
    return c.json({ error: error.message }, 500);
  }
  return c.json(data as MusicTrack);
});

export const musicRoutes = app;
