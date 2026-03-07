import type { Context, Next } from 'hono';
import { supabase } from './supabase.js';

const UPGRADE_URL = 'https://roamdance.com/pricing';

/**
 * TEMPORARY BETA UNLOCK: When ROAM_BETA_UNLOCK=true, all plan gates are bypassed.
 * Set in .env to allow beta testers full access without paywall/quota limits.
 * To re-enable freemium: remove or set ROAM_BETA_UNLOCK=false and restart the API.
 */
function isBetaUnlockEnabled(): boolean {
  const v = process.env.ROAM_BETA_UNLOCK;
  return v === 'true' || v === '1';
}

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

export type ClipLimitResult =
  | { allowed: true }
  | { allowed: false; status: 403; body: { error: 'plan_limit_reached'; upgrade_url: string } }
  | { allowed: false; status: 500; body: { error: string } };

/** Returns whether the user is capped plus upgrade metadata. Call when session ownership is already validated. */
export async function evaluateClipLimit(userId: string): Promise<ClipLimitResult> {
  if (isBetaUnlockEnabled()) return { allowed: true };
  const planResult = await getPlan(userId);
  if (planResult.error) {
    return { allowed: false, status: 500, body: { error: 'Failed to fetch plan' } };
  }
  const plan = planResult.plan;
  if (plan && plan !== 'free') return { allowed: true };

  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('id')
    .eq('user_id', userId);
  if (sessionsError) {
    return { allowed: false, status: 500, body: { error: 'Failed to evaluate clip limit' } };
  }
  const sessionIds = sessions?.map((s) => s.id) ?? [];
  if (sessionIds.length === 0) return { allowed: true };

  const { count, error: countError } = await supabase
    .from('clips')
    .select('*', { count: 'exact', head: true })
    .in('session_id', sessionIds);
  if (countError) {
    return { allowed: false, status: 500, body: { error: 'Failed to evaluate clip limit' } };
  }
  const clipCount = count ?? 0;
  if (clipCount >= 20) {
    return {
      allowed: false,
      status: 403,
      body: { error: 'plan_limit_reached', upgrade_url: UPGRADE_URL },
    };
  }
  return { allowed: true };
}

export async function checkClipLimit(c: Context, next: Next) {
  const userId = c.get('userId');
  const result = await evaluateClipLimit(userId);
  if (result.allowed) return next();
  return c.json(result.body, result.status);
}

export async function checkSessionLimit(c: Context, next: Next) {
  const userId = c.get('userId');
  if (isBetaUnlockEnabled()) return next();
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
  if (isBetaUnlockEnabled()) return next();
  const planResult = await getPlan(userId);
  if (planResult.error) return planResult.error;
  const plan = planResult.plan;
  if (plan && plan !== 'free') return next();

  return c.json(
    { error: 'plan_limit_reached', upgrade_url: UPGRADE_URL },
    403
  );
}
