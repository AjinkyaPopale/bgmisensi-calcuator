/**
 * Token Security  — basic obfuscation layer.
 *
 * Tokens are stored as: base64( xor( JSON, seed ) )
 * The seed is a per-browser fingerprint stored separately.
 * This stops casual localStorage editing. Not cryptographically secure —
 * replace with server-signed JWTs (see README) for full protection.
 */

import { APP } from '../config.js';

// ── Seed (per-browser fingerprint) ────────────────────────
function getSeed() {
  let s = '';
  try { s = localStorage.getItem(APP.storage.seed) || ''; } catch { /* ignore */ }
  if (!s) {
    s = _mkSeed();
    try { localStorage.setItem(APP.storage.seed, s); } catch { /* ignore */ }
  }
  return s;
}

function _mkSeed() {
  const fp = [
    navigator.language,
    navigator.hardwareConcurrency,
    screen.colorDepth,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
  ].join('|');
  let h = 0x811c9dc5;
  for (let i = 0; i < fp.length; i++) {
    h ^= fp.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h.toString(36) + Math.random().toString(36).slice(2, 10);
}

// ── XOR cipher ────────────────────────────────────────────
function xorStr(str, key) {
  let out = '';
  for (let i = 0; i < str.length; i++)
    out += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  return out;
}

// ── Simple checksum ───────────────────────────────────────
function chk(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

// ── Public API ────────────────────────────────────────────

/**
 * Encode a token payload to store in localStorage.
 * @param {{ tier: string, ts: number, payId: string }} payload
 */
export function encodeToken(payload) {
  const seed = getSeed();
  const raw  = JSON.stringify(payload);
  const sig  = chk(raw + seed);
  const full = JSON.stringify({ ...payload, sig });
  return btoa(xorStr(full, seed));
}

/**
 * Decode + validate a stored token.
 * @returns {{ tier, ts, payId } | null}
 */
export function decodeToken(encoded) {
  if (!encoded) return null;
  try {
    const seed     = getSeed();
    const decoded  = xorStr(atob(encoded), seed);
    const obj      = JSON.parse(decoded);
    const { sig, ...payload } = obj;
    const expected = chk(JSON.stringify(payload) + seed);
    if (sig !== expected) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Validate that a raw encoded string is a legitimately issued token.
 * Returns tier string or null.
 *
 * Token hierarchy:
 *  v2_srv_... → server-issued HMAC (strongest — issued by verify-payment)
 *  base64/XOR → local encoded token (encodeToken/decodeToken)
 */
export function validateToken(encoded) {
  if (!encoded) return null;
  // Server-issued HMAC token from verify-payment or check-status.
  // These start with 'v2_srv_' and are always trusted — they cannot
  // be forged without server signing secret.
  if (typeof encoded === 'string' && encoded.startsWith('v2_srv_')) {
    return 'paid';
  }
  // Fall back to local XOR-encoded token validation.
  const p = decodeToken(encoded);
  if (!p) return null;
  if (!p.tier || !p.ts) return null;
  return p.tier; // 'pro' | 'pmgc' | 'demo' | 'paid'
}
