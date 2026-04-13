/**
 * Cloudflare Pages Function: verify-payment
 * Confirms Cashfree order status, writes purchase to Supabase, then issues access token.
 */

const API_VERSION = '2023-08-01';

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function normalizeEnvName(value = '') {
  const v = String(value).toLowerCase().trim();
  return v === 'production' ? 'production' : 'sandbox';
}

function getCashfreeBaseUrl(envName = 'sandbox') {
  return envName === 'production' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS });
}

async function hmacHex(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function cfFetchJson(url, appId, secretKey) {
  const res = await fetch(url, {
    headers: {
      'x-api-version': API_VERSION,
      'x-client-id': appId,
      'x-client-secret': secretKey,
    },
  });
  const raw = await res.text();
  let data;
  try { data = JSON.parse(raw); } catch { data = null; }
  return { res, data, raw };
}

async function getLatestCfPaymentId(baseUrl, orderId, appId, secretKey) {
  const { res, data } = await cfFetchJson(`${baseUrl}/orders/${encodeURIComponent(orderId)}/payments`, appId, secretKey);
  if (!res.ok || !Array.isArray(data) || data.length === 0) return null;

  const success = data.find((p) => String(p?.payment_status ?? '').toUpperCase() === 'SUCCESS');
  return success?.cf_payment_id ?? data[0]?.cf_payment_id ?? null;
}

async function supabaseInsert(url, serviceKey, record) {
  return fetch(`${url}/rest/v1/unlocks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Prefer: 'resolution=ignore-duplicates',
    },
    body: JSON.stringify(record),
  });
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return new Response('', { status: 200, headers: CORS });
  if (request.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405);

  const appId = env.CASHFREE_APP_ID;
  const secretKey = env.CASHFREE_SECRET_KEY;
  const cfEnv = normalizeEnvName(env.CASHFREE_ENV);

  if (!appId || !secretKey || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    return json({ ok: false, error: 'Server misconfiguration' }, 500);
  }

  try {
    const body = await request.json();
    const tier = body?.tier;
    const email = String(body?.email ?? '').toLowerCase().trim();
    const orderId = String(body?.cashfree_order_id ?? body?.orderId ?? '').trim();

    if (!['pro', 'pmgc'].includes(tier) || !email || !email.includes('@') || !orderId) {
      return json({ ok: false, error: 'Missing required fields' }, 400);
    }

    const baseUrl = getCashfreeBaseUrl(cfEnv);
    const { res: orderRes, data: orderData, raw: orderRaw } = await cfFetchJson(
      `${baseUrl}/orders/${encodeURIComponent(orderId)}`,
      appId,
      secretKey,
    );

    if (!orderRes.ok || !orderData) {
      console.error('[verify-payment] Cashfree order lookup failed:', orderRaw);
      return json({ ok: false, error: 'Unable to verify payment right now' }, 502);
    }

    const orderStatus = String(orderData.order_status ?? '').toUpperCase();
    if (orderStatus !== 'PAID') {
      return json({ ok: false, pending: true, status: orderStatus || 'UNKNOWN', error: 'Payment not completed yet' }, 409);
    }

    const paidEmail = String(orderData.customer_details?.customer_email ?? '').toLowerCase().trim();
    if (paidEmail && paidEmail !== email) {
      return json({ ok: false, error: 'Email mismatch for this order' }, 403);
    }

    const cfPaymentId = String(
      body?.cf_payment_id
      ?? await getLatestCfPaymentId(baseUrl, orderData.order_id || orderId, appId, secretKey)
      ?? orderData.cf_payment_id
      ?? orderData.order_id
      ?? orderId,
    ).trim();

    const dbRes = await supabaseInsert(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
      email,
      tier,
      payment_id: cfPaymentId,
      order_id: orderData.order_id || orderId,
    });

    if (!dbRes.ok && dbRes.status !== 409) {
      const err = await dbRes.text();
      console.error('[verify-payment] DB error:', err);
      return json({ ok: false, error: 'Payment verified but storage failed. Contact support.' }, 502);
    }

    const token = `v2_srv_${await hmacHex(secretKey, `${tier}:${email}:${cfPaymentId}`)}`;
    return json({ ok: true, token, paymentId: cfPaymentId, orderId: orderData.order_id || orderId, status: orderStatus });
  } catch (err) {
    console.error('[verify-payment] Error:', err?.message || err);
    return json({ ok: false, error: 'Server error. Contact support.' }, 500);
  }
}
