/**
 * Voice Guide Module — Web Speech API
 *
 * Plays a spoken sensitivity guide after generation.
 * Gracefully degrades on unsupported browsers.
 *
 * Wires: #voiceBtn
 */

const GUIDE_TEXT =
  'Your BGMI sensitivity has been generated. ' +
  'Try this sensitivity for at least 3 days for best results. ' +
  'You will notice improved recoil control and better accuracy. ' +
  'If needed, adjust your gyro and ADS values by plus or minus 5 points ' +
  'to match your personal device feel. ' +
  'Stay consistent — that is the key to improving your game. Good luck!';

const SUPPORTED = typeof window !== 'undefined' && 'speechSynthesis' in window;

let _utterance = null;
let _speaking  = false;

// ── Speak ─────────────────────────────────────────────────
export function speak() {
  if (!SUPPORTED) return;

  // Stop any ongoing speech
  if (_speaking) {
    window.speechSynthesis.cancel();
    _speaking = false;
    _updateBtn(false);
    return;
  }

  _utterance         = new SpeechSynthesisUtterance(GUIDE_TEXT);
  _utterance.rate    = 0.92;   // slightly slower for clarity
  _utterance.pitch   = 1.0;
  _utterance.volume  = 1.0;
  _utterance.lang    = 'en-IN'; // Indian English

  // Prefer an Indian-accented voice if available
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(
    (v) => v.lang.startsWith('en-IN') || v.name.toLowerCase().includes('india'),
  ) ?? voices.find((v) => v.lang.startsWith('en')) ?? null;
  if (preferred) _utterance.voice = preferred;

  _utterance.onstart = () => { _speaking = true;  _updateBtn(true);  };
  _utterance.onend   = () => { _speaking = false; _updateBtn(false); };
  _utterance.onerror = () => { _speaking = false; _updateBtn(false); };

  window.speechSynthesis.speak(_utterance);
}

// ── Update button UI ──────────────────────────────────────
function _updateBtn(playing) {
  const btn = document.getElementById('voiceBtn');
  if (!btn) return;
  if (playing) {
    btn.textContent = '⏹ Stop';
    btn.classList.add('voice-btn--playing');
  } else {
    btn.textContent = '🔊 Play Guide';
    btn.classList.remove('voice-btn--playing');
  }
}

// ── Public init — call once from main.js ─────────────────
export function initVoiceButton() {
  const btn = document.getElementById('voiceBtn');
  if (!btn) return;

  if (!SUPPORTED) {
    // Hide the whole voice section if API not available
    const section = document.getElementById('voiceSection');
    if (section) section.hidden = true;
    return;
  }

  // Voices may load async on Chrome; ensure list is ready
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();

  btn.addEventListener('click', speak);
}

/** Stop speech (called when user regenerates, so old guide doesn't continue) */
export function stopSpeech() {
  if (SUPPORTED && _speaking) {
    window.speechSynthesis.cancel();
    _speaking = false;
    _updateBtn(false);
  }
}
