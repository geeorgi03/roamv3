import type { Context, Next } from 'hono';
import { supabase } from './supabase.js';

const UPGRADE_URL = 'https://roamdance.com/pricing';

async function getPlan(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('users')
    .select('plan')
    .eq('id', userId)
    .single();
  return data?.plan ?? null;
}

export async function checkClipLimit(c: Context, next: Next): Promise<Response> {
  const userId = c.get('userId');
  const plan = await getPlan(userId);
  if (plan && plan !== 'free') return next();

  const { data: sessions } = await supabase
    .from('sessions')
    .select('id')
    .eq('user_id', userId);
  const sessionIds = sessions?.map((s) => s.id) ?? [];
  const { count } = await supabase
    .from('clips')
    .select('*', { count: 'exact', head: true })
    .in('session_id', sessionIds);
  const clipCount = count ?? 0;
  if (clipCount >= 20) {
    return c.json(
      { error: 'plan_limit_reached', upgrade_url: UPGRADE_URL },
      403
    );
  }
  return next();
}

export async function checkSessionLimit(c: Context, next: Next): Promise<Response> {
  const userId = c.get('userId');
  const plan = await getPlan(userId);
  if (plan && plan !== 'free') return next();

  const { count } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  const sessionCount = count ?? 0;
  if (sessionCount >= 3) {
    return c.json(
      { error: 'plan_limit_reached', upgrade_url: UPGRADE_URL },
      403
    );
  }
  return next();
}

export async function checkMusicSegmentation(c: Context, next: Next): Promise<Response> {
  const userId = c.get('userId');
  const plan = await getPlan(userId);
  if (plan && plan !== 'free') return next();

  return c.json(
    { error: 'plan_limit_reached', upgrade_url: UPGRADE_URL },
    403
  );
}
