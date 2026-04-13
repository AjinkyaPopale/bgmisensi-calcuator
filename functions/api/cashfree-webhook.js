/**
 * Cloudflare Pages Function: cashfree-webhook
 * Verifies Cashfree webhook signature and stores successful purchases in Supabase.
 */

const API_VERSION = '2023-08-01';

function normalizeEnvName(value = '') {
  const v = String(value).toLowerCase().trim();
  return v === 'production' ? 'production' : 'sandbox';
}

function getCashfreeBaseUrl(envName = 'sandbox') {
  return envName === 'production' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';
}

async function hmacHex(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hmacBase64(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  const bytes = new Uint8Array(sig);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
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

async function supabaseUpsert(url, serviceKey, record) {
  return fetch(`${url}/rest/v1/unlocks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify(record),
  });
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (!env.CASHFREE_SECRET_KEY || !env.CASHFREE_APP_ID) return new Response('Webhook not configured', { status: 500 });

  const rawBody = await request.text();
  const signature = (request.headers.get('x-webhook-signature') || request.headers.get('x-cf-signature') || '').trim();
  const timestamp = (request.headers.get('x-webhook-timestamp') || '').trim();

  if (!signature) return new Response('Missing signature', { status: 400 });

  // Handle common Cashfree signature variants (hex/base64, with/without timestamp prefix)
  const checks = await Promise.all([
    hmacBase64(env.CASHFREE_SECRET_KEY, `${timestamp}${rawBody}`),
    hmacBase64(env.CASHFREE_SECRET_KEY, rawBody),
    hmacHex(env.CASHFREE_SECRET_KEY, `${timestamp}${rawBody}`),
    hmacHex(env.CASHFREE_SECRET_KEY, rawBody),
  ]);
  if (!checks.includes(signature)) return new Response('Invalid signature', { status: 400 });

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const eventType = String(payload?.type ?? payload?.event ?? '').toUpperCase();
  const payment = payload?.data?.payment ?? payload?.payment ?? {};
  const order = payload?.data?.order ?? payload?.order ?? {};
  const orderId = String(order?.order_id ?? payment?.order_id ?? '').trim();

  if (!orderId) {
    return new Response(JSON.stringify({ received: true, action: 'ignored_missing_order' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const isSuccessEvent = eventType.includes('SUCCESS') || String(payment?.payment_status ?? '').toUpperCase() === 'SUCCESS';
  if (!isSuccessEvent) {
    return new Response(JSON.stringify({ received: true, action: 'ignored_non_success' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    return new Response('Supabase not configured', { status: 500 });
  }

  const cfEnv = normalizeEnvName(env.CASHFREE_ENV);
  const baseUrl = getCashfreeBaseUrl(cfEnv);

  const { res: orderLookup, data: orderData, raw: orderRaw } = await cfFetchJson(
    `${baseUrl}/orders/${encodeURIComponent(orderId)}`,
    env.CASHFREE_APP_ID,
    env.CASHFREE_SECRET_KEY,
  );

  if (!orderLookup.ok || !orderData || String(orderData.order_status ?? '').toUpperCase() !== 'PAID') {
    console.error('[cashfree-webhook] order lookup failed:', orderRaw);
    return new Response(JSON.stringify({ received: true, action: 'order_not_paid' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const email = String(
    orderData.customer_details?.customer_email
    ?? order.order_tags?.email
    ?? payment.customer_details?.customer_email
    ?? 'unknown',
  ).toLowerCase().trim();

  const tier = String(orderData.order_tags?.tier ?? order.order_tags?.tier ?? '').toLowerCase();
  const paymentId = String(
    payment?.cf_payment_id
    ?? await getLatestCfPaymentId(baseUrl, orderData.order_id || orderId, env.CASHFREE_APP_ID, env.CASHFREE_SECRET_KEY)
    ?? orderData.cf_payment_id
    ?? orderData.order_id
    ?? orderId,
  ).trim();

  if (!['pro', 'pmgc'].includes(tier)) {
    return new Response(JSON.stringify({ received: true, action: 'ignored_invalid_tier' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const dbRes = await supabaseUpsert(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    email,
    tier,
    payment_id: paymentId,
    order_id: orderData.order_id || orderId,
  });

  if (!dbRes.ok && dbRes.status !== 409) {
    console.error('[cashfree-webhook] DB error:', await dbRes.text());
    return new Response(JSON.stringify({ received: true, action: 'db_error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ received: true, action: 'recorded', orderId, paymentId, tier }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
