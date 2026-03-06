/**
 * Roam REST API — server bootstrap, session and clip routes, Supabase client wiring.
 * Uses @roam/types as the shared consumer contract and @roam/db for Supabase (service role).
 */
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

const app = new Hono();

app.get('/', (c) => c.json({ name: 'Roam API', version: '0.0.1' }));

// Mount more specific routes first so /sessions/:id/music and /sessions/:sessionId/clips are matched before /sessions/:id
app.route('/sessions', musicRoutes);
app.route('/sessions', clipsRoutes);
app.route('/sessions', assemblyRoutes);
app.route('/sessions', sessionsRoutes);
app.route('/sessions', shareRoutes);
app.route('/clips', feedbackRoutes);
app.route('/clips', annotationsRoutes);
app.route('/clips', tagHistoryRoutes);
app.route('/clips', tagsRoutes);
app.route('/clips', muxRoutes); // POST /clips/upload-url
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

const port = Number(process.env.PORT) || 3001;

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Roam API listening on http://localhost:${info.port}`);
});
