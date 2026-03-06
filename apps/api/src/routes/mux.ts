import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';
import { checkClipLimit } from '../lib/planGate.js';

const app = new Hono<{ Variables: { userId: string } }>().use(
  '*',
  requireAuth
);

/** Ensure session belongs to user; returns session id or null */
async function getSessionForUser(
  sessionId: string,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single();
  return data?.id ?? null;
}

/** POST /upload-url — get Mux Direct Upload URL; create clip row or reuse by (session_id, local_id) */
app.post('/upload-url', checkClipLimit, async (c) => {
  const userId = c.get('userId');

  let body: {
    session_id?: string;
    local_id?: string;
    label?: string;
    recorded_at?: string;
  };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid request body' }, 400);
  }

  if (!body?.session_id || !body?.local_id || !body?.recorded_at) {
    return c.json(
      { error: 'session_id, local_id, and recorded_at are required' },
      400
    );
  }

  const session = await getSessionForUser(body.session_id, userId);
  if (!session) return c.json({ error: 'Not found' }, 404);

  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;
  if (!tokenId || !tokenSecret) {
    return c.json({ error: 'Mux not configured' }, 502);
  }

  const authHeader = `Basic ${Buffer.from(`${tokenId}:${tokenSecret}`).toString('base64')}`;

  const passthrough = (clipId: string) =>
    JSON.stringify({
      clip_id: clipId,
      local_id: body!.local_id,
    });

  // Idempotent by (session_id, local_id): reuse existing clip and issue fresh Mux URL
  const { data: existingClip } = await supabase
    .from('clips')
    .select('id')
    .eq('session_id', body.session_id)
    .eq('local_id', body.local_id)
    .maybeSingle();

  let clipId: string;

  if (existingClip?.id) {
    clipId = existingClip.id;
  } else {
    const { data: insertedClip, error: insertError } = await supabase
      .from('clips')
      .insert({
        session_id: body.session_id,
        local_id: body.local_id,
        label: body.label ?? 'Clip',
        recorded_at: body.recorded_at,
        upload_status: 'queued',
      })
      .select('*')
      .single();

    if (insertError) {
      return c.json({ error: insertError.message }, 500);
    }
    clipId = insertedClip.id;
  }

  const muxRes = await fetch('https://api.mux.com/video/v1/uploads', {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cors_origin: '*',
      new_asset_settings: { playback_policy: ['public'] },
      passthrough: passthrough(clipId),
    }),
  });

  if (!muxRes.ok) {
    return c.json(
      { error: 'Mux upload creation failed', detail: await muxRes.text() },
      502
    );
  }

  let muxData: { id?: string; url?: string };
  try {
    const muxJson = await muxRes.json();
    muxData = muxJson?.data ?? muxJson;
  } catch {
    return c.json({ error: 'Invalid Mux response' }, 502);
  }

  const uploadUrl = muxData?.url;
  const muxUploadId = muxData?.id;
  if (!uploadUrl || !muxUploadId) {
    return c.json({ error: 'Mux response missing url or id' }, 502);
  }

  const { error: updateError } = await supabase
    .from('clips')
    .update({
      mux_upload_id: muxUploadId,
      mux_passthrough: { clip_id: clipId, local_id: body.local_id },
      upload_status: 'queued',
    })
    .eq('id', clipId);

  if (updateError) {
    return c.json({ error: updateError.message }, 500);
  }

  return c.json(
    {
      upload_url: uploadUrl,
      clip_id: clipId,
      mux_upload_id: muxUploadId,
    },
    existingClip?.id ? 200 : 201
  );
});

export const muxRoutes = app;
