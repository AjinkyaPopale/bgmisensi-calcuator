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
  tpp: { cam: 60,  ads: 46, gyro: 330, ga: 345 },
  fpp: { cam: 56,  ads: 42, gyro: 315, ga: 330 },
  red: { cam: 18,  ads: 1,  gyro: 330, ga: 315 },
  x2:  { cam: 24,  ads: 26, gyro: 320, ga: 310 },
  x3:  { cam: 9,   ads: 11, gyro: 190, ga: 205 },
  x4:  { cam: 3,   ads: 6,  gyro: 135, ga: 165 },
  x6:  { cam: 1,   ads: 1,  gyro: 74,  ga: 88  },  // ✅ Training Ground Verified
  x8:  { cam: 8,   ads: 8,  gyro: 80,  ga: 84  },  // ✅ Training Ground Verified
});

// ── PMGC Elite Engine (Tournament Level) ─────────────────
// Separate base — passes through same scaling pipeline (device, FPS, playstyle).
// Values purposefully distinct from GOLDEN_BASE; optimised for competitive lobbies.
export const PMGC_ELITE_BASE = Object.freeze({
  tpp: { cam: 60,  ads: 50, gyro: 290, ga: 295 },  // Elevated cam for tracking
  fpp: { cam: 60,  ads: 50, gyro: 290, ga: 295 },  // Smoother FPP movement
  red: { cam: 32,  ads: 1,  gyro: 320, ga: 310 },  // HS-optimised Red Dot
  x2:  { cam: 24,  ads: 1,  gyro: 285, ga: 275 },  // Tracking gyro boost
  x3:  { cam: 18,  ads: 7,  gyro: 190, ga: 185 },  // Stable mid-range
  x4:  { cam: 12,  ads: 10, gyro: 210, ga: 205 },  // Tight 4x recoil
  x6:  { cam: 1,   ads: 1,  gyro: 74,  ga: 88 },  // Low-jitter 6x
  x8:  { cam: 10,  ads: 10, gyro: 115, ga: 110  },  // Precision 8x
});

export const SCOPE_KEYS = Object.freeze(['tpp','fpp','red','x2','x3','x4','x6','x8']);
