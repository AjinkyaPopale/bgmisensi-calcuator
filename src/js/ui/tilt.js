/* ═══════════════════════════════════════════════════════════
   PREMIUM TILT EFFECT
   Lightweight 3-D card tilt — no external libraries.
   Desktop (hover-capable) devices only.
   Max rotation: 4 degrees. Smooth cubic-bezier easing.
═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* Only activate on real pointer/hover devices */
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (!canHover.matches) return;

  /**
   * applyTilt(el, maxDeg)
   * Adds 3-D tilt + radial shine to `el` on mousemove.
   * Updates `el.style.transform` and CSS vars --shine-x/--shine-y.
   */
  function applyTilt(el, maxDeg) {
    maxDeg = maxDeg || 4;
    var raf = null;

    function onMove(e) {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () {
        var rect = el.getBoundingClientRect();
        var x = (e.clientX - rect.left)  / rect.width;   /* 0 → 1 */
        var y = (e.clientY - rect.top)   / rect.height;  /* 0 → 1 */
        var rotY =  (x - 0.5) * 2 * maxDeg;              /* -maxDeg → +maxDeg */
        var rotX = -(y - 0.5) * 2 * maxDeg;              /* tilt top/bottom  */
        el.style.transform =
          'perspective(820px) rotateX(' + rotX.toFixed(2) + 'deg) rotateY(' + rotY.toFixed(2) + 'deg) scale(1.012)';
        el.style.setProperty('--shine-x', (x * 100).toFixed(1) + '%');
        el.style.setProperty('--shine-y', (y * 100).toFixed(1) + '%');
      });
    }

    function onEnter() {
      /* Fast response on entry */
      el.style.transition =
        'transform .1s ease, box-shadow .2s ease, border-color .2s ease';
    }

    function onLeave() {
      if (raf) cancelAnimationFrame(raf);
      /* Smooth spring-back */
      el.style.transition =
        'transform .38s cubic-bezier(.22,1,.36,1), box-shadow .3s ease, border-color .2s ease';
      el.style.transform = 'perspective(820px) rotateX(0deg) rotateY(0deg) scale(1)';
      el.style.setProperty('--shine-x', '50%');
      el.style.setProperty('--shine-y', '50%');
    }

    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mousemove',  onMove);
    el.addEventListener('mouseleave', onLeave);
  }

  /* ─── Targets ─────────────────────────────────────────── */

  /* Proof cards — Before/After */
  document.querySelectorAll('.proof-card').forEach(function (card) {
    applyTilt(card, 4);
  });

  /* PMGC featured tier card in upgrade modal */
  var pmgcTier = document.querySelector('.tier-card.pmgc.pmgc-featured');
  if (pmgcTier) applyTilt(pmgcTier, 3);

  /* Featured price box in upgrade modal */
  var pmgcPrice = document.querySelector('.pm-price-box.pmgc.pm-price-featured');
  if (pmgcPrice) applyTilt(pmgcPrice, 3);

})();
