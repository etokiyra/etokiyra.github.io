(() => {
  "use strict";

  /* Suzu, the terminal familiar ------------------------------------------- */

  const petButton = document.querySelector("#pet-suzu");
  const suzuStatus = document.querySelector("#suzu-status");
  const suzuFace = document.querySelector("#suzu-face");
  const mascotWindow = document.querySelector(".mascot-window");

  if (petButton && suzuStatus && suzuFace && mascotWindow) {
    const messages = [
      "purrs. the terminal warms up.",
      "blinks slowly at you.",
      "tucks a paw over the cursor.",
      "asleep at 02:14",
    ];
    let messageIndex = 0;
    let resetTimer;

    petButton.hidden = false;
    petButton.addEventListener("click", () => {
      suzuStatus.textContent = messages[messageIndex % messages.length];
      suzuFace.textContent = "( o.o )";
      messageIndex += 1;

      mascotWindow.classList.remove("is-petted");
      void mascotWindow.offsetWidth;
      mascotWindow.classList.add("is-petted");

      window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => {
        mascotWindow.classList.remove("is-petted");
        suzuFace.textContent = "( -.- )";
      }, 2200);
    });
  }

  /* Current section in the primary navigation ----------------------------- */

  const navLinks = Array.from(
    document.querySelectorAll('.nav-list a[href^="#"]')
  );
  const sectionPairs = navLinks
    .map((link) => {
      const id = link.getAttribute("href").slice(1);
      return { link, section: document.getElementById(id) };
    })
    .filter((pair) => pair.section);

  if (sectionPairs.length > 0) {
    let queued = false;

    const updateActiveLink = () => {
      queued = false;
      const headerHeight =
        document.querySelector(".site-header")?.getBoundingClientRect().height || 0;
      const threshold = headerHeight + 120;
      let activeSection = null;

      for (const { section } of sectionPairs) {
        if (section.getBoundingClientRect().top <= threshold) {
          activeSection = section;
        }
      }

      for (const { link, section } of sectionPairs) {
        const isActive = section === activeSection;
        link.classList.toggle("is-active", isActive);
        if (isActive) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      }
    };

    const requestUpdate = () => {
      if (!queued) {
        queued = true;
        window.requestAnimationFrame(updateActiveLink);
      }
    };

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    updateActiveLink();
  }
})();
