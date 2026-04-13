/**
 * App-wide configuration — single source of truth.
 */
export const APP = Object.freeze({
  name: 'Ajinkya2OP',
  version: '6.1',
  base: 'iQOO Neo 7 Pro · 90FPS · 8yr Tuned',

  tiers: {
    free: { label: 'Free', price: 0 },
    pro: { label: 'Pro 👑', price: 99 },
    pmgc: { label: 'PMGC Elite 🔥', price: 199 },
  },

  payment: {
    provider: 'cashfree',
  },

  api: {
    createOrder: '/api/create-order',
    verifyPayment: '/api/verify-payment',
    checkStatus: '/api/check-status',
  },

  storage: {
    pro: '__b_p',
    pmgc: '__b_m',
    seed: '__b_s',
    email: '__b_e',
  },

  debounce: 100,
});
