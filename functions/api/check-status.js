/**
 * Cloudflare Pages Function: check-status
 * Restores paid tier access by email from Supabase purchases table.
 */

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS });
}

async function hmacHex(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function supabaseFetch(url, serviceKey, email) {
  const params = new URLSearchParams({ select: 'tier,payment_id', email: `eq.${email}`, order: 'created_at.desc' });
  return fetch(`${url}/rest/v1/unlocks?${params.toString()}`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  });
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return new Response('', { status: 200, headers: CORS });
  if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);

  const email = new URL(request.url).searchParams.get('email')?.toLowerCase().trim();
  if (!email || !email.includes('@')) return json({ error: 'Valid email required' }, 400);

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY || !env.CASHFREE_SECRET_KEY) {
    return json({ error: 'Server misconfiguration' }, 500);
  }

  try {
    const dbRes = await supabaseFetch(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, email);
    if (!dbRes.ok) throw new Error(await dbRes.text());

    const rows = await dbRes.json();
    const tiers = rows.map((r) => r.tier);
    const hasPMGC = tiers.includes('pmgc');
    const hasPro = tiers.includes('pro') || hasPMGC;
    const latestPayId = rows[0]?.payment_id ?? '';

    let token = null;
    if (hasPro) {
      const tier = hasPMGC ? 'pmgc' : 'pro';
      token = `v2_srv_${await hmacHex(env.CASHFREE_SECRET_KEY, `${tier}:${email}:${latestPayId}`)}`;
    }

    return json({ found: hasPro, isPro: hasPro, isPMGC: hasPMGC, tiers, token });
  } catch (err) {
    console.error('[check-status] Error:', err?.message || err);
    return json({ error: 'Lookup failed' }, 500);
  }
}
