/**
 * Roam REST API — server bootstrap, session and clip routes, Supabase client wiring.
 * Uses @roam/types as the shared consumer contract and @roam/db for Supabase (service role).
 */

const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SHARE_BASE_URL',
  'MUX_TOKEN_ID',
  'MUX_TOKEN_SECRET',
  'MUX_WEBHOOK_SECRET',
  'PORT',
] as const;

const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingEnvVars.length > 0) {
  // Fail fast on misconfiguration so deployments don't silently degrade at runtime.
  console.error(
    'Missing required environment variables. Set these in your deployment environment:',
    missingEnvVars.join(', ')
  );
  process.exit(1);
}

if (process.env.ROAM_BETA_UNLOCK !== 'true') {
  console.error(
    'DEP-1 soft launch requires ROAM_BETA_UNLOCK to be set to "true". Current value:',
    process.env.ROAM_BETA_UNLOCK ?? 'undefined'
  );
  process.exit(1);
}

const portRaw = process.env.PORT;
const parsedPort = Number(portRaw);
if (!portRaw || !Number.isInteger(parsedPort) || parsedPort <= 0) {
  console.error(
    'PORT must be set to a valid positive integer. Received:',
    portRaw ?? 'undefined'
  );
  process.exit(1);
}
const PORT = parsedPort;

import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { sessionsRoutes } from './routes/sessions.js';
import { clipsRoutes } from './routes/clips.js';
import { shareRoutes } from './routes/share.js';
import { musicRoutes } from './routes/music.js';
import { assemblyRoutes } from './routes/assembly.js';
import { feedbackRoutes } from './routes/feedback.js';
import { annotationsRoutes } from './routes/annotations.js';
import { tagHistoryRoutes } from './routes/tagHistory.js';
import { tagsRoutes } from './routes/tags.js';
import { muxRoutes } from './routes/mux.js';
import { publicFeedbackRoutes } from './routes/feedbackPublic.js';
import { webhooksRoutes } from './routes/webhooks.js';
import { libraryRoutes } from './routes/library.js';
import { billingRoutes } from './routes/billing.js';
import { inboxRoutes } from './routes/inbox.js';
import { notePinsRoutes } from './routes/notePins.js';
import { clipShareRoutes } from './routes/share.js';

const app = new Hono();

const BUILD_SHA =
  process.env.RENDER_GIT_COMMIT ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.GIT_COMMIT ||
  null;

app.get('/', (c) =>
  c.json({
    name: 'Roam API',
    version: '0.0.2',
    build: BUILD_SHA,
  })
);
app.get('/health', (c) => c.json({ status: 'ok', build: BUILD_SHA }));

// Mount more specific routes first so /sessions/:id/music and /sessions/:sessionId/clips are matched before /sessions/:id
app.route('/sessions', musicRoutes);
app.route('/sessions', clipsRoutes);
app.route('/sessions', assemblyRoutes);
app.route('/sessions', sessionsRoutes);
app.route('/sessions', shareRoutes);
app.route('/sessions', notePinsRoutes);
app.route('/clips', feedbackRoutes);
app.route('/clips', annotationsRoutes);
app.route('/clips', tagHistoryRoutes);
app.route('/clips', tagsRoutes);
app.route('/clips', muxRoutes); // POST /clips/upload-url
app.route('/clips', clipShareRoutes);
app.route('/inbox', inboxRoutes);
app.route('/feedback', publicFeedbackRoutes);
app.route('/webhooks', webhooksRoutes); // POST /webhooks/mux
app.route('/library', libraryRoutes);
app.route('/billing', billingRoutes);

app.onError((err, c) => {
  console.error(err);
  if (process.env.NODE_ENV === 'production') {
    return c.json({ error: 'Internal Server Error' }, 500);
  }
  return c.json(
    { error: err.message, detail: err.stack ?? '' },
    500
  );
});

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`Roam API listening on http://localhost:${info.port}`);
});
