/**
 * Form Controller
 * Reads all inputs, validates, wires interactive elements.
 */

import { APP } from '../config.js';

// ── Debounce ──────────────────────────────────────────────
function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

export function getPlaystyle() {
  return document.querySelector('.ps-opt.sel input')?.value ?? 'balanced';
}

/** Returns form values object or null if invalid */
export function readFormValues() {
  const devInput = document.getElementById('dev');
  const derr     = document.getElementById('derr');
  const device   = devInput?.value.trim() ?? '';

  if (!device) {
    devInput?.classList.add('err');
    derr?.classList.add('show');
    devInput?.focus();
    return null;
  }
  devInput?.classList.remove('err');
  derr?.classList.remove('show');

  return {
    deviceName: device,
    fps:       parseInt(document.getElementById('fps')?.value ?? '90', 10),
    devcat:    document.getElementById('devcat')?.value  ?? 'android_flag',
    haccel:    document.getElementById('haccel')?.value  ?? 'off',
    playstyle: getPlaystyle(),
    finger:    document.getElementById('finger')?.value  ?? 'three',
    gyroOn:    document.getElementById('gyro')?.checked  ?? true,
    hsBoost:   document.getElementById('hsboost')?.checked ?? false,
    compMode:  document.getElementById('compMode')?.value ?? 'balanced',
  };
}

export function getFineTune() {
  const g = parseFloat(document.getElementById('slGyro')?.value ?? '0');
  const a = parseFloat(document.getElementById('slADS')?.value  ?? '0');
  return { gyroAdjust: 1 + g / 100, adsAdjust: 1 + a / 100 };
}

/** Returns current PMGC mode toggle state */
export function getPMGCModeActive() {
  return document.getElementById('modeToggle')?.checked ?? false;
}

/**
 * Wire all form interactions.
 * @param {function} onSubmit  (formValues) => void
 * @param {function} onModeChange  (isPMGCMode: boolean) => void
 */
export function initForm(onSubmit, onModeChange) {
  const form     = document.getElementById('f');
  const devInput = document.getElementById('dev');
  const gyroInp  = document.getElementById('gyro');
  const hsInp    = document.getElementById('hsboost');
  const psOpts   = document.querySelectorAll('.ps-opt');
  const regBtn   = document.getElementById('regbtn');
  const modeToggle = document.getElementById('modeToggle');

  // ── Gyro label ────────────────────────────────────────
  gyroInp?.addEventListener('change', () => {
    const gl = document.getElementById('gl');
    if (!gl) return;
    if (gyroInp.checked) { gl.textContent = 'ON';  gl.classList.add('on'); }
    else                 { gl.textContent = 'OFF'; gl.classList.remove('on'); }
  });

  // ── HS Magnet label ───────────────────────────────────
  hsInp?.addEventListener('change', () => {
    const hsl = document.getElementById('hsl');
    if (!hsl) return;
    if (hsInp.checked) { hsl.textContent = 'ON';  hsl.classList.add('on','hs-on'); }
    else               { hsl.textContent = 'OFF'; hsl.classList.remove('on','hs-on'); }
  });

  // ── Playstyle grid ────────────────────────────────────
  psOpts.forEach((opt) => {
    opt.addEventListener('click', () => {
      psOpts.forEach((x) => x.classList.remove('sel'));
      opt.classList.add('sel');
    });
    opt.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); opt.click(); }
    });
  });

  // ── Clear error on device input ───────────────────────
  devInput?.addEventListener('input', () => {
    if (devInput.value.trim()) {
      devInput.classList.remove('err');
      document.getElementById('derr')?.classList.remove('show');
    }
  });

  // ── Fine-tune sliders (debounced) ─────────────────────
  const updateSlider = debounce(() => {}, APP.debounce); // placeholder pattern
  document.getElementById('slGyro')?.addEventListener('input', function () {
    document.getElementById('slGyroVal').textContent = (this.value > 0 ? '+' : '') + this.value + '%';
  });
  document.getElementById('slADS')?.addEventListener('input', function () {
    document.getElementById('slADSVal').textContent = (this.value > 0 ? '+' : '') + this.value + '%';
  });

  // ── PMGC mode toggle ──────────────────────────────────
  modeToggle?.addEventListener('change', () => {
    onModeChange?.(modeToggle.checked);
  });

  // ── Submit ────────────────────────────────────────────
  const handleSubmit = (e) => {
    e?.preventDefault();
    if (navigator.vibrate) navigator.vibrate(40);
    const values = readFormValues();
    if (values) onSubmit(values);
  };

  form?.addEventListener('submit', handleSubmit);
  regBtn?.addEventListener('click', () => {
    const v = readFormValues();
    if (v) onSubmit(v);
  });
}
