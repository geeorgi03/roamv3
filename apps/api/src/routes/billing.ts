import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';
import { stripe, PRICE_IDS } from '../lib/stripe.js';

const app = new Hono<{ Variables: { userId: string } }>().use('*', requireAuth);

const SUCCESS_URL = 'https://roamdance.com/billing/success';
const CANCEL_URL = 'https://roamdance.com/billing/cancel';
const PORTAL_RETURN_URL = 'https://roamdance.com/billing';

/** GET /billing/me — returns current user's plan and stripe_customer_id */
app.get('/me', async (c) => {
  const userId = c.get('userId');
  const { data, error } = await supabase
    .from('users')
    .select('plan, stripe_customer_id')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return c.json({ error: 'User not found' }, 404);
  }
  return c.json({ plan: data.plan, stripe_customer_id: data.stripe_customer_id });
});

/** POST /billing/checkout — creates Stripe Checkout Session */
app.post('/checkout', async (c) => {
  const userId = c.get('userId');
  let body: { plan?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid request body' }, 400);
  }

  const plan = body?.plan;
  if (!plan || !['creator', 'pro', 'studio'].includes(plan)) {
    return c.json({ error: 'Invalid plan. Must be creator, pro, or studio.' }, 400);
  }

  const priceId = PRICE_IDS[plan as 'creator' | 'pro' | 'studio'];
  if (!priceId) {
    return c.json({ error: 'Price not configured for this plan' }, 502);
  }

  const { data: userRow, error: userError } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (userError || !userRow) {
    return c.json({ error: 'User not found' }, 404);
  }

  let customerId = userRow.stripe_customer_id as string | null;
  const { data: authUser } = await supabase.auth.admin.getUserById(userId);
  const userEmail = authUser?.user?.email ?? null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: userEmail ?? undefined,
    });
    customerId = customer.id;
    await supabase
      .from('users')
      .update({ stripe_customer_id: customerId })
      .eq('id', userId);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: SUCCESS_URL,
    cancel_url: CANCEL_URL,
  });

  return c.json({ checkout_url: session.url });
});

/** POST /billing/portal — creates Stripe Customer Portal session */
app.post('/portal', async (c) => {
  const userId = c.get('userId');
  const { data, error } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (error || !data?.stripe_customer_id) {
    return c.json({ error: 'No subscription to manage' }, 400);
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: data.stripe_customer_id,
    return_url: PORTAL_RETURN_URL,
  });

  return c.json({ portal_url: portalSession.url });
});

export const billingRoutes = app;
