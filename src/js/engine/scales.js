/**
 * SENSITIVITY SCALING TABLES
 *
 * L2–L9 : Core engine (ORIGINAL — do not modify)
 * L12   : Advanced tuning (Pro / PMGC only — new layer)
 */

// ── L2 — FPS Scale ────────────────────────────────────────
export const FPS_SCALE = Object.freeze({
  120: { cam: 1.10, ads: 1.07, gyro: 0.93, ga: 0.93 },
   90: { cam: 1.00, ads: 1.00, gyro: 1.00, ga: 1.00 },
   60: { cam: 0.90, ads: 0.93, gyro: 1.08, ga: 1.08 },
});

// ── L3 — Device Category Scale ────────────────────────────
export const DEVICE_SCALE = Object.freeze({
  android_mid:  { cam: 1.00, ads: 1.00, gyro: 1.02, ga: 1.02 },
  android_flag: { cam: 1.02, ads: 1.01, gyro: 1.00, ga: 1.00 },
  iphone:       { cam: 0.98, ads: 0.99, gyro: 0.97, ga: 0.97 },
  ipad:         { cam: 1.08, ads: 1.05, gyro: 0.92, ga: 0.92 },
});

// ── L4 — Horizontal Acceleration ──────────────────────────
export const H_ACCEL = Object.freeze({
  off: { cam: 1.00, ads: 1.00, gyro: 1.00, ga: 1.00 },
  on:  { cam: 0.95, ads: 0.97, gyro: 1.02, ga: 1.02 },
});

// ── L5 — Playstyle Trim ───────────────────────────────────
export const PLAYSTYLE_TRIM = Object.freeze({
  balanced: { cam: 1.00, ads: 1.00, gyro: 1.00, ga: 1.00 },
  close:    { cam: 1.07, ads: 1.09, gyro: 1.06, ga: 1.06 },
  spray:    { cam: 1.05, ads: 1.04, gyro: 1.04, ga: 1.04 },
  sniper:   { cam: 0.88, ads: 0.90, gyro: 0.95, ga: 0.95 },
});

// ── L6 — Finger Scale ─────────────────────────────────────
export const FINGER_SCALE = Object.freeze({
  two:   { cam: 0.95, ads: 0.94, gyro: 0.96, ga: 0.96 },
  three: { cam: 1.00, ads: 1.00, gyro: 1.00, ga: 1.00 },
  four:  { cam: 1.03, ads: 1.05, gyro: 1.06, ga: 1.06 },
  five:  { cam: 1.05, ads: 1.07, gyro: 1.08, ga: 1.08 },
});

// ── L7 — Scope Extras ─────────────────────────────────────
export const SCOPE_EXTRAS = Object.freeze({
  close:    { red: { gyro: 1.05, ga: 1.05 }, x2: { gyro: 1.04, ga: 1.04 } },
  sniper:   { x6:  { gyro: 1.10, ga: 1.10 }, x8: { gyro: 1.14, ga: 1.14 } },
  spray:    {},
  balanced: {},
});

// ── L8 — Headshot Base ────────────────────────────────────
export const HEADSHOT_BASE = Object.freeze({
  red: { gyro: 1.03, ga: 1.03 },
  x2:  { gyro: 1.02, ga: 1.02 },
  tpp: { ads: 1.02 },
  x4:  { cam: 0.98 },
});

// ── L8+ — Headshot PRO+ (Pro tier only) ───────────────────
export const HEADSHOT_PRO_PLUS = Object.freeze({
  red: { gyro: 1.02, ga: 1.02 },
  x2:  { gyro: 1.02, ga: 1.02 },
  x4:  { cam: 0.98, ads: 0.99 },
});

// ── L9 — Competitive Engine Presets ───────────────────────
export const COMP_ENGINE = Object.freeze({
  balanced:      { cam: 1.00, ads: 1.00, gyro: 1.00, ga: 1.00 },
  competitive:   { cam: 1.03, ads: 1.04, gyro: 1.05, ga: 1.05 },
  close_beast:   { cam: 1.06, ads: 1.07, gyro: 1.08, ga: 1.08 },
  zero_recoil:   { cam: 0.98, ads: 0.92, gyro: 1.06, ga: 1.06 },
  low_precision: { cam: 0.94, ads: 0.96, gyro: 0.97, ga: 0.97 },
  tournament:    { cam: 0.99, ads: 0.97, gyro: 1.02, ga: 1.02 },
  pmgc_elite:    { cam: 1.05, ads: 1.04, gyro: 1.06, ga: 1.06 },
});

// ═══════════════════════════════════════════════
//  L12 — ADVANCED DEVICE OPTIMIZATION (Pro/PMGC)
// ═══════════════════════════════════════════════

/**
 * Maps device category → performance tier for L12.
 * High-end → faster micro-adjustments.
 * Mid-range → balanced stability.
 * Low-end   → smoother recoil compensation.
 */
export const DEVICE_PERF_MAP = Object.freeze({
  android_flag: 'high',
  iphone:       'high',
  ipad:         'high',
  android_mid:  'mid',
  // future: android_low → 'low'
});

export const ADV_DEVICE = Object.freeze({
  high: { cam: 1.020, ads: 1.025, gyro: 1.010, ga: 1.010 },  // Faster micro-adj
  mid:  { cam: 1.000, ads: 1.000, gyro: 1.000, ga: 1.000 },  // Balanced
  low:  { cam: 0.975, ads: 0.978, gyro: 1.030, ga: 1.030 },  // Smoother recoil
});

/** FPS-aware advanced tuning */
export const ADV_FPS = Object.freeze({
  120: { cam: 1.030, ads: 1.025, gyro: 0.975, ga: 0.975 }, // Faster response
   90: { cam: 1.000, ads: 1.000, gyro: 1.000, ga: 1.000 },
   60: { cam: 0.975, ads: 0.980, gyro: 1.030, ga: 1.030 }, // Stability boost
});

/** Advanced playstyle (more granular than L5 trim) */
export const ADV_PLAYSTYLE = Object.freeze({
  close:    { cam: 1.030, ads: 1.050, gyro: 1.030, ga: 1.030 }, // Fast ADS snap
  spray:    { cam: 1.020, ads: 1.020, gyro: 1.020, ga: 1.020 }, // Even spray
  balanced: { cam: 1.000, ads: 1.000, gyro: 1.000, ga: 1.000 },
  sniper:   { cam: 0.970, ads: 0.975, gyro: 0.985, ga: 0.985 }, // Low jitter
});

/** Advanced finger tuning */
export const ADV_FINGER = Object.freeze({
  two:   { cam: 0.985, ads: 0.980, gyro: 1.010, ga: 1.010 }, // Simpler recoil
  three: { cam: 1.000, ads: 1.000, gyro: 1.000, ga: 1.000 },
  four:  { cam: 1.010, ads: 1.015, gyro: 1.010, ga: 1.010 }, // Advanced control
  five:  { cam: 1.020, ads: 1.025, gyro: 1.015, ga: 1.015 },
});

// ── Human-readable labels ──────────────────────────────────
export const LABELS = Object.freeze({
  device:    { android_mid: 'Android Mid-Range', android_flag: 'Android Flagship', iphone: 'iPhone', ipad: 'iPad' },
  playstyle: { balanced: 'Balanced', close: 'Close Range', spray: 'Spray', sniper: 'Sniper' },
  finger:    { two: '2 Finger', three: '3 Finger', four: '4 Finger', five: '5 Finger' },
  haccel:    { off: 'OFF', on: 'ON' },
  comp:      {
    balanced:      'Balanced',
    competitive:   'Competitive',
    close_beast:   'Close Beast',
    zero_recoil:   'Zero Recoil',
    low_precision: 'Low Sensitivity',
    tournament:    'Tournament Stability',
    pmgc_elite:    'PMGC Elite 4.3',
  },
});
