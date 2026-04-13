/**
 * BGMI Sensitivity Calculator v6 — Main Entry Point
 * Boots app, restores tier state, wires all modules.
 *
 * ADDITIONS (non-breaking):
 *   · import share.js → initShareButtons()
 *   · import voice.js → initVoiceButton(), stopSpeech()
 *   · import result.js → revealPostGenerateSections()
 *   · nudge buttons wired to openProModal
 */
import { buildSensitivity, buildPMGCPreview } from './engine/build.js';
import { formatOutput }                        from './engine/format.js';
import { initForm, getFineTune, getPMGCModeActive, readFormValues } from './ui/form.js';
import {
  renderResult, renderPMGCPreview, hidePMGCPreview,
  initCopyButton, initPMGCCopyButton, revealPostGenerateSections,
} from './ui/result.js';
import { initModal, openProModal, closeProModal, refreshModalState } from './ui/modal.js';
import { showToast }          from './ui/toast.js';
import { initShareButtons }   from './ui/share.js';   // NEW
import { initVoiceButton, stopSpeech } from './ui/voice.js'; // NEW
import { UnlockManager }      from './payment/unlock.js';

// ── App state ─────────────────────────────────────────────
const state = {
  isPro:      false,
  isPMGC:     false,
  proType:    null,
  pmgcMode:   false,
  lastParams: null,
};

const $ = (id) => document.getElementById(id);

// ── Apply Pro UI ──────────────────────────────────────────
function applyProUI(type) {
  state.isPro   = true;
  state.proType = type;

  $('compGroup')?.classList.add('unlocked');
  $('compMode')?.removeAttribute('disabled');

  if (type === 'paid') $('pmSliders')?.classList.add('active');

  const vc = $('versionChip');
  if (vc) { vc.textContent = type === 'paid' ? 'v5 PRO 👑' : 'v5 DEMO'; vc.className = 'chip chip-pro'; }

  if (type === 'paid') $('proUnlockBar')?.setAttribute('hidden', '');

  refreshModalState(state.isPro, state.isPMGC);
}

// ── Apply PMGC UI ─────────────────────────────────────────
function applyPMGCUI() {
  state.isPMGC = true;

  const pmgcOpt = $('pmgcOption');
  if (pmgcOpt) { pmgcOpt.disabled = false; pmgcOpt.textContent = 'PMGC Elite (Unlocked 👑)'; }

  const modeLabel = $('modeLockedLabel');
  if (modeLabel) { modeLabel.textContent = '🔥 PMGC Elite Mode'; modeLabel.classList.remove('mode-locked'); }

  const modeLock = $('modeToggleLock');
  if (modeLock) modeLock.hidden = true;

  const vc = $('versionChip');
  if (vc) { vc.textContent = 'v6 PMGC 🔥'; vc.className = 'chip chip-pmgc'; }

  $('proUnlockBar')?.setAttribute('hidden', '');

  refreshModalState(state.isPro, state.isPMGC);
}

// ── Core generate ─────────────────────────────────────────
function generate(formValues) {
  const fineTune    = getFineTune();
  const usePMGCMode = state.pmgcMode;

  const params = {
    ...formValues,
    isPro:       state.isPro,
    isPMGC:      state.isPMGC,
    fineTune,
    usePMGCMode: usePMGCMode && state.isPMGC,
  };

  state.lastParams = params;

  // Stop any playing voice guide so it doesn't confuse context
  stopSpeech(); // NEW

  if (!usePMGCMode || !state.isPMGC) {
    const sens = buildSensitivity(params);
    const text = formatOutput(params, sens);
    renderResult(text, params, state.proType === 'demo');
  } else {
    const sens = buildSensitivity(params);
    const text = formatOutput(params, sens);
    renderResult(text, params, false);
  }

  generatePMGCPreview(formValues, fineTune);

  // NEW — reveal share row, voice section, tips, upgrade nudge
  revealPostGenerateSections(state.isPro, state.isPMGC);
}

function generatePMGCPreview(formValues, fineTune) {
  if (state.pmgcMode && state.isPMGC) { hidePMGCPreview(); return; }

  const previewParams = { ...formValues, fineTune, isPro: state.isPro, isPMGC: true };
  const pmgcSens = buildPMGCPreview(previewParams);
  const pmgcText = formatOutput({ ...previewParams, usePMGCMode: true, compMode: 'pmgc_elite' }, pmgcSens);

  renderPMGCPreview(pmgcText, state.isPMGC, () => openProModal());
}

// ── Mode toggle callback ──────────────────────────────────
function onModeChange(isPMGCModeOn) {
  state.pmgcMode = isPMGCModeOn;
  updateModeUI(isPMGCModeOn);

  if (isPMGCModeOn && !state.isPMGC) {
    openProModal();
    const toggle = $('modeToggle');
    if (toggle) toggle.checked = false;
    $('modeNormalLabel')?.classList.add('active-normal');
    $('modePMGCLabel')?.classList.remove('active-pmgc');
    state.pmgcMode = false;
    return;
  }

  if (!$('rc')?.hidden) {
    const fresh = readFormValues();
    if (fresh) generate(fresh);
  }
}

function updateModeUI(isPMGCMode) {
  $('pmgcModeBanner')?.classList.toggle('active', isPMGCMode);
  $('normalResultSection')?.classList.toggle('pmgc-active', isPMGCMode);
}

// ── Unlock callbacks ──────────────────────────────────────
function onProUnlock(type) {
  applyProUI(type);
  const fresh = readFormValues();
  if (fresh) generate(fresh);
  else if (state.lastParams) generate(state.lastParams);
  showToast('🎉 Pro unlocked! Advanced tuning active.', 'success', 3500);
}

function onPMGCUnlock() {
  applyPMGCUI();
  const fresh = readFormValues();
  if (fresh) generate(fresh);
  else if (state.lastParams) generate(state.lastParams);
  showToast('👑 PMGC Elite unlocked! Tournament engine active.', 'success', 4000);
}

// ── Header / bar upgrade buttons ─────────────────────────
function initUpgradeButtons() {
  $('proHeaderBtn')?.addEventListener('click', openProModal);
  $('proUnlockBar')?.addEventListener('click', openProModal);
}

// ── NEW: Wire nudge upgrade buttons ──────────────────────
function initNudgeButtons() {
  $('nudgeProBtn')?.addEventListener('click',  openProModal);
  $('nudgePMGCBtn')?.addEventListener('click', openProModal);
}

// ── Scroll progress ───────────────────────────────────────
function initScrollProgress() {
  const bar = document.createElement('div');
  bar.id    = 'scrollBar';
  Object.assign(bar.style, {
    position: 'fixed', top: '0', left: '0', height: '2px',
    background: 'var(--neon)', zIndex: '200', width: '0%',
    transition: 'width .1s linear', pointerEvents: 'none',
  });
  document.body.prepend(bar);
  window.addEventListener('scroll', () => {
    const h = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    bar.style.width = h > 0 ? `${(window.scrollY / h) * 100}%` : '0%';
  }, { passive: true });
}

// ── Restore persisted state ───────────────────────────────
function restoreState() {
  const proStatus  = UnlockManager.getProStatus();
  const pmgcStatus = UnlockManager.getPMGCStatus();
  // Only restore if actually PAID — demo tokens no longer issued
  if (proStatus === 'paid')  applyProUI('paid');
  if (pmgcStatus === 'paid') applyPMGCUI();
}

// ── Boot ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  restoreState();
  initForm(generate, onModeChange);
  initCopyButton();
  initPMGCCopyButton();
  initModal(onProUnlock, onPMGCUnlock);
  initUpgradeButtons();
  initScrollProgress();
  initShareButtons();  // NEW
  initVoiceButton();   // NEW
  initNudgeButtons();  // NEW

  if (UnlockManager.getProStatus() === 'paid') {
    showToast('👑 Welcome back, Pro!', 'success', 2200);
  } else if (UnlockManager.isPMGC()) {
    showToast('🔥 PMGC Elite active!', 'success', 2200);
  }
});
