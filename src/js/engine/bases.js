/**
 * LAYER 1 — SENSITIVITY BASE MODELS
 * ─────────────────────────────────────────────────────────────────
 *
 * GOLDEN_BASE: Standard engine. iQOO Neo 7 Pro · 90FPS · 7yr tuned.
 * 6x & 8x verified in Training Ground ✅
 *
 * PMGC_ELITE_BASE: Completely separate tournament-level model.
 * DO NOT mix or share values with GOLDEN_BASE.
 * Characteristics:
 *   · More stable recoil    → higher gyro on close scopes for snap control
 *   · Better headshot aim   → Red Dot + 2x gyro micro-tuned for head level
 *   · Smoother spray        → TPP/FPP cam slightly elevated for tracking
 *   · Precision long range  → 6x/8x refined for low-jitter aiming
 */

// ── Standard Engine ───────────────────────────────────────
export const GOLDEN_BASE = Object.freeze({
  tpp: { cam: 102, ads: 94, gyro: 320, ga: 320 },
  fpp: { cam: 90,  ads: 82, gyro: 310, ga: 310 },
  red: { cam: 39,  ads: 1,  gyro: 315, ga: 315 },
  x2:  { cam: 24,  ads: 17, gyro: 295, ga: 295 },
  x3:  { cam: 17,  ads: 13, gyro: 245, ga: 245 },
  x4:  { cam: 13,  ads: 9,  gyro: 205, ga: 205 },
  x6:  { cam: 9,   ads: 7,  gyro: 118, ga: 118 },  // ✅ Training Ground Verified
  x8:  { cam: 8,   ads: 8,  gyro: 80,  ga: 84  },  // ✅ Training Ground Verified
});

// ── PMGC Elite Engine (Tournament Level) ─────────────────
// Separate base — passes through same scaling pipeline (device, FPS, playstyle).
// Values purposefully distinct from GOLDEN_BASE; optimised for competitive lobbies.
export const PMGC_ELITE_BASE = Object.freeze({
  tpp: { cam: 93,  ads: 89, gyro: 380, ga: 395 },  // Elevated cam for tracking
  fpp: { cam: 87,  ads: 48, gyro: 272, ga: 258 },  // Smoother FPP movement
  red: { cam: 32,  ads: 1,  gyro: 332, ga: 332 },  // HS-optimised Red Dot
  x2:  { cam: 24,  ads: 1,  gyro: 285, ga: 275 },  // Tracking gyro boost
  x3:  { cam: 12,  ads: 1,  gyro: 129, ga: 135 },  // Stable mid-range
  x4:  { cam: 8,   ads: 1,  gyro: 113, ga: 121 },  // Tight 4x recoil
  x6:  { cam: 1,   ads: 1,  gyro: 74,  ga: 88 },  // Low-jitter 6x
  x8:  { cam: 12,  ads: 8,  gyro: 88,  ga: 96  },  // Precision 8x
});

export const SCOPE_KEYS = Object.freeze(['tpp','fpp','red','x2','x3','x4','x6','x8']);
