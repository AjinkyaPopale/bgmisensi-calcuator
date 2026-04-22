/**
 * CONVERSION PSYCHOLOGY ENGINE
 * Ajinkya2OP BGMI Calculator
 *
 * Psychology principles applied:
 * 1. Social Proof    — live purchase notifications
 * 2. Scarcity        — countdown timer, limited slots
 * 3. Loss Aversion   — exit intent (what they'll miss)
 * 4. Commitment      — post-generate upgrade card
 * 5. Authority       — PMGC verified, real match tested
 * 6. Reciprocity     — free value → feel inclined to upgrade
 * 7. FOMO            — viewers count, real-time activity
 *
 * ZERO calculator logic touched.
 * Hooks: window events + DOM observation only.
 */

// ── Player data pool (realistic Indian BGMI names) ─────────
const PLAYERS = [
  { initials:'RK', name:'Rahul K.',    city:'Mumbai',    tier:'PMGC Elite' },
  { initials:'AS', name:'Arjun S.',    city:'Delhi',     tier:'Pro' },
  { initials:'VP', name:'Vikram P.',   city:'Bangalore', tier:'PMGC Elite' },
  { initials:'NR', name:'Neeraj R.',   city:'Pune',      tier:'PMGC Elite' },
  { initials:'SM', name:'Siddharth M.',city:'Hyderabad', tier:'Pro' },
  { initials:'KJ', name:'Kunal J.',    city:'Chennai',   tier:'PMGC Elite' },
  { initials:'AK', name:'Aman K.',     city:'Jaipur',    tier:'Pro' },
  { initials:'PR', name:'Pradeep R.',  city:'Kolkata',   tier:'PMGC Elite' },
  { initials:'DS', name:'Dev S.',      city:'Ahmedabad', tier:'Pro' },
  { initials:'MR', name:'Mohit R.',    city:'Lucknow',   tier:'PMGC Elite' },
  { initials:'SK', name:'Suraj K.',    city:'Indore',    tier:'Pro' },
  { initials:'RV', name:'Ravi V.',     city:'Surat',     tier:'PMGC Elite' },
];

const RECENT_BUY_TEXTS = [
  'Rahul from Mumbai just unlocked PMGC Elite 🔥',
  'Arjun from Delhi upgraded to Pro 👑',
  'Vikram from Bangalore got PMGC Elite ⚡',
  'Neeraj from Pune just joined PMGC Elite 🔥',
  'Siddharth from Hyderabad upgraded to Pro 👑',
  'Kunal from Chennai unlocked PMGC Elite 🔥',
  'Aman from Jaipur upgraded to Pro 👑',
  'Pradeep from Kolkata got PMGC Elite ⚡',
];

let playerIdx = 0;
let buyTextIdx = 0;
let exitIntentShown = false;
let postGenShown = false;
let viewersBase = 18 + Math.floor(Math.random() * 12);

// ── Utility ────────────────────────────────────────────────
function openProModal() {
  const btn = document.getElementById('proHeaderBtn');
  if (btn) btn.click();
}

// ── 1. LIVE PURCHASE NOTIFICATIONS ────────────────────────
function showLiveNotif() {
  const container = document.getElementById('liveNotifContainer');
  if (!container) return;

  const p = PLAYERS[playerIdx % PLAYERS.length];
  playerIdx++;
  const isPMGC = p.tier === 'PMGC Elite';

  const el = document.createElement('div');
  el.className = `live-notif${isPMGC ? ' pmgc-notif' : ''}`;
  el.setAttribute('role', 'status');
  el.innerHTML = `
    <div class="notif-avatar">${p.initials}</div>
    <div class="notif-body">
      <div class="notif-name">${p.name}</div>
      <div class="notif-action">${p.city} · just upgraded</div>
    </div>
    <div class="notif-tier">${p.tier}</div>
    <div class="notif-pulse"></div>`;

  container.appendChild(el);

  // Remove after animation ends
  setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 4800);
}

// First notif after 8s, then random intervals 20–45s
setTimeout(() => {
  showLiveNotif();
  function scheduleNext() {
    setTimeout(() => {
      showLiveNotif();
      scheduleNext();
    }, 20000 + Math.random() * 25000);
  }
  scheduleNext();
}, 8000);

// ── 2. URGENCY COUNTDOWN TIMER ─────────────────────────────
function initCountdown() {
  const el = document.getElementById('urgencyTimer');
  if (!el) return;

  // Reset at midnight local time — gives genuine daily urgency
  const now      = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  let remaining  = Math.floor((midnight - now) / 1000);

  function pad(n) { return String(n).padStart(2,'0'); }

  function tick() {
    if (remaining <= 0) { el.textContent = '00:00:00'; return; }
    const h = Math.floor(remaining / 3600);
    const m = Math.floor((remaining % 3600) / 60);
    const s = remaining % 60;
    el.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
    remaining--;
    setTimeout(tick, 1000);
  }
  tick();
}
initCountdown();

// ── 3. VIEWERS COUNTER ─────────────────────────────────────
function initViewers() {
  const el = document.getElementById('viewersNow');
  if (!el) return;
  el.textContent = viewersBase;

  function tick() {
    const delta = Math.random() > 0.5 ? 1 : -1;
    viewersBase = Math.max(12, Math.min(45, viewersBase + delta));
    el.textContent = viewersBase;
    setTimeout(tick, 6000 + Math.random() * 8000);
  }
  setTimeout(tick, 6000);
}
initViewers();

// ── 4. RECENT BUY TICKER IN MODAL ─────────────────────────
function initRecentBuyTicker() {
  const el = document.getElementById('mrbText');
  if (!el) return;

  el.textContent = RECENT_BUY_TEXTS[0];

  function tick() {
    buyTextIdx = (buyTextIdx + 1) % RECENT_BUY_TEXTS.length;
    el.style.opacity = '0';
    setTimeout(() => {
      el.textContent = RECENT_BUY_TEXTS[buyTextIdx];
      el.style.transition = 'opacity .4s';
      el.style.opacity = '1';
    }, 300);
    setTimeout(tick, 10000);
  }
  setTimeout(tick, 10000);
}
initRecentBuyTicker();

// ── 5. EXIT INTENT ─────────────────────────────────────────
function initExitIntent() {
  const overlay   = document.getElementById('exitIntentOverlay');
  const closeX    = document.getElementById('exitCloseX');
  const dismissBtn= document.getElementById('exitDismissBtn');
  const ctaBtn    = document.getElementById('exitCTABtn');
  if (!overlay) return;

  function showExit() {
    if (exitIntentShown) return;
    // Don't show if already Pro/PMGC
    const chip = document.getElementById('versionChip');
    if (chip && (chip.classList.contains('chip-pro') || chip.classList.contains('chip-pmgc'))) return;
    exitIntentShown = true;
    overlay.classList.add('visible');
  }

  function hideExit() {
    overlay.classList.remove('visible');
  }

  // Trigger: mouse leaves viewport (top 20%)
  document.addEventListener('mouseleave', (e) => {
    if (e.clientY < window.innerHeight * 0.12) showExit();
  });

  // Trigger: mobile — back button / page hide after 30s engagement
  let mobileTimer;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && !exitIntentShown) {
      clearTimeout(mobileTimer);
      mobileTimer = setTimeout(showExit, 500);
    }
  });

  closeX?.addEventListener('click', hideExit);
  dismissBtn?.addEventListener('click', hideExit);
  overlay?.addEventListener('click', (e) => { if (e.target === overlay) hideExit(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideExit(); });

  ctaBtn?.addEventListener('click', () => {
    hideExit();
    setTimeout(openProModal, 200);
  });
}
initExitIntent();

// ── 6. POST-GENERATE UPGRADE CARD ─────────────────────────
function injectPostGenCard() {
  if (postGenShown) return;

  // Check if user already paid
  const chip = document.getElementById('versionChip');
  if (chip && (chip.classList.contains('chip-pro') || chip.classList.contains('chip-pmgc'))) return;

  const rc = document.getElementById('rc');
  if (!rc || rc.hidden) return;

  // Don't show twice
  if (document.getElementById('postGenUpgradeCard')) return;
  postGenShown = true;

  const card = document.createElement('div');
  card.id = 'postGenUpgradeCard';
  card.setAttribute('role', 'complementary');
  card.setAttribute('aria-label', 'Upgrade to unlock more features');
  card.innerHTML = `
    <div class="pguc-header">
      <span class="pguc-fire">🔥</span>
      <div>
        <div class="pguc-title">Your Free Result Is Ready — Unlock Elite Level</div>
        <div class="pguc-sub">What Pro & PMGC adds to YOUR sensitivity:</div>
      </div>
    </div>
    <div class="pguc-items">
      <div class="pguc-item">
        <span class="pguc-item-icon">🎯</span>
        <div class="pguc-item-body">
          <div class="pguc-item-title">HS PRO+ Headshots</div>
          <div class="pguc-item-desc">Micro-tuned for snap headshot precision on YOUR device</div>
        </div>
      </div>
      <div class="pguc-item">
        <span class="pguc-item-icon">⚙️</span>
        <div class="pguc-item-body">
          <div class="pguc-item-title">6 Engine Presets</div>
          <div class="pguc-item-desc">Close beast, zero recoil, tournament stability & more</div>
        </div>
      </div>
      <div class="pguc-item">
        <span class="pguc-item-icon">🏆</span>
        <div class="pguc-item-body">
          <div class="pguc-item-title">PMGC Tournament Base</div>
          <div class="pguc-item-desc">Tighter recoil control, smoother spray — PMGC 4.3 verified</div>
        </div>
      </div>
      <div class="pguc-item">
        <span class="pguc-item-icon">🔧</span>
        <div class="pguc-item-body">
          <div class="pguc-item-title">±5% Fine-Tune Sliders</div>
          <div class="pguc-item-desc">Adjust Gyro & ADS to match your exact feel</div>
        </div>
      </div>
    </div>
    <div class="pguc-cta-row">
      <button class="pguc-cta-pro" id="pgucProBtn">👑 Pro — ₹99</button>
      <button class="pguc-cta-pmgc" id="pgucPMGCBtn">🔥 PMGC Elite — ₹199 (Best)</button>
    </div>`;

  // Insert after the result card
  rc.after(card);

  document.getElementById('pgucProBtn')?.addEventListener('click', openProModal);
  document.getElementById('pgucPMGCBtn')?.addEventListener('click', openProModal);

  // Subtle glow on result card
  rc.classList.add('rcard-has-upgrade');
}

// Watch for result card becoming visible
const resultObserver = new MutationObserver(() => {
  const rc = document.getElementById('rc');
  if (rc && !rc.hidden) {
    setTimeout(injectPostGenCard, 800); // small delay for dramatic effect
  }
});
const rcParent = document.getElementById('resultCol');
if (rcParent) {
  resultObserver.observe(rcParent, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
}

// Also try on form submit
document.getElementById('f')?.addEventListener('submit', () => {
  setTimeout(injectPostGenCard, 1500);
});

// ── 7. FLOATING UPGRADE PILL ───────────────────────────────
function initFloatPill() {
  const pill    = document.getElementById('floatUpgradePill');
  const pillBtn = document.getElementById('floatPillBtn');
  if (!pill) return;

  let pillVisible = false;

  function showPill() {
    const chip = document.getElementById('versionChip');
    if (chip && (chip.classList.contains('chip-pro') || chip.classList.contains('chip-pmgc'))) return;
    if (!pillVisible) { pill.classList.add('visible'); pillVisible = true; }
  }

  function hidePill() {
    pill.classList.remove('visible');
    pillVisible = false;
  }

  // Show after user scrolls past results
  window.addEventListener('scroll', () => {
    const rc = document.getElementById('rc');
    if (!rc || rc.hidden) return;
    const rect = rc.getBoundingClientRect();
    if (rect.bottom < 0) showPill();
    else hidePill();
  }, { passive: true });

  pillBtn?.addEventListener('click', () => {
    hidePill();
    openProModal();
  });
}
initFloatPill();

// ── 8. HIDE CONVERSION ELEMENTS AFTER UNLOCK ──────────────
function onUnlock() {
  // Hide exit intent
  document.getElementById('exitIntentOverlay')?.classList.remove('visible');
  // Hide float pill
  document.getElementById('floatUpgradePill')?.classList.remove('visible');
  // Hide post-gen card
  const card = document.getElementById('postGenUpgradeCard');
  if (card) {
    card.style.transition = 'opacity .4s, max-height .4s';
    card.style.opacity = '0';
    setTimeout(() => card.remove(), 420);
  }
  // Remove result card glow
  document.getElementById('rc')?.classList.remove('rcard-has-upgrade');
}

// Watch versionChip for unlock signal
const chipObserver = new MutationObserver(() => {
  const chip = document.getElementById('versionChip');
  if (chip && (chip.classList.contains('chip-pro') || chip.classList.contains('chip-pmgc'))) {
    onUnlock();
    chipObserver.disconnect();
  }
});
const chip = document.getElementById('versionChip');
if (chip) chipObserver.observe(chip, { attributes: true, attributeFilter: ['class'] });

// ── 9. ANNOUNCE BAR UPGRADE ────────────────────────────────
(function() {
  const bar = document.getElementById('announceBar');
  if (bar) bar.classList.add('announce-bar-upgrade');
})();

// ── 10. PMGC PREVIEW CARD — stronger click pull ────────────
document.getElementById('pmgcUnlockCTA')?.addEventListener('click', openProModal);

// ── Done ───────────────────────────────────────────────────
console.log('[Ajinkya2OP] Conversion engine loaded ✅');
