/**
 * SENSITIVITY BUILD ENGINE
 *
 * L1  → Base model (GOLDEN or PMGC_ELITE)
 * L2  → FPS scale
 * L3  → Device scale
 * L4  → H. Acceleration
 * L5  → Playstyle trim
 * L6  → Finger scale
 * L7  → Scope extras
 * L8  → Headshot base
 * L8+ → Headshot PRO+ (Pro only)
 * L9  → Competitive engine preset
 * L10 → Fine-tune sliders (Pro only)
 * L11 → Gyro kill switch
 * L12 → Advanced device optimisation (Pro / PMGC only) ← NEW
 *
 * RULE: L1–L11 logic is NEVER changed. L12 is additive only.
 */

import { GOLDEN_BASE, PMGC_ELITE_BASE, SCOPE_KEYS } from './bases.js';
import {
  FPS_SCALE, DEVICE_SCALE, H_ACCEL,
  PLAYSTYLE_TRIM, FINGER_SCALE, SCOPE_EXTRAS,
  HEADSHOT_BASE, HEADSHOT_PRO_PLUS, COMP_ENGINE,
  DEVICE_PERF_MAP, ADV_DEVICE, ADV_FPS, ADV_PLAYSTYLE, ADV_FINGER,
} from './scales.js';

const clamp = (v) => Math.min(300, Math.max(0, Math.round(v)));

/**
 * @param {object} params  See property list above
 * @returns {{ tpp, fpp, red, x2, x3, x4, x6, x8 }}
 *   Each scope: { cam, ads, gyro, ga }  integers 0–300
 */
export function buildSensitivity(params) {
  const {
    fps, devcat, haccel, playstyle, finger,
    hsBoost, gyroOn, compMode,
    isPro, isPMGC,
    fineTune     = { gyroAdjust: 1.0, adsAdjust: 1.0 },
    usePMGCMode  = false,   // explicit mode toggle from UI
  } = params;

  // ── L1: Select base ───────────────────────────────────
  const activePMGC = (usePMGCMode || compMode === 'pmgc_elite') && isPMGC;
  const BASE       = activePMGC ? PMGC_ELITE_BASE : GOLDEN_BASE;

  // ── L9: Resolve preset ────────────────────────────────
  let resolvedComp = 'balanced';
  if (activePMGC)                              resolvedComp = 'pmgc_elite';
  else if (isPro && COMP_ENGINE[compMode])     resolvedComp = compMode;

  // ── Lookup tables ─────────────────────────────────────
  const ff  = FPS_SCALE[fps]             ?? FPS_SCALE[90];
  const df  = DEVICE_SCALE[devcat]       ?? DEVICE_SCALE.android_flag;
  const hf  = H_ACCEL[haccel]            ?? H_ACCEL.off;
  const pf  = PLAYSTYLE_TRIM[playstyle]  ?? PLAYSTYLE_TRIM.balanced;
  const fi  = FINGER_SCALE[finger]       ?? FINGER_SCALE.three;
  const se  = SCOPE_EXTRAS[playstyle]    ?? {};
  const cf  = COMP_ENGINE[resolvedComp]  ?? COMP_ENGINE.balanced;

  // ── L12 advanced lookup (Pro / PMGC only) ─────────────
  const perfTier = DEVICE_PERF_MAP[devcat] ?? 'mid';
  const adv_d    = (isPro || isPMGC) ? (ADV_DEVICE[perfTier]    ?? ADV_DEVICE.mid)       : null;
  const adv_f    = (isPro || isPMGC) ? (ADV_FPS[fps]            ?? ADV_FPS[90])           : null;
  const adv_p    = (isPro || isPMGC) ? (ADV_PLAYSTYLE[playstyle]?? ADV_PLAYSTYLE.balanced): null;
  const adv_fi   = (isPro || isPMGC) ? (ADV_FINGER[finger]      ?? ADV_FINGER.three)      : null;

  // ── Build per scope ───────────────────────────────────
  const result = {};

  for (const key of SCOPE_KEYS) {
    const b  = BASE[key];
    const ex = se[key]                                     ?? {};
    const hb = (hsBoost && HEADSHOT_BASE[key])             ? HEADSHOT_BASE[key]      : {};
    const hp = (hsBoost && isPro && HEADSHOT_PRO_PLUS[key])? HEADSHOT_PRO_PLUS[key]  : {};

    // L1 → L9 (unchanged core chain)
    let cam  = b.cam  * ff.cam  * df.cam  * hf.cam  * pf.cam  * fi.cam  * (hb.cam  ?? 1) * (hp.cam  ?? 1) * cf.cam;
    let ads  = b.ads  * ff.ads  * df.ads  * hf.ads  * pf.ads  * fi.ads  * (hb.ads  ?? 1) * (hp.ads  ?? 1) * cf.ads;
    let gyro = b.gyro * ff.gyro * df.gyro * hf.gyro * pf.gyro * fi.gyro * (ex.gyro ?? 1) * (hb.gyro ?? 1) * (hp.gyro ?? 1) * cf.gyro;
    let ga   = b.ga   * ff.ga   * df.ga   * hf.ga   * pf.ga   * fi.ga   * (ex.ga   ?? 1) * (hb.ga   ?? 1) * (hp.ga   ?? 1) * cf.ga;

    // L10 — Pro fine-tune sliders
    if (isPro || isPMGC) {
      gyro *= fineTune.gyroAdjust;
      ga   *= fineTune.gyroAdjust;
      ads  *= fineTune.adsAdjust;
    }

    // L12 — Advanced device optimisation (additive, Pro/PMGC only)
    if (adv_d && adv_f && adv_p && adv_fi) {
      cam  *= adv_d.cam  * adv_f.cam  * adv_p.cam  * adv_fi.cam;
      ads  *= adv_d.ads  * adv_f.ads  * adv_p.ads  * adv_fi.ads;
      gyro *= adv_d.gyro * adv_f.gyro * adv_p.gyro * adv_fi.gyro;
      ga   *= adv_d.ga   * adv_f.ga   * adv_p.ga   * adv_fi.ga;
    }

    // L11 — Gyro kill switch
    result[key] = {
      cam:  clamp(cam),
      ads:  clamp(ads),
      gyro: gyroOn ? clamp(gyro) : 0,
      ga:   gyroOn ? clamp(ga)   : 0,
    };
  }

  return result;
}

/**
 * Build PMGC output regardless of unlock state (for blur preview).
 * Always uses PMGC_ELITE_BASE + pmgc_elite preset.
 */
export function buildPMGCPreview(params) {
  return buildSensitivity({
    ...params,
    usePMGCMode: true,
    isPMGC: true,
    compMode: 'pmgc_elite',
  });
}
