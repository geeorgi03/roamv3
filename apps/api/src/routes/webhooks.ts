import { createHmac, timingSafeEqual } from 'node:crypto';
import { Hono } from 'hono';
import { supabase } from '../lib/supabase.js';
import { stripe, PRICE_IDS } from '../lib/stripe.js';

function verifyMuxSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string
): boolean {
  if (!signatureHeader || !secret) return false;
  const parts = signatureHeader.split(',');
  let t: string | null = null;
  let v1: string | null = null;
  for (const part of parts) {
    const [key, value] = part.trim().split('=');
    if (key === 't') t = value ?? null;
    if (key === 'v1') v1 = value ?? null;
  }
  if (!t || !v1) return false;
  const signedPayload = `${t}.${rawBody}`;
  const computed = createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  try {
    const v1Buf = Buffer.from(v1, 'hex');
    const computedBuf = Buffer.from(computed, 'hex');
    if (v1Buf.length !== computedBuf.length) return false;
    return timingSafeEqual(v1Buf, computedBuf);
  } catch {
    return false;
  }
}

const app = new Hono();

/** POST /mux — Mux webhook (signature-verified, no auth) */
app.post('/mux', async (c) => {
  const rawBody = await c.req.raw.text();
  const signatureHeader = c.req.header('mux-signature') ?? '';
  const secret = process.env.MUX_WEBHOOK_SECRET ?? '';
  if (!verifyMuxSignature(rawBody, signatureHeader, secret)) {
    return c.json({ error: 'Invalid signature' }, 400);
  }

  let payload: { type?: string; data?: Record<string, unknown> };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400);
  }

  const type = payload?.type;
  const data = payload?.data as Record<string, unknown> | undefined;

  /** Resolve clip_id from webhook: primary = data.passthrough (embedded in Mux event), fallback = DB row by mux_upload_id */
  async function resolveClipId(
    uploadId: string | undefined,
    passthroughRaw: unknown
  ): Promise<{ clipId: string | null; fetchError: Error | null }> {
    let clipIdFromPassthrough: string | null = null;
    if (passthroughRaw != null && typeof passthroughRaw === 'string') {
      try {
        const parsed = JSON.parse(passthroughRaw) as Record<string, unknown>;
        const id = parsed?.clip_id;
        if (typeof id === 'string') clipIdFromPassthrough = id;
      } catch {
        /* ignore parse errors, use fallback */
      }
    }
    if (clipIdFromPassthrough) return { clipId: clipIdFromPassthrough, fetchError: null };
    if (!uploadId) return { clipId: null, fetchError: null };
    const { data: clipRow, error: fetchError } = await supabase
      .from('clips')
      .select('id, mux_passthrough')
      .eq('mux_upload_id', uploadId)
      .single();
    if (fetchError) return { clipId: null, fetchError };
    const passthrough = clipRow?.mux_passthrough as Record<string, unknown> | null;
    const clipId = (passthrough?.clip_id as string) ?? null;
    return { clipId, fetchError: null };
  }

  if (type === 'video.asset.ready' && data) {
    const uploadId = data.upload_id as string | undefined;
    const passthroughRaw = data.passthrough;
    const muxAssetId = data.id as string | undefined;
    const playbackIds = data.playback_ids as Array<{ id?: string }> | undefined;
    const muxPlaybackId = playbackIds?.[0]?.id;

    const { clipId, fetchError } = await resolveClipId(uploadId, passthroughRaw);
    if (fetchError) {
      return c.json({ error: 'Database error', detail: fetchError.message }, 503);
    }
    if (!clipId || !muxAssetId || !muxPlaybackId) {
      return c.json({ received: true }, 200);
    }
    const updateQuery = supabase
      .from('clips')
      .update({
        mux_asset_id: muxAssetId,
        mux_playback_id: muxPlaybackId,
        upload_status: 'ready',
      })
      .eq('id', clipId);
    const { error: updateError } = uploadId
      ? await updateQuery.eq('mux_upload_id', uploadId)
      : await updateQuery;
    if (updateError) {
      return c.json({ error: 'Database error', detail: updateError.message }, 503);
    }
    return c.json({ received: true }, 200);
  }

  if (type === 'video.asset.errored' && data) {
    const uploadId = data.upload_id as string | undefined;
    const passthroughRaw = data.passthrough;
    const { clipId, fetchError } = await resolveClipId(uploadId, passthroughRaw);
    if (fetchError) {
      return c.json({ error: 'Database error', detail: fetchError.message }, 503);
    }
    if (!clipId) {
      return c.json({ received: true }, 200);
    }
    const { error: updateError } = await supabase
      .from('clips')
      .update({ upload_status: 'failed' })
      .eq('id', clipId);
    if (updateError) {
      return c.json({ error: 'Database error', detail: updateError.message }, 503);
    }
    return c.json({ received: true }, 200);
  }

  return c.json({ received: true }, 200);
});

/** POST /stripe — Stripe webhook (signature-verified, no auth) */
app.post('/stripe', async (c) => {
  const rawBody = await c.req.raw.text();
  const sig = c.req.header('stripe-signature') ?? '';
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? '';
  let event: { type: string; data?: { object?: Record<string, unknown> } };
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret) as unknown as typeof event;
  } catch {
    return c.json({ error: 'Invalid signature' }, 400);
  }

  const VALID_PLANS = ['free', 'creator', 'pro', 'studio'] as const;
  const LOOKUP_KEY_TO_PLAN: Record<string, (typeof VALID_PLANS)[number]> = {
    creator: 'creator',
    pro: 'pro',
    studio: 'studio',
  };

  function planFromSubscription(sub: Record<string, unknown>): string | null {
    const items = sub.items as {
      data?: Array<{
        price?: {
          metadata?: Record<string, string>;
          lookup_key?: string;
          id?: string;
        };
      }>;
    } | undefined;
    const price = items?.data?.[0]?.price;
    if (!price) return null;

    const fromMetadata = price.metadata?.plan;
    if (typeof fromMetadata === 'string' && VALID_PLANS.includes(fromMetadata as (typeof VALID_PLANS)[number])) {
      return fromMetadata;
    }

    const fromLookupKey = price.lookup_key && LOOKUP_KEY_TO_PLAN[price.lookup_key];
    if (fromLookupKey) return fromLookupKey;

    const priceId = price.id;
    if (typeof priceId === 'string') {
      const byId = (Object.entries(PRICE_IDS) as [keyof typeof PRICE_IDS, string | undefined][])
        .find(([, id]) => id === priceId)?.[0];
      if (byId) return byId;
    }

    return null;
  }

  function customerIdFromSubscription(sub: Record<string, unknown>): string | null {
    const cid = sub.customer;
    return typeof cid === 'string' ? cid : null;
  }

  if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
    const sub = event.data?.object as Record<string, unknown> | undefined;
    if (!sub) return c.json({ received: true }, 200);
    const customerId = customerIdFromSubscription(sub);
    const plan = planFromSubscription(sub);
    const subId = sub.id as string | undefined;
    if (!customerId || !plan || plan === 'free') return c.json({ received: true }, 200);
    const { error } = await supabase
      .from('users')
      .update({ plan, stripe_subscription_id: subId ?? null })
      .eq('stripe_customer_id', customerId);
    if (error) return c.json({ error: error.message }, 503);
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data?.object as Record<string, unknown> | undefined;
    if (!sub) return c.json({ received: true }, 200);
    const customerId = customerIdFromSubscription(sub);
    if (!customerId) return c.json({ received: true }, 200);
    const { error } = await supabase
      .from('users')
      .update({ plan: 'free', stripe_subscription_id: null })
      .eq('stripe_customer_id', customerId);
    if (error) return c.json({ error: error.message }, 503);
  }

  return c.json({ received: true }, 200);
});

export const webhooksRoutes = app;
