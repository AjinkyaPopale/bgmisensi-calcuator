/**
 * Unlock Manager
 * Persists + validates tier unlock state.
 */
import { APP } from '../config.js';
import { encodeToken, validateToken } from './security.js';

function _get(key) { try { return localStorage.getItem(key); } catch { return null; } }
function _set(key, val) { try { localStorage.setItem(key, val); return true; } catch { return false; } }
function _del(key) { try { localStorage.removeItem(key); } catch { /* ignore */ } }

export const UnlockManager = {
  getProStatus() { return validateToken(_get(APP.storage.pro)); },

  getPMGCStatus() {
    const t = validateToken(_get(APP.storage.pmgc));
    return t === 'paid' ? 'paid' : null;
  },

  isPro() { return !!this.getProStatus(); },
  isPMGC() { return this.getPMGCStatus() === 'paid'; },

  getEmail() { return _get(APP.storage.email) ?? ''; },
  saveEmail(email) { _set(APP.storage.email, email.toLowerCase().trim()); },

  setDemo() {
    _set(APP.storage.pro, encodeToken({ tier: 'demo', ts: Date.now(), payId: 'demo' }));
  },

  setPaid(tier, paymentId) {
    const key = tier === 'pmgc' ? APP.storage.pmgc : APP.storage.pro;
    _set(key, encodeToken({ tier: 'paid', ts: Date.now(), payId: paymentId }));
  },

  setServerToken(tier, serverToken) {
    const key = tier === 'pmgc' ? APP.storage.pmgc : APP.storage.pro;
    _set(key, serverToken);
  },

  async restoreFromServer(email) {
    if (!email || !email.includes('@')) return null;

    try {
      const res = await fetch(`${APP.api.checkStatus}?email=${encodeURIComponent(email)}`);
      if (!res.ok) return null;

      const data = await res.json();
      if (!data.found) return null;

      if (data.token && data.isPMGC) {
        _set(APP.storage.pmgc, data.token);
      } else if (data.token && data.isPro) {
        _set(APP.storage.pro, data.token);
      }

      this.saveEmail(email);
      return data;
    } catch {
      return null;
    }
  },

  /**
   * Verify payment with server.
   * @returns {Promise<{verified:boolean,pending:boolean}>}
   */
  async verifyWithServer(tier, payData, email) {
    try {
      const res = await fetch(APP.api.verifyPayment, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payData, tier, email }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { verified: false, pending: !!data?.pending };
      }

      if (data.ok && data.token) {
        this.setServerToken(tier, data.token);
        return { verified: true, pending: false };
      }

      return { verified: false, pending: !!data?.pending };
    } catch {
      return { verified: false, pending: false };
    }
  },

  revoke(tier) { _del(tier === 'pmgc' ? APP.storage.pmgc : APP.storage.pro); },
  revokeAll() { _del(APP.storage.pro); _del(APP.storage.pmgc); _del(APP.storage.email); },
};
