import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';
import type { ClipTagHistory } from '@roam/types';

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

/** GET /clips/:id/tag-history — list tag history for clip */
app.get('/:id/tag-history', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const owns = await getClipForUser(id, userId);
  if (!owns) return c.json({ error: 'Not found' }, 404);

  const { data, error } = await supabase
    .from('clip_tag_history')
    .select('*')
    .eq('clip_id', id)
    .order('saved_at', { ascending: false });

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data as ClipTagHistory[]);
});

export const tagHistoryRoutes = app;
