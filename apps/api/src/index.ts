/**
 * Roam REST API — server bootstrap, session and clip routes, Supabase client wiring.
 * Uses @roam/types as the shared consumer contract and @roam/db for Supabase (service role).
 */
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { sessionsRoutes } from './routes/sessions.js';
import { clipsRoutes } from './routes/clips.js';
import { tagsRoutes } from './routes/tags.js';

const app = new Hono();

app.get('/', (c) => c.json({ name: 'Roam API', version: '0.0.1' }));

// Mount more specific routes first so /sessions/:id/clips is matched before /sessions/:id
app.route('/sessions', clipsRoutes);
app.route('/sessions', sessionsRoutes);
app.route('/clips', tagsRoutes);

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
