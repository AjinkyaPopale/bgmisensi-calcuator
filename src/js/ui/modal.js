/**
 * Pro Modal Controller
 * Updated: email input + restore-access feature
 */

import { showToast }             from './toast.js';
import { UnlockManager }         from '../payment/unlock.js';
import { payForPro, payForPMGC } from '../payment/cashfree.js';

export function openProModal() {
  const o = document.getElementById('proOverlay');
  if (!o) return;
  // Pre-fill email if we have it stored
  const savedEmail = UnlockManager.getEmail();
  const emailInput = document.getElementById('payEmail');
  if (emailInput && savedEmail) emailInput.value = savedEmail;
  o.hidden = false;
  document.body.style.overflow = 'hidden';
}

export function closeProModal() {
  const o = document.getElementById('proOverlay');
  if (!o) return;
  o.hidden = true;
  document.body.style.overflow = '';
}

export function initModal(onProUnlock, onPMGCUnlock) {
  // ── Close ────────────────────────────────────────────
  document.getElementById('pmClose')?.addEventListener('click', closeProModal);
  document.getElementById('proOverlay')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('proOverlay')) closeProModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !document.getElementById('proOverlay')?.hidden) closeProModal();
  });

  // ── Real Pro payment (only way to unlock) ────────────
  document.getElementById('payProBtn')?.addEventListener('click', () => {
    payForPro(() => {
      closeProModal();
      onProUnlock?.('paid');
    });
  });

  // ── PMGC payment ─────────────────────────────────────
  document.getElementById('pmgcPayBtn')?.addEventListener('click', () => {
    payForPMGC(() => {
      closeProModal();
      onPMGCUnlock?.();
    });
  });

  // ── Restore access (email lookup) ────────────────────
  document.getElementById('restoreBtn')?.addEventListener('click', async () => {
    const email = document.getElementById('restoreEmail')?.value.trim();
    const btn   = document.getElementById('restoreBtn');
    const msg   = document.getElementById('restoreMsg');

    if (!email || !email.includes('@')) {
      if (msg) { msg.textContent = '⚠️ Enter a valid email.'; msg.className = 'restore-msg warn'; }
      return;
    }

    if (btn) { btn.textContent = '⏳ Checking…'; btn.disabled = true; }
    if (msg) msg.textContent = '';

    try {
      const data = await UnlockManager.restoreFromServer(email);

      if (!data || (!data.isPro && !data.isPMGC)) {
        if (msg) { msg.textContent = '❌ No purchase found for this email.'; msg.className = 'restore-msg error'; }
      } else {
        if (msg) { msg.textContent = '✅ Unlocks restored!'; msg.className = 'restore-msg success'; }
        closeProModal();
        if (data.isPMGC) onPMGCUnlock?.();
        else if (data.isPro) onProUnlock?.('paid');
        showToast('✅ Access restored on this device!', 'success', 4000);
      }
    } catch {
      if (msg) { msg.textContent = '❌ Server error. Try again.'; msg.className = 'restore-msg error'; }
    } finally {
      if (btn) { btn.textContent = 'Restore'; btn.disabled = false; }
    }
  });

  // Keyboard on upgrade bar
  document.getElementById('proUnlockBar')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openProModal(); }
  });
}

export function refreshModalState(isPro, isPMGC) {
  const payProBtn  = document.getElementById('payProBtn');
  const pmgcPayBtn = document.getElementById('pmgcPayBtn');

  if (isPro && payProBtn) {
    payProBtn.textContent = '✅ Pro Unlocked';
    payProBtn.disabled    = true;
  }
  if (isPMGC && pmgcPayBtn) {
    pmgcPayBtn.textContent = '✅ PMGC Elite Active';
    pmgcPayBtn.disabled    = true;
  }
}
