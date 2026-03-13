import type { Context, Next } from 'hono';
import { supabase } from '../lib/supabase.js';

export async function requireAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return c.json({ error: 'Missing or invalid Authorization header' }, 401);
  }
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
  c.set('userId', user.id);
  c.set('userEmail', user.email ?? null);
  return next();
}
