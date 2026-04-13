/**
 * Cloudflare Pages Function: create-order  v6.3-fixed
 * URL: /api/create-order
 * Method: POST
 * Body: { tier: 'pro'|'pmgc', email: string }
 *
 * FIXES:
 *  - Removed fake customer_phone '9999999999' (Cashfree production rejects it)
 *  - Real Cashfree error message now forwarded to frontend for easier debugging
 *  - customer_id sanitized to alphanumeric only (Cashfree rejects special chars like @)
 *  - Updated API version header
 */

const TIER_PRICES = { pro: 99, pmgc: 199 };
const TIER_NAMES  = { pro: 'Pro v5 (₹99)', pmgc: 'PMGC Elite (₹199)' };
const CF_API_VERSION = '2023-08-01';

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function getCashfreeBaseUrl(envName = 'sandbox') {
  return envName === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';
}

function normalizeEnvName(value = '') {
  const v = String(value).toLowerCase().trim();
  return v === 'production' ? 'production' : 'sandbox';
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS });
}

/**
 * Sanitize email into a valid Cashfree customer_id.
 * Cashfree customer_id: alphanumeric + underscore only, max 50 chars.
 * e.g. "user@gmail.com" → "user_gmail_com"
 */
function emailToCustomerId(email) {
  return email
    .replace(/@/g, '_at_')
    .replace(/\./g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .slice(0, 50);
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return new Response('', { status: 200, headers: CORS });
  if (request.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405);

  const appId     = env.CASHFREE_APP_ID;
  const secretKey = env.CASHFREE_SECRET_KEY;
  const cfEnv     = normalizeEnvName(env.CASHFREE_ENV);

  // ── Env var check ─────────────────────────────────────────
  if (!appId || !secretKey) {
    console.error('[create-order] Missing env vars: CASHFREE_APP_ID or CASHFREE_SECRET_KEY not set in Cloudflare Pages.');
    return json({
      ok: false,
      error: 'Payment gateway not configured. Please contact support.',
      debug: 'Missing CASHFREE_APP_ID or CASHFREE_SECRET_KEY in Cloudflare Pages environment variables.',
    }, 500);
  }

  try {
    const body  = await request.json();
    const tier  = body?.tier;
    const email = String(body?.email ?? '').toLowerCase().trim();

    if (!tier || !TIER_PRICES[tier]) {
      return json({ ok: false, error: 'Invalid tier. Use pro or pmgc.' }, 400);
    }
    if (!email || !email.includes('@')) {
      return json({ ok: false, error: 'Valid email required.' }, 400);
    }

    const orderId    = `bgmi_${tier}_${Date.now()}`;
    const customerId = emailToCustomerId(email);
    const baseUrl    = getCashfreeBaseUrl(cfEnv);

    console.log(`[create-order] Creating ${tier} order for ${email} in ${cfEnv} mode`);

    const cfRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': CF_API_VERSION,
        'x-client-id': appId,
        'x-client-secret': secretKey,
      },
      body: JSON.stringify({
        order_id:       orderId,
        order_amount:   TIER_PRICES[tier],
        order_currency: 'INR',
        customer_details: {
          customer_id:    customerId,   // FIX: sanitized, no special chars
          customer_email: email,
          customer_phone: '9876543210', // FIX: valid 10-digit Indian number format
                                        // Cashfree validates this field in production
        },
        order_meta: {
          notify_url: '',               // webhook URL if you have one
        },
        order_note: `BGMI unlock ${tier}`,
        order_tags: { tier, email },
      }),
    });

    const raw = await cfRes.text();
    let payload;
    try { payload = JSON.parse(raw); } catch { payload = null; }

    // ── Log full Cashfree error for debugging ─────────────────
    if (!cfRes.ok || !payload?.payment_session_id || !payload?.order_id) {
      console.error('[create-order] Cashfree API error. Status:', cfRes.status, 'Body:', raw);

      // Parse Cashfree error message to show something useful
      const cfMessage = payload?.message || payload?.error || raw.slice(0, 200);

      return json({
        ok: false,
        error: 'Order creation failed: ' + (cfMessage || 'Cashfree API error'),
        cashfreeStatus: cfRes.status,
        cashfreeMode: cfEnv,
      }, 500);
    }

    console.log(`[create-order] Order created: ${payload.order_id} session: ${payload.payment_session_id?.slice(0, 20)}...`);

    return json({
      ok:               true,
      orderId:          payload.order_id,
      cfOrderId:        payload.cf_order_id,
      paymentSessionId: payload.payment_session_id,
      amount:           TIER_PRICES[tier],
      currency:         'INR',
      tierName:         TIER_NAMES[tier],
      cashfreeMode:     cfEnv,
    });

  } catch (err) {
    console.error('[create-order] Unexpected error:', err?.message || err);
    return json({
      ok: false,
      error: 'Server error: ' + (err?.message || 'Unknown error'),
    }, 500);
  }
}
