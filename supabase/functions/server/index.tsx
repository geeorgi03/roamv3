import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const app = new Hono();

// Initialize Supabase client with service role for admin operations
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Helper to create user-scoped Supabase client
const getUserClient = (accessToken: string) => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  );
};

// Helper to verify authentication and get user ID
const getAuthenticatedUserId = async (request: Request): Promise<string | null> => {
  const accessToken = request.headers.get('Authorization')?.split(' ')[1];
  if (!accessToken) {
    console.log('Auth failed: no Authorization header');
    return null;
  }
  
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error) {
    console.log(`Auth failed: getUser error — ${error.message}`);
    return null;
  }
  if (!user) {
    console.log('Auth failed: token valid but no user found');
    return null;
  }
  
  return user.id;
};

// --- Session ↔ Postgres sync (KV holds full session blob; Postgres row for FKs + share ownership) ---

function sessionDisplayName(session: Record<string, unknown>): string {
  const name = session.name;
  if (typeof name === 'string' && name.trim()) return name.trim();
  const song = session.songName;
  if (typeof song === 'string' && song.trim()) return song.trim();
  return 'Untitled Session';
}

async function ensureUsersRowForSessionSync(
  userId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (error || !data?.user?.email) {
    const msg = error?.message ?? 'User email unavailable for session sync';
    console.log(`ensureUsersRowForSessionSync: ${msg}`);
    return { ok: false, message: msg };
  }
  const { error: upErr } = await supabaseAdmin
    .from('users')
    .upsert({ id: userId, email: data.user.email, plan: 'free' }, { onConflict: 'id' });
  if (upErr) {
    console.log(`ensureUsersRowForSessionSync users upsert: ${upErr.message}`);
    return { ok: false, message: upErr.message };
  }
  return { ok: true };
}

async function upsertSessionRowFromKvSession(
  userId: string,
  sessionId: string,
  session: Record<string, unknown>,
): Promise<{ error: string | null }> {
  const ensured = await ensureUsersRowForSessionSync(userId);
  if (!ensured.ok) return { error: ensured.message };

  const payload: Record<string, unknown> = {
    id: sessionId,
    user_id: userId,
    name: sessionDisplayName(session),
  };
  const createdAt = session.createdAt;
  if (typeof createdAt === 'string' && createdAt) {
    payload.created_at = createdAt;
  }

  const { error } = await supabaseAdmin.from('sessions').upsert(payload, { onConflict: 'id' });
  if (error) {
    console.log(`upsertSessionRowFromKvSession: ${error.message}`);
    return { error: error.message };
  }
  return { error: null };
}

/** Pure Postgres ownership check (no KV backfill). */
async function ensurePostgresSessionFromKvForUser(
  userId: string,
  sessionId: string,
): Promise<{ ok: true } | { ok: false; notFound: true } | { ok: false; error: string }> {
  const { data: existing, error: selErr } = await supabaseAdmin
    .from('sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .maybeSingle();
  if (selErr) {
    return { ok: false, error: selErr.message };
  }
  if (existing) return { ok: true };

  return { ok: false, notFound: true };
}

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-837ff822/health", (c) => {
  return c.json({ status: "ok" });
});

// ==================== AUTH ROUTES ====================

app.post("/make-server-837ff822/auth/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });
    
    if (error) {
      console.log(`Signup error: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }
    
    return c.json({ user: data.user });
  } catch (error) {
    console.log(`Signup exception: ${error}`);
    return c.json({ error: 'Signup failed' }, 500);
  }
});

// Password reset — uses service role to bypass anon-key email rate limits
app.post("/make-server-837ff822/auth/reset-password", async (c) => {
  try {
    const { email, redirectTo } = await c.req.json();

    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo || undefined,
    });

    if (error) {
      console.log(`Password reset error for ${email}: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    console.log(`Password reset email sent to ${email}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Password reset exception: ${error}`);
    return c.json({ error: 'Failed to send reset email' }, 500);
  }
});

// ==================== SESSION ROUTES ====================

app.get("/make-server-837ff822/sessions", async (c) => {
  try {
    const userId = await getAuthenticatedUserId(c.req.raw);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const sessions = await kv.getByPrefix(`session:${userId}:`);
    return c.json({ sessions });
  } catch (error) {
    console.log(`Error fetching sessions: ${error}`);
    return c.json({ error: 'Failed to fetch sessions' }, 500);
  }
});

app.get("/make-server-837ff822/sessions/:id", async (c) => {
  try {
    const userId = await getAuthenticatedUserId(c.req.raw);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const sessionId = c.req.param('id');
    const session = await kv.get(`session:${userId}:${sessionId}`);
    
    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }
    
    return c.json({ session });
  } catch (error) {
    console.log(`Error fetching session: ${error}`);
    return c.json({ error: 'Failed to fetch session' }, 500);
  }
});

app.post("/make-server-837ff822/sessions", async (c) => {
  try {
    const userId = await getAuthenticatedUserId(c.req.raw);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const sessionData = await c.req.json();
    const sessionId = sessionData.id || crypto.randomUUID();
    
    const session = {
      ...sessionData,
      id: sessionId,
      userId,
      createdAt: sessionData.createdAt || new Date().toISOString(),
    };
    
    await kv.set(`session:${userId}:${sessionId}`, session);

    const { error: pgErr } = await upsertSessionRowFromKvSession(userId, sessionId, session as Record<string, unknown>);
    if (pgErr) {
      return c.json({ error: 'Failed to persist session' }, 500);
    }

    return c.json({ session });
  } catch (error) {
    console.log(`Error creating session: ${error}`);
    return c.json({ error: 'Failed to create session' }, 500);
  }
});

app.put("/make-server-837ff822/sessions/:id", async (c) => {
  try {
    const userId = await getAuthenticatedUserId(c.req.raw);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const sessionId = c.req.param('id');
    const updates = await c.req.json();
    
    const existing = await kv.get(`session:${userId}:${sessionId}`);
    if (!existing) {
      return c.json({ error: 'Session not found' }, 404);
    }
    
    const session = { ...existing, ...updates, id: sessionId, userId };
    await kv.set(`session:${userId}:${sessionId}`, session);

    const { error: pgErr } = await upsertSessionRowFromKvSession(userId, sessionId, session as Record<string, unknown>);
    if (pgErr) {
      return c.json({ error: 'Failed to persist session' }, 500);
    }

    return c.json({ session });
  } catch (error) {
    console.log(`Error updating session: ${error}`);
    return c.json({ error: 'Failed to update session' }, 500);
  }
});

app.delete("/make-server-837ff822/sessions/:id", async (c) => {
  try {
    const userId = await getAuthenticatedUserId(c.req.raw);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const sessionId = c.req.param('id');

    const { error: pgDelErr } = await supabaseAdmin
      .from('sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', userId);
    if (pgDelErr) {
      console.log(`Error deleting session from Postgres: ${pgDelErr.message}`);
      return c.json({ error: 'Failed to delete session' }, 500);
    }

    await kv.del(`session:${userId}:${sessionId}`);
    
    // Also delete related data (clips live in Postgres with ON DELETE CASCADE)
    const notes = await kv.getByPrefix(`note:${userId}:${sessionId}:`);
    const loops = await kv.getByPrefix(`loop:${userId}:${sessionId}:`);
    const marks = await kv.getByPrefix(`mark:${userId}:${sessionId}:`);
    
    const deleteKeys = [
      ...notes.map(n => `note:${userId}:${sessionId}:${n.id}`),
      ...loops.map(l => `loop:${userId}:${sessionId}:${l.id}`),
      ...marks.map(m => `mark:${userId}:${sessionId}:${m.id}`),
    ];
    
    if (deleteKeys.length > 0) {
      await kv.mdel(...deleteKeys);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting session: ${error}`);
    return c.json({ error: 'Failed to delete session' }, 500);
  }
});

// ==================== CLIP ROUTES ====================

// Map Postgres clip rows to API-friendly fields (camelCase used by clients)
const enrichClipRow = (row: Record<string, unknown> | null) => {
  if (!row || typeof row !== "object") return row;
  return {
    ...row,
    sessionId: row.session_id ?? row.sessionId,
    userId: row.user_id ?? row.userId,
    createdAt: row.created_at ?? row.createdAt,
    type_tag: row.type_tag,
    feel_tags: row.feel_tags,
    section_id: row.section_id,
    timecode_ms: row.timecode_ms,
  };
};

const CLIP_OPTIONAL_DB_KEYS = [
  "mux_upload_id",
  "mux_asset_id",
  "mux_playback_id",
  "mux_passthrough",
  "upload_status",
  "move_name",
  "style",
  "energy",
  "difficulty",
  "bpm",
  "notes",
] as const;

app.get("/make-server-837ff822/clips", async (c) => {
  try {
    const userId = await getAuthenticatedUserId(c.req.raw);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const type_tag = c.req.query('type_tag');
    const feel_tags = c.req.queries('feel_tags[]') || [];
    const section_id = c.req.query('section_id');
    const unassigned = c.req.query('unassigned') === 'true';
    
    let q = supabaseAdmin
      .from('clips')
      .select('*, sessions(name)')
      .eq('user_id', userId);
    if (type_tag) q = q.eq('type_tag', type_tag);
    if (feel_tags.length > 0) q = q.contains('feel_tags', feel_tags);
    if (section_id) q = q.eq('section_id', section_id);
    if (unassigned) q = q.is('session_id', null);

    const { data: rows, error } = await q;
    if (error) {
      console.log(`Error fetching cross-session clips: ${error.message}`);
      return c.json({ error: 'Failed to fetch clips' }, 500);
    }

    const clips = (rows ?? []).map((row: Record<string, unknown>) => {
      const sessions = row.sessions as { name?: string } | null | undefined;
      const { sessions: _s, ...rest } = row;
      return enrichClipRow({
        ...rest,
        session_name: sessions?.name ?? '',
      });
    });
    
    return c.json({ clips });
  } catch (error) {
    console.log(`Error fetching cross-session clips: ${error}`);
    return c.json({ error: 'Failed to fetch clips' }, 500);
  }
});

app.get("/make-server-837ff822/sessions/:sessionId/clips", async (c) => {
  try {
    const userId = await getAuthenticatedUserId(c.req.raw);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const sessionId = c.req.param('sessionId');
    const { data, error } = await supabaseAdmin
      .from('clips')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', userId);

    if (error) {
      console.log(`Error fetching clips: ${error.message}`);
      return c.json({ error: 'Failed to fetch clips' }, 500);
    }

    const clips = (data ?? []).map((row) => enrichClipRow(row as Record<string, unknown>));
    return c.json({ clips });
  } catch (error) {
    console.log(`Error fetching clips: ${error}`);
    return c.json({ error: 'Failed to fetch clips' }, 500);
  }
});

app.post("/make-server-837ff822/sessions/:sessionId/clips", async (c) => {
  try {
    const userId = await getAuthenticatedUserId(c.req.raw);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const sessionId = c.req.param('sessionId');
    // IMPORTANT: session_id is ALWAYS taken from the URL path parameter, never from the request body.
    // This ensures offline clips synced via syncPendingClips are always persisted into the session
    // that was active at capture time — not the currently open session.
    const clipData = await c.req.json() as Record<string, unknown>;
    const feel_tags = Array.isArray(clipData.feel_tags) ? clipData.feel_tags : [];
    const clipId = (clipData.id as string) || crypto.randomUUID();
    const local_id =
      (clipData.local_id as string) ||
      (clipData.id as string) ||
      crypto.randomUUID();

    const insertPayload: Record<string, unknown> = {
      id: clipId,
      session_id: sessionId,
      user_id: userId,
      local_id,
      label: (clipData.label as string) || 'Clip',
      type_tag: clipData.type_tag ?? null,
      feel_tags,
      section_id: clipData.section_id ?? null,
      timecode_ms: clipData.timecode_ms ?? null,
      recorded_at:
        (clipData.recorded_at as string) ||
        (clipData.createdAt as string) ||
        new Date().toISOString(),
    };

    for (const key of CLIP_OPTIONAL_DB_KEYS) {
      if (clipData[key] !== undefined) insertPayload[key] = clipData[key];
    }

    // Temporary backward compatibility: accept legacy singular 'note' from older QuickTag clients.
    if (clipData.note !== undefined && insertPayload.notes === undefined) {
      insertPayload.notes = clipData.note;
    }

    const { data, error } = await supabaseAdmin
      .from('clips')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.log(`Error creating clip: ${error.message}`);
      return c.json({ error: 'Failed to create clip' }, 500);
    }

    return c.json({ clip: enrichClipRow(data as Record<string, unknown>) });
  } catch (error) {
    console.log(`Error creating clip: ${error}`);
    return c.json({ error: 'Failed to create clip' }, 500);
  }
});

app.delete("/make-server-837ff822/sessions/:sessionId/clips/:clipId", async (c) => {
  try {
    const userId = await getAuthenticatedUserId(c.req.raw);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const clipId = c.req.param('clipId');
    
    const { error } = await supabaseAdmin
      .from('clips')
      .delete()
      .eq('id', clipId)
      .eq('user_id', userId);

    if (error) {
      console.log(`Error deleting clip: ${error.message}`);
      return c.json({ error: 'Failed to delete clip' }, 500);
    }

    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting clip: ${error}`);
    return c.json({ error: 'Failed to delete clip' }, 500);
  }
});

app.patch("/make-server-837ff822/sessions/:sessionId/clips/:clipId", async (c) => {
  try {
    const userId = await getAuthenticatedUserId(c.req.raw);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const clipId = c.req.param('clipId');
    const updates = await c.req.json();
    
    // Temporary backward compatibility: map legacy 'note' -> 'notes' for older clients.
    if (updates.note && !updates.notes) {
      updates.notes = updates.note;
      delete updates.note;
    }
    
    // Allowlist of safe updatable fields
    const allowedFields = [
      'type_tag',
      'feel_tags', 
      'section_id',
      'timecode_ms',
      'notes',
      'label',
      'upload_status',
      'mux_upload_id',
      'mux_asset_id', 
      'mux_playback_id',
      'mux_passthrough',
      'video_storage_path',
      'audio_storage_path',
      'thumbnail_storage_path'
    ];
    
    // Filter updates to only allow safe fields
    const sanitizedUpdates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in updates) {
        sanitizedUpdates[field] = updates[field];
      }
    }
    
    const { data, error } = await supabaseAdmin
      .from('clips')
      .update(sanitizedUpdates)
      .eq('id', clipId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) {
      return c.json({ error: 'Clip not found' }, 404);
    }
    
    return c.json({ clip: enrichClipRow(data as Record<string, unknown>) });
  } catch (error) {
    console.log(`Error updating clip: ${error}`);
    return c.json({ error: 'Failed to update clip' }, 500);
  }
});

// ==================== NOTE PIN ROUTES ====================

app.get("/make-server-837ff822/sessions/:sessionId/notes", async (c) => {
  try {
    const userId = await getAuthenticatedUserId(c.req.raw);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const sessionId = c.req.param('sessionId');
    const notes = await kv.getByPrefix(`note:${userId}:${sessionId}:`);
    
    return c.json({ notes });
  } catch (error) {
    console.log(`Error fetching notes: ${error}`);
    return c.json({ error: 'Failed to fetch notes' }, 500);
  }
});

app.post("/make-server-837ff822/sessions/:sessionId/notes", async (c) => {
  try {
    const userId = await getAuthenticatedUserId(c.req.raw);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const sessionId = c.req.param('sessionId');
    const noteData = await c.req.json();
    const noteId = noteData.id || crypto.randomUUID();
    
    const note = {
      ...noteData,
      id: noteId,
      sessionId,
      userId,
      createdAt: noteData.createdAt || new Date().toISOString(),
    };
    
    await kv.set(`note:${userId}:${sessionId}:${noteId}`, note);
    return c.json({ note });
  } catch (error) {
    console.log(`Error creating note: ${error}`);
    return c.json({ error: 'Failed to create note' }, 500);
  }
});

app.put("/make-server-837ff822/sessions/:sessionId/notes/:noteId", async (c) => {
  try {
    const userId = await getAuthenticatedUserId(c.req.raw);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const sessionId = c.req.param('sessionId');
    const noteId = c.req.param('noteId');
    const updates = await c.req.json();
    
    const existing = await kv.get(`note:${userId}:${sessionId}:${noteId}`);
    if (!existing) {
      return c.json({ error: 'Note not found' }, 404);
    }
    
    const note = { ...existing, ...updates };
    await kv.set(`note:${userId}:${sessionId}:${noteId}`, note);
    
    return c.json({ note });
  } catch (error) {
    console.log(`Error updating note: ${error}`);
    return c.json({ error: 'Failed to update note' }, 500);
  }
});

app.delete("/make-server-837ff822/sessions/:sessionId/notes/:noteId", async (c) => {
  try {
    const userId = await getAuthenticatedUserId(c.req.raw);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const sessionId = c.req.param('sessionId');
    const noteId = c.req.param('noteId');
    
    await kv.del(`note:${userId}:${sessionId}:${noteId}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting note: ${error}`);
    return c.json({ error: 'Failed to delete note' }, 500);
  }
});

// ==================== LOOP REGION ROUTES ====================

app.get("/make-server-837ff822/sessions/:sessionId/loops", async (c) => {
  try {
    const userId = await getAuthenticatedUserId(c.req.raw);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const sessionId = c.req.param('sessionId');
    const loops = await kv.getByPrefix(`loop:${userId}:${sessionId}:`);
    
    return c.json({ loops });
  } catch (error) {
    console.log(`Error fetching loop regions: ${error}`);
    return c.json({ error: 'Failed to fetch loop regions' }, 500);
  }
});

app.post("/make-server-837ff822/sessions/:sessionId/loops", async (c) => {
  try {
    const userId = await getAuthenticatedUserId(c.req.raw);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const sessionId = c.req.param('sessionId');
    const loopData = await c.req.json();
    const loopId = loopData.id || crypto.randomUUID();
    
    const loop = {
      ...loopData,
      id: loopId,
      sessionId,
      userId,
      createdAt: loopData.createdAt || new Date().toISOString(),
    };
    
    await kv.set(`loop:${userId}:${sessionId}:${loopId}`, loop);
    return c.json({ loop });
  } catch (error) {
    console.log(`Error creating loop region: ${error}`);
    return c.json({ error: 'Failed to create loop region' }, 500);
  }
});

app.put("/make-server-837ff822/sessions/:sessionId/loops/:loopId", async (c) => {
  try {
    const userId = await getAuthenticatedUserId(c.req.raw);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const sessionId = c.req.param('sessionId');
    const loopId = c.req.param('loopId');
    const updates = await c.req.json();
    
    const existing = await kv.get(`loop:${userId}:${sessionId}:${loopId}`);
    if (!existing) {
      return c.json({ error: 'Loop region not found' }, 404);
    }
    
    const loop = { ...existing, ...updates };
    await kv.set(`loop:${userId}:${sessionId}:${loopId}`, loop);
    
    return c.json({ loop });
  } catch (error) {
    console.log(`Error updating loop region: ${error}`);
    return c.json({ error: 'Failed to update loop region' }, 500);
  }
});

app.delete("/make-server-837ff822/sessions/:sessionId/loops/:loopId", async (c) => {
  try {
    const userId = await getAuthenticatedUserId(c.req.raw);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const sessionId = c.req.param('sessionId');
    const loopId = c.req.param('loopId');
    
    await kv.del(`loop:${userId}:${sessionId}:${loopId}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting loop region: ${error}`);
    return c.json({ error: 'Failed to delete loop region' }, 500);
  }
});

// ==================== FLOOR MARK ROUTES ====================

app.get("/make-server-837ff822/sessions/:sessionId/marks", async (c) => {
  try {
    const userId = await getAuthenticatedUserId(c.req.raw);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const sessionId = c.req.param('sessionId');
    const marks = await kv.getByPrefix(`mark:${userId}:${sessionId}:`);
    
    return c.json({ marks });
  } catch (error) {
    console.log(`Error fetching floor marks: ${error}`);
    return c.json({ error: 'Failed to fetch floor marks' }, 500);
  }
});

app.post("/make-server-837ff822/sessions/:sessionId/marks", async (c) => {
  try {
    const userId = await getAuthenticatedUserId(c.req.raw);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const sessionId = c.req.param('sessionId');
    const markData = await c.req.json();
    const markId = markData.id || crypto.randomUUID();
    
    const mark = {
      ...markData,
      id: markId,
      sessionId,
      userId,
      createdAt: markData.createdAt || new Date().toISOString(),
    };
    
    await kv.set(`mark:${userId}:${sessionId}:${markId}`, mark);
    return c.json({ mark });
  } catch (error) {
    console.log(`Error creating floor mark: ${error}`);
    return c.json({ error: 'Failed to create floor mark' }, 500);
  }
});

app.put("/make-server-837ff822/sessions/:sessionId/marks/:markId", async (c) => {
  try {
    const userId = await getAuthenticatedUserId(c.req.raw);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const sessionId = c.req.param('sessionId');
    const markId = c.req.param('markId');
    const updates = await c.req.json();
    
    const existing = await kv.get(`mark:${userId}:${sessionId}:${markId}`);
    if (!existing) {
      return c.json({ error: 'Floor mark not found' }, 404);
    }
    
    const mark = { ...existing, ...updates };
    await kv.set(`mark:${userId}:${sessionId}:${markId}`, mark);
    
    return c.json({ mark });
  } catch (error) {
    console.log(`Error updating floor mark: ${error}`);
    return c.json({ error: 'Failed to update floor mark' }, 500);
  }
});

app.delete("/make-server-837ff822/sessions/:sessionId/marks/:markId", async (c) => {
  try {
    const userId = await getAuthenticatedUserId(c.req.raw);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const sessionId = c.req.param('sessionId');
    const markId = c.req.param('markId');
    
    await kv.del(`mark:${userId}:${sessionId}:${markId}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting floor mark: ${error}`);
    return c.json({ error: 'Failed to delete floor mark' }, 500);
  }
});

// ==================== SHARE ROUTES ====================

// POST /sessions/:sessionId/share — generate session share link
app.post("/make-server-837ff822/sessions/:sessionId/share", async (c) => {
  try {
    const userId = await getAuthenticatedUserId(c.req.raw);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const sessionId = c.req.param('sessionId');

    const resolved = await ensurePostgresSessionFromKvForUser(userId, sessionId);
    if (!resolved.ok) {
      if ('notFound' in resolved && resolved.notFound) {
        return c.json({ error: 'Session not found' }, 404);
      }
      console.log(`Error verifying session ownership for share: ${resolved.error}`);
      return c.json({ error: 'Failed to generate share link' }, 500);
    }

    const { data: existing, error: existingErr } = await supabaseAdmin
      .from('share_tokens')
      .select('token, mode')
      .eq('session_id', sessionId)
      .is('clip_id', null)
      .is('revoked_at', null)
      .maybeSingle();

    if (existingErr) {
      console.log(`Error looking up session share: ${existingErr.message}`);
      return c.json({ error: 'Failed to generate share link' }, 500);
    }

    const baseUrl = Deno.env.get('PUBLIC_SITE_URL') || 'https://app.example.com';

    if (existing?.token) {
      const tokenStr = String(existing.token);
      return c.json({
        token: tokenStr,
        url: `${baseUrl}/s/${tokenStr}`,
        mode: existing.mode ?? 'lightweight',
      });
    }

    let body: Record<string, unknown> = {};
    try {
      body = (await c.req.json()) as Record<string, unknown>;
    } catch {
      // Body may be absent
    }
    const mode = (body?.mode as string) ?? 'lightweight';

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from('share_tokens')
      .insert({ session_id: sessionId, clip_id: null, mode })
      .select('token, mode')
      .single();

    if (insertErr || !inserted?.token) {
      console.log(`Error inserting session share: ${insertErr?.message}`);
      return c.json({ error: 'Failed to generate share link' }, 500);
    }

    const tokenStr = String(inserted.token);
    return c.json({
      token: tokenStr,
      url: `${baseUrl}/s/${tokenStr}`,
      mode: inserted.mode ?? 'lightweight',
    });
  } catch (error) {
    console.log(`Error generating session share: ${error}`);
    return c.json({ error: 'Failed to generate share link' }, 500);
  }
});

// DELETE /sessions/:sessionId/share — revoke session share link
app.delete("/make-server-837ff822/sessions/:sessionId/share", async (c) => {
  try {
    const userId = await getAuthenticatedUserId(c.req.raw);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const sessionId = c.req.param('sessionId');

    const resolved = await ensurePostgresSessionFromKvForUser(userId, sessionId);
    if (!resolved.ok) {
      if ('notFound' in resolved && resolved.notFound) {
        return c.json({ error: 'Session not found' }, 404);
      }
      console.log(`Error verifying session ownership for share revoke: ${resolved.error}`);
      return c.json({ error: 'Failed to revoke share link' }, 500);
    }

    const { error } = await supabaseAdmin
      .from('share_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('session_id', sessionId)
      .is('clip_id', null)
      .is('revoked_at', null);

    if (error) {
      console.log(`Error revoking session share: ${error.message}`);
      return c.json({ error: 'Failed to revoke share link' }, 500);
    }

    return c.json({ success: true });
  } catch (error) {
    console.log(`Error revoking session share: ${error}`);
    return c.json({ error: 'Failed to revoke share link' }, 500);
  }
});

// POST /sessions/:sessionId/clips/:clipId/share — generate clip share link
app.post("/make-server-837ff822/sessions/:sessionId/clips/:clipId/share", async (c) => {
  try {
    const userId = await getAuthenticatedUserId(c.req.raw);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const sessionId = c.req.param('sessionId');
    const clipId = c.req.param('clipId');

    const { data: ownedClip, error: ownErr } = await supabaseAdmin
      .from('clips')
      .select('id')
      .eq('id', clipId)
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .maybeSingle();

    if (ownErr) {
      console.log(`Error verifying clip ownership for share: ${ownErr.message}`);
      return c.json({ error: 'Failed to generate share link' }, 500);
    }
    if (!ownedClip) {
      return c.json({ error: 'Clip not found' }, 404);
    }
    
    let body: Record<string, unknown> = {};
    try {
      body = (await c.req.json()) as Record<string, unknown>;
    } catch {
      // Body may be absent
    }
    const mode = (body?.mode as string) ?? 'lightweight';
    
    const { data: existing, error: existingErr } = await supabaseAdmin
      .from('share_tokens')
      .select('token, mode')
      .eq('clip_id', clipId)
      .is('revoked_at', null)
      .maybeSingle();

    if (existingErr) {
      console.log(`Error looking up clip share: ${existingErr.message}`);
      return c.json({ error: 'Failed to generate share link' }, 500);
    }

    const baseUrl = Deno.env.get('PUBLIC_SITE_URL') || 'https://app.example.com';

    if (existing?.token) {
      const tokenStr = String(existing.token);
      return c.json({
        token: tokenStr,
        url: `${baseUrl}/share/${tokenStr}`,
        mode: existing.mode ?? 'lightweight',
      });
    }

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from('share_tokens')
      .insert({ session_id: sessionId, clip_id: clipId, mode })
      .select('token, mode')
      .single();

    if (insertErr || !inserted?.token) {
      console.log(`Error inserting clip share: ${insertErr?.message}`);
      return c.json({ error: 'Failed to generate share link' }, 500);
    }

    const tokenStr = String(inserted.token);
    return c.json({
      token: tokenStr,
      url: `${baseUrl}/share/${tokenStr}`,
      mode: inserted.mode ?? 'lightweight',
    });
  } catch (error) {
    console.log(`Error generating clip share: ${error}`);
    return c.json({ error: 'Failed to generate share link' }, 500);
  }
});

// DELETE /sessions/:sessionId/clips/:clipId/share — revoke clip share link
app.delete("/make-server-837ff822/sessions/:sessionId/clips/:clipId/share", async (c) => {
  try {
    const userId = await getAuthenticatedUserId(c.req.raw);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const sessionId = c.req.param('sessionId');
    const clipId = c.req.param('clipId');

    const { data: ownedClip, error: ownErr } = await supabaseAdmin
      .from('clips')
      .select('id')
      .eq('id', clipId)
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .maybeSingle();

    if (ownErr) {
      console.log(`Error verifying clip ownership for share revoke: ${ownErr.message}`);
      return c.json({ error: 'Failed to revoke share link' }, 500);
    }
    if (!ownedClip) {
      return c.json({ error: 'Clip not found' }, 404);
    }
    
    const { error } = await supabaseAdmin
      .from('share_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('clip_id', clipId)
      .is('revoked_at', null);

    if (error) {
      console.log(`Error revoking clip share: ${error.message}`);
      return c.json({ error: 'Failed to revoke share link' }, 500);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error revoking clip share: ${error}`);
    return c.json({ error: 'Failed to revoke share link' }, 500);
  }
});

// GET /share/:token — resolve share token (public, no auth required)
app.get("/make-server-837ff822/share/:token", async (c) => {
  try {
    const token = c.req.param('token');

    let st: Record<string, unknown> | null = null;
    const { data: pgRow, error: pgErr } = await supabaseAdmin
      .from('share_tokens')
      .select('*, clips(*)')
      .eq('token', token)
      .is('revoked_at', null)
      .maybeSingle();

    if (pgErr) {
      const msg = pgErr.message ?? '';
      const invalidUuid =
        pgErr.code === '22P02' || /invalid.*uuid/i.test(msg);
      if (!invalidUuid) {
        console.log(`Error resolving share token (postgres): ${msg}`);
        return c.json({ error: 'Failed to resolve share link' }, 500);
      }
    } else {
      st = pgRow as Record<string, unknown> | null;
    }

    if (st?.clip_id) {
      const rawClip = st.clips as Record<string, unknown> | Record<string, unknown>[] | null;
      const clipRow = Array.isArray(rawClip) ? rawClip[0] : rawClip;
      if (!clipRow || typeof clipRow !== 'object') {
        return c.json({ error: 'Clip no longer exists' }, 404);
      }
      const normalizedClip = {
        ...clipRow,
        videoUrl:
          clipRow.videoUrl ??
          clipRow.video_storage_path,
        audioUrl:
          clipRow.audioUrl ??
          clipRow.audio_storage_path,
        prompt: clipRow.prompt,
      };
      return c.json({
        type: 'clip',
        clip: normalizedClip,
        sessionId: st.session_id,
        mode: st.mode ?? 'lightweight',
      });
    }

    const { data: sessionToken, error: sessionTokErr } = await supabaseAdmin
      .from('share_tokens')
      .select('session_id, mode')
      .eq('token', token)
      .is('clip_id', null)
      .is('revoked_at', null)
      .maybeSingle();

    if (sessionTokErr) {
      const msg = sessionTokErr.message ?? '';
      const invalidUuid =
        sessionTokErr.code === '22P02' || /invalid.*uuid/i.test(msg);
      if (!invalidUuid) {
        console.log(`Error resolving session share token (postgres): ${msg}`);
        return c.json({ error: 'Failed to resolve share link' }, 500);
      }
    }

    if (sessionToken?.session_id) {
      const { data: rpcData, error: rpcErr } = await supabaseAdmin.rpc(
        'get_shared_session',
        { p_token: token },
      );
      if (rpcErr || rpcData == null) {
        return c.json({ error: 'Session no longer exists' }, 404);
      }
      const payload = rpcData as Record<string, unknown>;
      return c.json({
        type: 'session',
        ...payload,
        mode: sessionToken.mode ?? 'lightweight',
      });
    }

    return c.json({ error: 'Share link not found or expired' }, 404);
  } catch (error) {
    console.log(`Error resolving share token: ${error}`);
    return c.json({ error: 'Failed to resolve share link' }, 500);
  }
});

// POST /share/:token/response — submit viewer response (backward compatible)
app.post("/make-server-837ff822/share/:token/response", async (c) => {
  try {
    const token = c.req.param('token');

    const { data, error } = await supabaseAdmin
      .from('share_tokens')
      .select('id, clip_id')
      .eq('token', token)
      .is('revoked_at', null)
      .maybeSingle();

    if (error) {
      const msg = error.message ?? '';
      if (error.code === '22P02' || /invalid.*uuid/i.test(msg)) {
        return c.json({ error: 'Share link not found' }, 404);
      }
      console.log(`Error verifying share token: ${msg}`);
      return c.json({ error: 'Failed to save response' }, 500);
    }
    if (!data?.clip_id) return c.json({ error: 'Share link not found' }, 404);

    const body = await c.req.json();
    
    // Support both 'text' and 'response' for backward compatibility
    const responseText = body.text || body.response;
    if (!responseText?.trim()) return c.json({ error: 'Response text is required' }, 400);

    const { error: insErr } = await supabaseAdmin.from('clip_responses').insert({
      clip_id: data.clip_id,
      token_id: data.id,
      text: String(responseText).trim(),
    });

    if (insErr) {
      console.log(`Error inserting clip response: ${insErr.message}`);
      return c.json({ error: 'Failed to save response' }, 500);
    }

    console.log(`Response saved for clip ${data.clip_id}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error saving response: ${error}`);
    return c.json({ error: 'Failed to save response' }, 500);
  }
});

// GET /sessions/:sessionId/clips/:clipId/responses — get all responses for a clip
app.get("/make-server-837ff822/sessions/:sessionId/clips/:clipId/responses", async (c) => {
  try {
    const userId = await getAuthenticatedUserId(c.req.raw);
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const sessionId = c.req.param('sessionId');
    const clipId = c.req.param('clipId');

    // Step A — Existence check (clip by id only)
    const { data: clip, error: ownErr } = await supabaseAdmin
      .from('clips')
      .select('id, user_id, session_id')
      .eq('id', clipId)
      .maybeSingle();

    if (ownErr) {
      console.log(`Error verifying clip ownership for responses: ${ownErr.message}`);
      return c.json({ error: 'Failed to fetch responses' }, 500);
    }
    if (!clip) {
      return c.json({ error: 'Clip not found' }, 404);
    }

    // Step B — Ownership check
    if (clip.user_id !== userId || clip.session_id !== sessionId) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const { data, error } = await supabaseAdmin
      .from('clip_responses')
      .select('id, text, created_at')
      .eq('clip_id', clipId)
      .order('created_at', { ascending: true });

    if (error) {
      console.log(`Error fetching responses: ${error.message}`);
      return c.json({ error: 'Failed to fetch responses' }, 500);
    }

    return c.json({ responses: data ?? [] });
  } catch (error) {
    console.log(`Error fetching responses: ${error}`);
    return c.json({ error: 'Failed to fetch responses' }, 500);
  }
});

// ==================== INBOX ROUTES ====================

type AnyRecord = Record<string, unknown>;

function firstString(...vals: unknown[]): string | undefined {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v;
  }
  return undefined;
}

function firstNumber(...vals: unknown[]): number | undefined {
  for (const v of vals) {
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return undefined;
}

function normalizeInboxClip(raw: unknown): AnyRecord {
  const obj: AnyRecord =
    raw && typeof raw === "object" ? (raw as AnyRecord) : ({} as AnyRecord);

  const id = firstString(obj.id) ?? crypto.randomUUID();
  const userId = firstString(obj.userId, obj.user_id);
  const sessionId =
    firstString(obj.sessionId, obj.session_id) ??
    (obj.sessionId === null || obj.session_id === null ? null : undefined) ??
    null;

  const label = firstString(obj.label);
  const mediaType =
    (firstString(obj.mediaType, obj.media_type) as "video" | "audio" | undefined) ??
    (label === "Voice memo" ? "audio" : label ? "video" : undefined);

  const videoUrl = firstString(obj.videoUrl, obj.video_storage_path);
  const audioUrl = firstString(obj.audioUrl, obj.audio_storage_path);
  const thumbnailUrl = firstString(obj.thumbnailUrl, obj.thumbnail_storage_path);

  const durationMs = firstNumber(obj.duration_ms);
  const durationSeconds =
    firstNumber(obj.duration) ?? (durationMs != null ? durationMs / 1000 : undefined);

  const createdAt =
    firstString(obj.createdAt, obj.recorded_at, obj.created_at) ??
    new Date().toISOString();

  const recordedAt = firstString(obj.recorded_at, obj.recordedAt) ?? createdAt;

  const normalized: AnyRecord = {
    id,
    userId,
    user_id: userId,

    sessionId,
    session_id: sessionId,

    mediaType,
    media_type: mediaType,

    label: label ?? (mediaType === "audio" ? "Voice memo" : "Video clip"),

    videoUrl,
    video_storage_path: videoUrl,

    audioUrl,
    audio_storage_path: audioUrl,

    thumbnailUrl,
    thumbnail_storage_path: thumbnailUrl,

    duration: durationSeconds,
    duration_ms: durationSeconds != null ? Math.round(durationSeconds * 1000) : undefined,

    createdAt,
    created_at: createdAt,
    recorded_at: recordedAt,

    // Preserve any existing section field if present (used by session consumers).
    section: firstString(obj.section),
  };

  // Keep any additional caller-provided fields, but ensure our canonical fields win.
  return { ...obj, ...normalized };
}

// GET /inbox — clips with no session assigned
app.get("/make-server-837ff822/inbox", async (c) => {
  try {
    const userId = await getAuthenticatedUserId(c.req.raw);
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const { data: rows, error } = await supabaseAdmin
      .from('clips')
      .select('*')
      .eq('user_id', userId)
      .is('session_id', null)
      .order('recorded_at', { ascending: false });

    if (error) {
      console.log(`Error fetching inbox: ${error.message}`);
      return c.json({ error: 'Failed to fetch inbox' }, 500);
    }

    const normalized = (rows ?? []).map((row) => normalizeInboxClip(row));
    return c.json({ clips: normalized });
  } catch (error) {
    console.log(`Error fetching inbox: ${error}`);
    return c.json({ error: 'Failed to fetch inbox' }, 500);
  }
});

// POST /inbox — save a clip to inbox (no session required)
app.post("/make-server-837ff822/inbox", async (c) => {
  try {
    const userId = await getAuthenticatedUserId(c.req.raw);
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const clipData = await c.req.json();
    const incoming = normalizeInboxClip(clipData);
    const clipId = firstString(incoming.id) ?? crypto.randomUUID();

    const clip = normalizeInboxClip({
      ...incoming,
      id: clipId,
      sessionId: null,
      session_id: null,
      userId,
      user_id: userId,
    });

    const insertPayload: Record<string, unknown> = {
      id: clipId,
      user_id: userId,
      session_id: null,
      local_id: firstString(clip.local_id, clip.id) ?? clipId,
      label: firstString(clip.label) ?? 'Clip',
      media_type: clip.media_type,
      video_storage_path: firstString(clip.video_storage_path),
      audio_storage_path: firstString(clip.audio_storage_path),
      thumbnail_storage_path: firstString(clip.thumbnail_storage_path),
      duration_ms: firstNumber(clip.duration_ms),
      recorded_at: firstString(clip.recorded_at) ?? new Date().toISOString(),
      upload_status: firstString(clip.upload_status) ?? 'local',
    };

    const { data: row, error } = await supabaseAdmin
      .from('clips')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.log(`Error saving inbox clip: ${error.message}`);
      return c.json({ error: 'Failed to save clip' }, 500);
    }

    console.log(`Inbox clip saved: ${clipId}`);
    return c.json({ clip: normalizeInboxClip(row) });
  } catch (error) {
    console.log(`Error saving inbox clip: ${error}`);
    return c.json({ error: 'Failed to save clip' }, 500);
  }
});

// PATCH /inbox/:clipId/assign — assign inbox clip to a session
app.patch("/make-server-837ff822/inbox/:clipId/assign", async (c) => {
  try {
    const userId = await getAuthenticatedUserId(c.req.raw);
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const clipId = c.req.param('clipId');
    const body = (await c.req.json()) as AnyRecord;
    const sessionId = firstString(body.sessionId, body.session_id);
    const section = firstString(body.section, body.sectionLabel, body.section_label);

    if (!sessionId) return c.json({ error: 'sessionId is required' }, 400);

    // Validate target session ownership before proceeding
    const { data: sessionRow, error: sessionErr } = await supabaseAdmin
      .from('sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .maybeSingle();

    if (sessionErr) {
      console.log(`Error verifying session ownership for assign: ${sessionErr.message}`);
      return c.json({ error: 'Failed to assign clip' }, 500);
    }
    if (!sessionRow) {
      return c.json({ error: 'Session not found' }, 404);
    }

    // Query clip from Postgres instead of KV
    const { data: clipRow, error: clipErr } = await supabaseAdmin
      .from('clips')
      .select('*')
      .eq('id', clipId)
      .eq('user_id', userId)
      .is('session_id', null)
      .maybeSingle();

    if (clipErr) {
      console.log(`Error fetching inbox clip for assign: ${clipErr.message}`);
      return c.json({ error: 'Failed to assign clip' }, 500);
    }
    if (!clipRow) {
      return c.json({ error: 'Clip not found in inbox' }, 404);
    }

    const normalized = normalizeInboxClip(clipRow);
    const sectionId =
      section ?? firstString(normalized.section, normalized.section_id) ?? null;
    const local_id =
      firstString(normalized.local_id, normalized.id) ?? clipId;
    const feel_tags = Array.isArray(normalized.feel_tags)
      ? normalized.feel_tags
      : [];
    const recorded_at =
      firstString(
        normalized.recorded_at,
        normalized.recordedAt,
        normalized.created_at,
        normalized.createdAt,
      ) ?? new Date().toISOString();

    const { data: existingClip, error: existingErr } = await supabaseAdmin
      .from('clips')
      .select('id, user_id')
      .eq('id', clipId)
      .maybeSingle();

    if (existingErr) {
      console.log(`Error checking existing clip for assign: ${existingErr.message}`);
      return c.json({ error: 'Failed to assign clip' }, 500);
    }
    if (existingClip && existingClip.user_id !== userId) {
      return c.json({ error: 'Clip id already in use' }, 409);
    }

    const upsertPayload: Record<string, unknown> = {
      id: clipId,
      user_id: userId,
      session_id: sessionId,
      local_id,
      label: firstString(normalized.label) ?? 'Clip',
      section_id: sectionId,
      type_tag: normalized.type_tag ?? null,
      feel_tags,
      timecode_ms: firstNumber(normalized.timecode_ms) ?? null,
      recorded_at,
      upload_status: firstString(normalized.upload_status) ?? 'local',
    };

    for (const key of CLIP_OPTIONAL_DB_KEYS) {
      if (normalized[key] !== undefined) upsertPayload[key] = normalized[key];
    }

    const { data: row, error: upsertErr } = await supabaseAdmin
      .from('clips')
      .upsert(upsertPayload, { onConflict: 'id' })
      .select()
      .single();

    if (upsertErr || !row) {
      console.log(`Error upserting assigned clip: ${upsertErr?.message}`);
      return c.json({ error: 'Failed to assign clip' }, 500);
    }

    // No need to delete from KV - clip is already in Postgres and updated in place

    console.log(`Inbox clip ${clipId} assigned to session ${sessionId}`);
    return c.json({ clip: enrichClipRow(row as Record<string, unknown>) });
  } catch (error) {
    console.log(`Error assigning inbox clip: ${error}`);
    return c.json({ error: 'Failed to assign clip' }, 500);
  }
});

// DELETE /inbox/:clipId — delete an inbox clip
app.delete("/make-server-837ff822/inbox/:clipId", async (c) => {
  try {
    const userId = await getAuthenticatedUserId(c.req.raw);
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const clipId = c.req.param('clipId');
    
    const { error } = await supabaseAdmin
      .from('clips')
      .delete()
      .eq('id', clipId)
      .eq('user_id', userId)
      .is('session_id', null);

    if (error) {
      console.log(`Error deleting inbox clip: ${error.message}`);
      return c.json({ error: 'Failed to delete clip' }, 500);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting inbox clip: ${error}`);
    return c.json({ error: 'Failed to delete clip' }, 500);
  }
});

// ==================== STORAGE ROUTES ====================

// Initialize storage bucket on server startup
const BUCKET_NAME = 'make-837ff822-roam-media';

(async () => {
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
    
    if (!bucketExists) {
      await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
        public: false,
        fileSizeLimit: 524288000, // 500MB
      });
      console.log(`Created storage bucket: ${BUCKET_NAME}`);
    }
  } catch (error) {
    console.log(`Storage bucket initialization error: ${error}`);
  }
})();

app.post("/make-server-837ff822/upload", async (c) => {
  try {
    const userId = await getAuthenticatedUserId(c.req.raw);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const fileType = formData.get('type') as string; // 'video' or 'audio'
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${fileType}/${crypto.randomUUID()}.${fileExt}`;
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });
    
    if (error) {
      console.log(`Upload error: ${error.message}`);
      return c.json({ error: error.message }, 500);
    }
    
    // Generate signed URL valid for 1 year
    const { data: signedUrlData } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .createSignedUrl(fileName, 31536000);
    
    return c.json({ 
      path: data.path,
      url: signedUrlData?.signedUrl,
    });
  } catch (error) {
    console.log(`Upload exception: ${error}`);
    return c.json({ error: 'Upload failed' }, 500);
  }
});

Deno.serve(app.fetch);