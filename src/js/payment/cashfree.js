/**
 * Cashfree Payment Integration — Fixed v6.2
 *
 * FIX: Uses official window.Cashfree from sdk.cashfree.com/js/v3/cashfree.js
 *      (loaded via <script> tag in index.html)
 *      REMOVED: broken esm.sh dynamic import that caused "SDK not loaded" error
 */

import { APP } from '../config.js';
import { UnlockManager } from './unlock.js';
import { showToast } from '../ui/toast.js';

// ── SDK readiness check ───────────────────────────────────
/**
 * Waits for window.Cashfree to be available (loaded from <script> tag).
 * Retries up to 10 times x 300ms = 3 seconds max wait.
 */
function waitForSDK(retries = 10, intervalMs = 300) {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && typeof window.Cashfree === 'function') {
      return resolve(window.Cashfree);
    }
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (typeof window !== 'undefined' && typeof window.Cashfree === 'function') {
        clearInterval(timer);
        resolve(window.Cashfree);
      } else if (attempts >= retries) {
        clearInterval(timer);
        reject(new Error('Cashfree SDK failed to load. Please reload the page and try again.'));
      }
    }, intervalMs);
  });
}

// ── Helpers ───────────────────────────────────────────────
function getPaymentEmail() {
  return document.getElementById('payEmail')?.value.trim() ?? '';
}

async function createOrder(tier, email) {
  const res = await fetch(APP.api.createOrder, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tier, email }),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok || !payload?.ok) throw new Error(payload?.error || 'Order creation failed');
  return payload;
}

async function verifyWithRetries(tier, email, orderId, retries = 6) {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const result = await UnlockManager.verifyWithServer(
      tier, { cashfree_order_id: orderId }, email
    );
    if (result.verified) return true;
    if (!result.pending) return false;
    await new Promise((resolve) => setTimeout(resolve, 1800));
  }
  return false;
}

// ── Main payment flow ──────────────────────────────────────
async function openPayment(tier, onSuccess) {
  const email = getPaymentEmail();
  if (!email || !email.includes('@')) {
    showToast('Please enter your email first.', 'warn');
    document.getElementById('payEmail')?.focus();
    return;
  }

  const isPMGC = tier === 'pmgc';
  const tierLabel = isPMGC ? 'PMGC Elite' : 'Pro v5';
  const payBtn = document.getElementById(isPMGC ? 'pmgcPayBtn' : 'payProBtn');
  const originalText = payBtn?.textContent;

  try {
    if (payBtn) { payBtn.textContent = 'Initializing...'; payBtn.disabled = true; }

    // Step 1: Ensure SDK is loaded
    let CashfreeSDK;
    try {
      CashfreeSDK = await waitForSDK();
    } catch (sdkErr) {
      showToast('Payment SDK not loaded. Please reload the page and try again.', 'error', 6000);
      return;
    }

    // Step 2: Create order on server
    if (payBtn) payBtn.textContent = 'Creating order...';
    const order = await createOrder(tier, email);

    // Step 3: Initialize Cashfree instance with mode from server
    const mode = order.cashfreeMode === 'production' ? 'production' : 'sandbox';
    let cashfree;
    try {
      cashfree = CashfreeSDK({ mode });
    } catch (initErr) {
      console.error('[cashfree] SDK init error:', initErr);
      showToast('Payment failed to initialize. Please reload and try again.', 'error', 5000);
      return;
    }

    // Step 4: Open checkout modal
    if (payBtn) payBtn.textContent = 'Opening checkout...';
    const checkoutResult = await cashfree.checkout({
      paymentSessionId: order.paymentSessionId,
      redirectTarget: '_modal',
    });

    if (checkoutResult?.error) {
      throw new Error(checkoutResult.error.message || 'Payment failed');
    }

    // Step 5: Verify with server
    UnlockManager.saveEmail(email);
    showToast('Verifying payment...', 'default', 5000);

    const verified = await verifyWithRetries(tier, email, order.orderId, 6);
    if (!verified) {
      showToast('Payment received but confirmation pending. Use Restore Access after 1-2 min.', 'warn', 7000);
      return;
    }

    UnlockManager.setPaid(tier, order.cfOrderId || order.orderId);
    showToast(tierLabel + ' unlocked! Payment verified.', 'success', 4000);
    onSuccess?.();

  } catch (err) {
    const msg = err?.message || 'Payment failed. Please try again.';
    showToast(msg, 'error', 5000);
    console.error('[cashfree] Payment error:', err);
  } finally {
    if (payBtn) { payBtn.textContent = originalText; payBtn.disabled = false; }
  }
}

export const payForPro  = (onSuccess) => openPayment('pro',  onSuccess);
export const payForPMGC = (onSuccess) => openPayment('pmgc', onSuccess);
