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

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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
    await kv.del(`session:${userId}:${sessionId}`);
    
    // Also delete related data
    const clips = await kv.getByPrefix(`clip:${userId}:${sessionId}:`);
    const notes = await kv.getByPrefix(`note:${userId}:${sessionId}:`);
    const loops = await kv.getByPrefix(`loop:${userId}:${sessionId}:`);
    const marks = await kv.getByPrefix(`mark:${userId}:${sessionId}:`);
    
    const deleteKeys = [
      ...clips.map(c => `clip:${userId}:${sessionId}:${c.id}`),
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

app.get("/make-server-837ff822/sessions/:sessionId/clips", async (c) => {
  try {
    const userId = await getAuthenticatedUserId(c.req.raw);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const sessionId = c.req.param('sessionId');
    const clips = await kv.getByPrefix(`clip:${userId}:${sessionId}:`);
    
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
    const clipData = await c.req.json();
    const clipId = clipData.id || crypto.randomUUID();
    
    const clip = {
      ...clipData,
      id: clipId,
      sessionId,
      userId,
      createdAt: clipData.createdAt || new Date().toISOString(),
    };
    
    await kv.set(`clip:${userId}:${sessionId}:${clipId}`, clip);
    return c.json({ clip });
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
    
    const sessionId = c.req.param('sessionId');
    const clipId = c.req.param('clipId');
    
    await kv.del(`clip:${userId}:${sessionId}:${clipId}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting clip: ${error}`);
    return c.json({ error: 'Failed to delete clip' }, 500);
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

// Helper to generate share tokens
function generateShareToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// POST /sessions/:sessionId/share — generate session share link
app.post("/make-server-837ff822/sessions/:sessionId/share", async (c) => {
  try {
    const userId = await getAuthenticatedUserId(c.req.raw);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const sessionId = c.req.param('sessionId');
    const session = await kv.get(`session:${userId}:${sessionId}`);
    
    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }
    
    // Check for existing share token
    const existingShare = await kv.get(`share:session:${sessionId}`);
    if (existingShare?.token) {
      const baseUrl = Deno.env.get('PUBLIC_SITE_URL') || 'https://app.example.com';
      return c.json({ token: existingShare.token, url: `${baseUrl}/share/${existingShare.token}` });
    }
    
    // Generate new share token
    const token = generateShareToken();
    const shareData = {
      token,
      sessionId,
      userId,
      type: 'session',
      createdAt: new Date().toISOString(),
    };
    
    await kv.set(`share:session:${sessionId}`, shareData);
    await kv.set(`share:token:${token}`, shareData);
    
    const baseUrl = Deno.env.get('PUBLIC_SITE_URL') || 'https://app.example.com';
    return c.json({ token, url: `${baseUrl}/share/${token}` });
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
    const session = await kv.get(`session:${userId}:${sessionId}`);
    
    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }
    
    const existingShare = await kv.get(`share:session:${sessionId}`);
    if (existingShare?.token) {
      await kv.del(`share:token:${existingShare.token}`);
    }
    await kv.del(`share:session:${sessionId}`);
    
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
    
    const session = await kv.get(`session:${userId}:${sessionId}`);
    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }
    
    const clip = await kv.get(`clip:${userId}:${sessionId}:${clipId}`);
    if (!clip) {
      return c.json({ error: 'Clip not found' }, 404);
    }
    
    // Check for existing share token
    const existingShare = await kv.get(`share:clip:${clipId}`);
    if (existingShare?.token) {
      const baseUrl = Deno.env.get('PUBLIC_SITE_URL') || 'https://app.example.com';
      return c.json({ token: existingShare.token, url: `${baseUrl}/share/${existingShare.token}` });
    }
    
    // Generate new share token
    const token = generateShareToken();
    const shareData = {
      token,
      clipId,
      sessionId,
      userId,
      type: 'clip',
      createdAt: new Date().toISOString(),
    };
    
    await kv.set(`share:clip:${clipId}`, shareData);
    await kv.set(`share:token:${token}`, shareData);
    
    const baseUrl = Deno.env.get('PUBLIC_SITE_URL') || 'https://app.example.com';
    return c.json({ token, url: `${baseUrl}/share/${token}` });
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
    
    const session = await kv.get(`session:${userId}:${sessionId}`);
    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }
    
    const clip = await kv.get(`clip:${userId}:${sessionId}:${clipId}`);
    if (!clip) {
      return c.json({ error: 'Clip not found' }, 404);
    }
    
    const existingShare = await kv.get(`share:clip:${clipId}`);
    if (existingShare?.token) {
      await kv.del(`share:token:${existingShare.token}`);
    }
    await kv.del(`share:clip:${clipId}`);
    
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
    const shareData = await kv.get(`share:token:${token}`);
    
    if (!shareData) {
      return c.json({ error: 'Share link not found or expired' }, 404);
    }
    
    if (shareData.type === 'session') {
      const session = await kv.get(`session:${shareData.userId}:${shareData.sessionId}`);
      if (!session) {
        return c.json({ error: 'Session no longer exists' }, 404);
      }
      return c.json({ type: 'session', session });
    } else if (shareData.type === 'clip') {
      const clip = await kv.get(`clip:${shareData.userId}:${shareData.sessionId}:${shareData.clipId}`);
      if (!clip) {
        return c.json({ error: 'Clip no longer exists' }, 404);
      }
      return c.json({ type: 'clip', clip, sessionId: shareData.sessionId });
    }
    
    return c.json({ error: 'Invalid share type' }, 400);
  } catch (error) {
    console.log(`Error resolving share token: ${error}`);
    return c.json({ error: 'Failed to resolve share link' }, 500);
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