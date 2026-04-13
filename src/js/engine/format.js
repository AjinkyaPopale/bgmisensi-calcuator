/**
 * Format sensitivity result into human-readable text block.
 */

import { APP }       from '../config.js';
import { LABELS }    from './scales.js';
import { SCOPE_KEYS } from './bases.js';

const SEP = '═'.repeat(50);
const DIV = '─'.repeat(50);
const pad = (x) => String(x).padStart(3, ' ');

const SCOPE_LABELS = {
  tpp: '▸ TPP NO SCOPE',
  fpp: '▸ FPP NO SCOPE',
  red: '▸ RED DOT / HOLO',
  x2:  '▸ 2x SCOPE',
  x3:  '▸ 3x SCOPE',
  x4:  '▸ 4x SCOPE',
  x6:  '▸ 6x SCOPE  ✅',
  x8:  '▸ 8x / 15x  ✅',
};

export function formatOutput(ctx, sens) {
  const { deviceName, fps, devcat, haccel, playstyle, finger,
          hsBoost, gyroOn, compMode, isPro, isPMGC,
          fineTune, usePMGCMode } = ctx;

  const activePMGC = (usePMGCMode || compMode === 'pmgc_elite') && isPMGC;

  let title;
  if (activePMGC)     title = 'AJINKYA2OP PMGC ELITE ENGINE v6 🔥👑';
  else if (isPro)     title = 'AJINKYA2OP PRO COMPETITIVE ENGINE v5 🔥';
  else                title = 'AJINKYA2OP STANDARD ENGINE v4';

  const hsLine   = !hsBoost ? 'OFF' : (isPro || isPMGC) ? 'ACTIVE — PRO+ 🎯' : 'ACTIVE 🎯';
  const compLine = (isPro || activePMGC) ? `\n  Engine    : ${LABELS.comp[compMode] ?? 'Balanced'}` : '';
  const ftLine   = (isPro || isPMGC)
    ? `\n  Fine-Tune : Gyro ×${fineTune.gyroAdjust.toFixed(2)}  ADS ×${fineTune.adsAdjust.toFixed(2)}`
    : '';
  const advLine  = (isPro || isPMGC) ? '\n  Adv Tuning: ✅ Device + FPS + Playstyle + Finger' : '';
  const pmgcLine = activePMGC ? '\n  ★ PMGC ELITE BASE — Tournament Level 🏆' : '';

  const row = (v) => gyroOn
    ? `  Camera: ${pad(v.cam)}   ADS: ${pad(v.ads)}   Gyro: ${pad(v.gyro)}   ADS Gyro: ${pad(v.ga)}`
    : `  Camera: ${pad(v.cam)}   ADS: ${pad(v.ads)}   Gyro: ---   ADS Gyro: ---`;

  const lines = [];
  for (const key of SCOPE_KEYS) {
    lines.push(SCOPE_LABELS[key], row(sens[key]), DIV, '');
  }
  lines.splice(-2); // trim trailing divider

  return [
    SEP,
    `  ${title}`,
    SEP,
    `  Device    : ${deviceName}`,
    `  Category  : ${LABELS.device[devcat] ?? devcat}`,
    `  FPS       : ${fps}`,
    `  Gyro      : ${gyroOn ? 'ON' : 'OFF'}`,
    `  H. Accel  : ${LABELS.haccel[haccel] ?? haccel}`,
    `  Style     : ${LABELS.playstyle[playstyle] ?? playstyle}`,
    `  Fingers   : ${LABELS.finger[finger] ?? finger}`,
    `  HS Magnet : ${hsLine}${compLine}${ftLine}${advLine}${pmgcLine}`,
    SEP, '',
    ...lines,
    SEP,
    `          By ${APP.name} 🔥`,
    `    Base: ${APP.base}`,
    activePMGC
      ? '    PMGC Elite — Tournament Verified 👑'
      : '    6x & 8x — Training Ground Verified ✅',
    SEP,
  ].join('\n');
}
