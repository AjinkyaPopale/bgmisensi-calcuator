/**
 * Result Renderer
 * Handles normal output, PMGC blur-preview, and post-generate sections.
 *
 * ADDITIONS (non-breaking):
 *   revealPostGenerateSections(isPro, isPMGC)
 *     → shows share row, voice section, tips card, upgrade nudge
 */

import { showToast } from './toast.js';

const PLAYSTYLE_LABELS = {
  close: 'CLOSE RANGE', spray: 'SPRAY', balanced: 'BALANCED', sniper: 'SNIPER',
};

// ──────────────────────────────────────────────────────────
//  ORIGINAL — unchanged
// ──────────────────────────────────────────────────────────

export function renderResult(text, ctx, isDemo = false) {
  const ph = document.getElementById('ph');
  const rc = document.getElementById('rc');
  const ot = document.getElementById('ot');
  if (!ot) return;

  ot.textContent = isDemo
    ? text + '\n\n  ⚠️  PREVIEW — Purchase Pro to unlock full precision.'
    : text;

  const rbadge = document.getElementById('rbadge');
  const rhs    = document.getElementById('rhs');
  const rpro   = document.getElementById('rpro');
  const rdemo  = document.getElementById('rdemo');

  if (rbadge) rbadge.textContent = PLAYSTYLE_LABELS[ctx.playstyle] ?? 'CUSTOM';
  if (rhs)    rhs.hidden = !ctx.hsBoost;
  if (rhs && ctx.hsBoost) rhs.textContent = (ctx.isPro || ctx.isPMGC) && !isDemo ? '🎯 MAGNET PRO+' : '🎯 MAGNET';
  if (rpro)   rpro.hidden = !(ctx.isPro && !isDemo);
  if (rdemo)  rdemo.hidden = !isDemo;

  if (ph) ph.hidden = true;
  if (rc) {
    rc.hidden          = false;
    rc.style.animation = 'none';
    void rc.offsetWidth;
    rc.style.animation = '';
  }

  if (window.innerWidth < 900) rc?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function renderPMGCPreview(pmgcText, isUnlocked, onUnlock) {
  const section    = document.getElementById('pmgcPreviewSection');
  const preContent = document.getElementById('pmgcPreviewContent');
  const overlay    = document.getElementById('pmgcLockOverlay');
  const copyRow    = document.getElementById('pmgcCopyRow');
  const unlockCTA  = document.getElementById('pmgcUnlockCTA');
  if (!section) return;

  section.hidden = false;
  if (preContent) preContent.textContent = pmgcText;

  if (isUnlocked) {
    preContent?.classList.remove('pmgc-blurred');
    if (overlay) overlay.hidden = true;
    if (copyRow) copyRow.hidden = false;
  } else {
    preContent?.classList.add('pmgc-blurred');
    if (overlay) overlay.hidden = false;
    if (copyRow) copyRow.hidden = true;
    if (unlockCTA && !unlockCTA.dataset.wired) {
      unlockCTA.dataset.wired = '1';
      unlockCTA.addEventListener('click', onUnlock);
    }
  }
}

export function hidePMGCPreview() {
  const s = document.getElementById('pmgcPreviewSection');
  if (s) s.hidden = true;
}

export function initCopyButton() {
  const cpybtn = document.getElementById('cpybtn');
  const ot     = document.getElementById('ot');
  if (!cpybtn || !ot) return;

  cpybtn.addEventListener('click', async () => {
    const text = ot.textContent;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = Object.assign(document.createElement('textarea'), {
        value: text, style: 'position:fixed;top:0;left:0;opacity:0;pointer-events:none',
      });
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    cpybtn.textContent = '✅ Copied!';
    showToast('✅ Sensitivity copied!', 'success');
    setTimeout(() => { cpybtn.textContent = '📋 Copy All'; }, 1600);
  });
}

export function initPMGCCopyButton() {
  const btn = document.getElementById('pmgcCopyBtn');
  const pre = document.getElementById('pmgcPreviewContent');
  if (!btn || !pre) return;

  btn.addEventListener('click', async () => {
    const text = pre.textContent;
    if (!text) return;
    try { await navigator.clipboard.writeText(text); } catch { /* silent */ }
    showToast('✅ PMGC sensitivity copied!', 'success');
    btn.textContent = '✅ Copied!';
    setTimeout(() => { btn.textContent = '📋 Copy PMGC'; }, 1600);
  });
}

// ──────────────────────────────────────────────────────────
//  NEW — post-generate extras (non-breaking addition)
// ──────────────────────────────────────────────────────────

/**
 * Reveal post-generate sections after every successful generate().
 * Called by main.js — sections are hidden in HTML by default.
 *
 * @param {boolean} isPro
 * @param {boolean} isPMGC
 */
export function revealPostGenerateSections(isPro, isPMGC) {
  // Share buttons row (inside result card)
  const shareActs = document.getElementById('shareActs');
  if (shareActs) shareActs.hidden = false;

  // Voice guide section
  const voiceSection = document.getElementById('voiceSection');
  if (voiceSection) voiceSection.hidden = false;

  // Tips card — always show, animate in
  const tipsCard = document.getElementById('tipsCard');
  if (tipsCard) {
    tipsCard.hidden = false;
    tipsCard.style.animation = 'none';
    void tipsCard.offsetWidth;
    tipsCard.style.animation = '';
  }

  // Upgrade nudge — only when at least one tier is missing
  const upgradeNudge = document.getElementById('upgradeNudge');
  if (upgradeNudge) {
    const allUnlocked = isPro && isPMGC;
    upgradeNudge.hidden = allUnlocked;

    // Hide the row for already-unlocked tiers
    const proRow  = document.getElementById('nudgeProRow');
    const pmgcRow = document.getElementById('nudgePMGCRow');
    if (proRow)  proRow.hidden  = isPro;
    if (pmgcRow) pmgcRow.hidden = isPMGC;
  }
}
