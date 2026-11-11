/* ==========================================================================
   polish.js — the quiet layer.

   Small, deliberate motion: a header that settles when you scroll, a cursor
   light that stays inside the cards, and work-index row timing. Everything
   here is optional decoration and respects prefers-reduced-motion.
   ========================================================================== */

(() => {
  "use strict";

  const finePointer = window.matchMedia("(pointer: fine)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const header = document.querySelector(".site-header");

  let headerQueued = false;
  const syncHeader = () => {
    headerQueued = false;
    header?.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  const queueHeader = () => {
    if (headerQueued) return;
    headerQueued = true;
    window.requestAnimationFrame(syncHeader);
  };

  window.addEventListener("scroll", queueHeader, { passive: true });
  syncHeader();

  if (finePointer.matches && !reducedMotion.matches) {
    document.addEventListener(
      "pointermove",
      (event) => {
        const target = event.target instanceof Element ? event.target : null;
        const card = target?.closest(".project, .side-card, .note, .repo-card");
        if (!card) return;
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${(event.clientX - rect.left).toFixed(0)}px`);
        card.style.setProperty("--my", `${(event.clientY - rect.top).toFixed(0)}px`);
      },
      { passive: true }
    );
  }
})();
