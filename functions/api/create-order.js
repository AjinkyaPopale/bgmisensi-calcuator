/**
 * Cloudflare Pages Function: create-order
 * URL: /api/create-order
 * Method: POST
 * Body: { tier: 'pro'|'pmgc', email: string }
 *
 * Creates a Cashfree order server-side and returns payment_session_id.
 */

const TIER_PRICES = { pro: 99, pmgc: 199 };
const TIER_NAMES = { pro: 'Pro v5 (₹99)', pmgc: 'PMGC Elite (₹199)' };
const API_VERSION = '2023-08-01';

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function getCashfreeBaseUrl(envName = 'sandbox') {
  return envName === 'production' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';
}

function normalizeEnvName(value = '') {
  const v = String(value).toLowerCase().trim();
  return v === 'production' ? 'production' : 'sandbox';
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS });
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return new Response('', { status: 200, headers: CORS });
  if (request.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405);

  const appId = env.CASHFREE_APP_ID;
  const secretKey = env.CASHFREE_SECRET_KEY;
  const cfEnv = normalizeEnvName(env.CASHFREE_ENV);

  if (!appId || !secretKey) {
    console.error('[create-order] Missing CASHFREE_APP_ID/CASHFREE_SECRET_KEY');
    return json({ ok: false, error: 'Payment gateway not configured. Contact support.' }, 500);
  }

  try {
    const body = await request.json();
    const tier = body?.tier;
    const email = String(body?.email ?? '').toLowerCase().trim();

    if (!tier || !TIER_PRICES[tier]) return json({ ok: false, error: 'Invalid tier. Use pro or pmgc.' }, 400);
    if (!email || !email.includes('@')) return json({ ok: false, error: 'Valid email required.' }, 400);

    const orderId = `bgmi_${tier}_${Date.now()}`;
    const baseUrl = getCashfreeBaseUrl(cfEnv);

    const cfRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': API_VERSION,
        'x-client-id': appId,
        'x-client-secret': secretKey,
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: TIER_PRICES[tier],
        order_currency: 'INR',
        customer_details: {
          customer_id: email,
          customer_email: email,
          customer_phone: '9999999999',
        },
        order_note: `BGMI unlock ${tier}`,
        order_tags: { tier, email },
      }),
    });

    const raw = await cfRes.text();
    let payload;
    try { payload = JSON.parse(raw); } catch { payload = null; }

    if (!cfRes.ok || !payload?.payment_session_id || !payload?.order_id) {
      console.error('[create-order] Cashfree error:', raw);
      return json({ ok: false, error: 'Order creation failed. Try again.' }, 500);
    }

    return json({
      ok: true,
      orderId: payload.order_id,
      cfOrderId: payload.cf_order_id,
      paymentSessionId: payload.payment_session_id,
      amount: TIER_PRICES[tier],
      currency: 'INR',
      tierName: TIER_NAMES[tier],
      cashfreeMode: cfEnv,
    });
  } catch (err) {
    console.error('[create-order] Error:', err?.message || err);
    return json({ ok: false, error: 'Order creation failed. Try again.' }, 500);
  }
}
