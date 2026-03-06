import type { Context, Next } from 'hono';
import { supabase } from './supabase.js';

const UPGRADE_URL = 'https://roamdance.com/pricing';

async function getPlan(userId: string): Promise<{ plan: string | null; error?: Response }> {
  const { data, error } = await supabase
    .from('users')
    .select('plan')
    .eq('id', userId)
    .single();
  if (error) {
    return { plan: null, error: new Response(JSON.stringify({ error: 'Failed to fetch plan' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    }) };
  }
  return { plan: data?.plan ?? null };
}

export async function checkClipLimit(c: Context, next: Next) {
  const userId = c.get('userId');
  const planResult = await getPlan(userId);
  if (planResult.error) return planResult.error;
  const plan = planResult.plan;
  if (plan && plan !== 'free') return next();

  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('id')
    .eq('user_id', userId);
  if (sessionsError) {
    return c.json({ error: 'Failed to evaluate clip limit' }, 500);
  }
  const sessionIds = sessions?.map((s) => s.id) ?? [];
  if (sessionIds.length === 0) {
    return next();
  }
  const { count, error: countError } = await supabase
    .from('clips')
    .select('*', { count: 'exact', head: true })
    .in('session_id', sessionIds);
  if (countError) {
    return c.json({ error: 'Failed to evaluate clip limit' }, 500);
  }
  const clipCount = count ?? 0;
  if (clipCount >= 20) {
    return c.json(
      { error: 'plan_limit_reached', upgrade_url: UPGRADE_URL },
      403
    );
  }
  return next();
}

export async function checkSessionLimit(c: Context, next: Next) {
  const userId = c.get('userId');
  const planResult = await getPlan(userId);
  if (planResult.error) return planResult.error;
  const plan = planResult.plan;
  if (plan && plan !== 'free') return next();

  const { count, error } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (error) {
    return c.json({ error: 'Failed to evaluate session limit' }, 500);
  }
  const sessionCount = count ?? 0;
  if (sessionCount >= 3) {
    return c.json(
      { error: 'plan_limit_reached', upgrade_url: UPGRADE_URL },
      403
    );
  }
  return next();
}

export async function checkMusicSegmentation(c: Context, next: Next) {
  const userId = c.get('userId');
  const planResult = await getPlan(userId);
  if (planResult.error) return planResult.error;
  const plan = planResult.plan;
  if (plan && plan !== 'free') return next();

  return c.json(
    { error: 'plan_limit_reached', upgrade_url: UPGRADE_URL },
    403
  );
}
