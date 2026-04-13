/**
 * DEBUG ENDPOINT — DELETE THIS FILE AFTER YOUR PAYMENT WORKS!
 * URL: /api/debug
 * 
 * Visit: https://bgmi-calculator.pages.dev/api/debug
 * This tells you exactly which env vars are set and which are missing.
 */

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

export async function onRequest(context) {
  const { env } = context;

  const checks = {
    CASHFREE_APP_ID:       env.CASHFREE_APP_ID     ? '✅ SET (' + env.CASHFREE_APP_ID.slice(0,6) + '...)' : '❌ MISSING',
    CASHFREE_SECRET_KEY:   env.CASHFREE_SECRET_KEY  ? '✅ SET'                                            : '❌ MISSING',
    CASHFREE_ENV:          env.CASHFREE_ENV         ? '✅ ' + env.CASHFREE_ENV                            : '⚠️ NOT SET (defaults to sandbox)',
    SUPABASE_URL:          env.SUPABASE_URL         ? '✅ SET (' + env.SUPABASE_URL.slice(0,30) + '...)' : '❌ MISSING',
    SUPABASE_SERVICE_KEY:  env.SUPABASE_SERVICE_KEY ? '✅ SET'                                            : '❌ MISSING',
  };

  const allGood = !Object.values(checks).some(v => v.startsWith('❌'));

  return new Response(JSON.stringify({
    status: allGood ? '✅ All env vars are set!' : '❌ Some env vars are MISSING — payment will fail',
    environment: checks,
    note: 'DELETE functions/api/debug.js after payment is working!',
  }, null, 2), { status: 200, headers: CORS });
}
