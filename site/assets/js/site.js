(() => {
  "use strict";

  /* ------------------------------------------------------------------ *
   *  kiyra.lol — suzu, her console, and the small hours of the page.   *
   *  Everything here is decoration: without this file the site is      *
   *  fully readable, and every effect respects prefers-reduced-motion. *
   * ------------------------------------------------------------------ */

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(pointer: fine)");
  const motionOK = () => !reducedMotion.matches;

  const store = {
    get(key, fallback = 0) {
      try {
        const value = window.localStorage.getItem(key);
        return value === null ? fallback : Number(value) || 0;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        window.localStorage.setItem(key, String(value));
      } catch {
        /* private browsing — suzu forgets, gracefully */
      }
    },
  };

  const rand = (min, max) => min + Math.random() * (max - min);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];

  /* ------------------------------------------------------------------ *
   *  Suzu, the terminal familiar                                        *
   * ------------------------------------------------------------------ */

  const FACE = {
    asleep: "( -.- )",
    awake: "( o.o )",
    blink: "( -,- )",
    happy: "( ^.^ )",
    love: "( ^w^ )",
    shock: "( O.O )",
  };

  const petLines = [
    "purrs. the terminal warms up.",
    "blinks slowly at you.",
    "tucks a paw over the cursor.",
    "headbutts your hand. rude, but affectionate.",
  ];

  const petMessage = (count) => {
    if (count === 10) return "suzu has claimed you as staff. ♡";
    if (count === 25) return "suzu considers you family now.";
    if (count === 50) return `suzu has been petted ${count} times. legendary.`;
    if (count > 4) return `purrs ×${count}. suzu approves of you.`;
    return petLines[(count - 1) % petLines.length];
  };

  const suzu = {
    face: $("#suzu-face"),
    status: $("#suzu-status"),
    window: $(".mascot-window"),
    awake: false,
    petting: false,
    petTimer: 0,
    pets: store.get("suzu-pets"),
  };

  const setFace = (face) => {
    if (suzu.face) suzu.face.textContent = face;
  };

  const setStatus = (text) => {
    if (suzu.status) suzu.status.textContent = text;
  };

  const wake = () => {
    if (suzu.awake) return;
    suzu.awake = true;
    setFace(FACE.awake);
    setStatus("suzu is listening.");
  };

  const sleep = () => {
    suzu.awake = false;
    suzu.petting = false;
    setFace(FACE.asleep);
    setStatus("asleep at 02:14");
  };

  const celebrate = (face, ms) => {
    suzu.petting = true;
    setFace(face);
    window.clearTimeout(suzu.petTimer);
    suzu.petTimer = window.setTimeout(() => {
      suzu.petting = false;
      setFace(suzu.awake ? FACE.awake : FACE.asleep);
    }, ms);
  };

  const sparkles = () => {
    if (!suzu.window) return;
    suzu.window.classList.remove("is-petted");
    void suzu.window.offsetWidth;
    suzu.window.classList.add("is-petted");
  };

  const pet = (fromConsole = false) => {
    suzu.pets += 1;
    store.set("suzu-pets", suzu.pets);
    wake();
    const message = petMessage(suzu.pets);
    setStatus(`suzu ${message}`);
    celebrate(FACE.happy, 2400);
    sparkles();
    if (fromConsole && consoleAPI) consoleAPI.note(`suzu ${message}`);
  };

  const initSuzuBody = () => {
    const petButton = $("#pet-suzu");
    const art = $("#suzu-art");

    if (petButton) {
      petButton.hidden = false;
      petButton.addEventListener("click", () => pet());
    }

    if (art) {
      art.addEventListener("click", (event) => {
        if (event.target.closest("#hero-moon")) return;
        pet();
      });
    }

    /* Suzu dozes off again if nobody is around. */
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && !suzu.petting) sleep();
    });

    /* Occasional blinking while awake. */
    if (motionOK() && suzu.face) {
      const blink = () => {
        if (suzu.awake && !suzu.petting && !document.hidden) {
          setFace(FACE.blink);
          window.setTimeout(() => {
            if (!suzu.petting) setFace(suzu.awake ? FACE.awake : FACE.asleep);
          }, 170);
        }
        window.setTimeout(blink, rand(3800, 8600));
      };
      window.setTimeout(blink, rand(2400, 5000));
    }
  };

  /* ------------------------------------------------------------------ *
   *  Suzu's console — a real little terminal in the hero                *
   * ------------------------------------------------------------------ */

  let consoleAPI = null;

  const initConsole = () => {
    const box = $("#suzu-console");
    const out = $("#console-out");
    const form = $("#console-form");
    const input = $("#console-input");
    if (!box || !out || !form || !input) return;

    box.hidden = false;

    const print = (text, cls = "c-out", asHTML = false) => {
      const line = document.createElement("p");
      line.className = cls;
      if (asHTML) {
        line.innerHTML = text;
      } else {
        line.textContent = text;
      }
      out.append(line);
      while (out.children.length > 60) out.firstElementChild.remove();
      out.scrollTop = out.scrollHeight;
    };

    const note = (text) => print(text, "c-ok");

    const files = {
      koda: "an IDE that arrives already knowing the language. rust, built-in lsp, zero config.",
      kitten: "a small language learning to compile itself. go + c; the tool is purr, the files are .ktn.",
      vynl: "a dj booth in your terminal. fft spectrum, vinyl mode, gapless playback. no browser required.",
      grimmoire: "an ascii-first rpg in a village that survived by feeding the water. rust, all glyphs.",
      suzu: "your terminal familiar. likes: pets, blinking cursors, and 02:14.",
      "~/.why":
        "to understand the machine\nfrom the inside out.\nthen make it a little kinder.",
    };

    const targets = {
      koda: "#koda",
      kitten: "#kitten",
      vynl: "#vynl",
      grimmoire: "#grimmoire",
      about: "#about",
      projects: "#projects",
      interests: "#interests",
      notes: "#notes",
      top: "#top",
      home: "#top",
    };

    const goto = (name) => {
      const sel = targets[name];
      const el = sel ? $(sel) : null;
      if (!el) return `no such place: ${name}. try: ls`;
      el.scrollIntoView({ behavior: motionOK() ? "smooth" : "auto", block: "start" });
      return `jumping to ${name} ✦`;
    };

    const notFound = [
      () => "command not found. suzu suggests: help",
      (cmd) => `command not found: “${cmd}”. suzu stares at you blankly.`,
      () => "suzu has never heard that one. help exists, though.",
    ];
    let missCount = 0;

    const commands = {
      help: () => {
        [
          "available commands:",
          "  help        — this list",
          "  whoami      — who is kiyra",
          "  ls          — look around",
          "  cat <name>  — read: koda, kitten, vynl, grimmoire, suzu, ~/.why",
          "  open <name> — jump to a project or section",
          "  pet         — pet suzu (or click the cat)",
          "  meow        — say hi to suzu",
          "  moon        — make a wish",
          "  lights      — toggle the lamp",
          "  clear       — clean the console",
          "  exit        — let suzu sleep",
        ].forEach((line) => print(line));
        return null;
      },
      whoami: () =>
        "kiyra (etokiyra) — builds compilers, terminal tools & small worlds. this page is one of them.",
      whois: () => commands.whoami(),
      ls: () => "koda/  kitten/  vynl/  grimmoire/  suzu  ~/.why",
      pwd: () => "/home/kiyra/midnight",
      uname: () => "midnight/1.0 kiyra.lol tty/01 — quiet, dark, keyboard-first.",
      cat: (args) => {
        const name = (args[0] || "").toLowerCase();
        if (!name) return "cat what? try: cat koda";
        const file = files[name] || files[args.join(" ")];
        if (!file) return `no such file: ${name}. try: ls`;
        print(file, "c-pink");
        return null;
      },
      open: (args) => goto((args[0] || "").toLowerCase()),
      goto: (args) => goto((args[0] || "").toLowerCase()),
      cd: (args) => goto((args[0] || "home").toLowerCase().replace(/[~/.]/g, "") || "home"),
      pet: () => {
        pet(true);
        return null;
      },
      meow: () => {
        celebrate(pick([FACE.shock, FACE.happy]), 1600);
        return pick([
          "suzu: meow.",
          "suzu: meow. (translation: feed the compiler.)",
          "suzu: mrrp?",
          "suzu: meow meow. (translation: the build is fine, probably.)",
        ]);
      },
      purr: () => {
        sparkles();
        celebrate(FACE.happy, 2000);
        return "suzu purrs. the window vibrates faintly. ♡";
      },
      moon: () => {
        shootStar();
        if (heroMoon) glowMoon();
        return "a shooting star crosses the hero. wish noted.";
      },
      stars: () => {
        [0, 260, 620].forEach((delay) => window.setTimeout(shootStar, delay));
        return "three stars, for luck.";
      },
      lights: () => {
        const lit = document.body.classList.toggle("is-lit");
        return lit
          ? "the lamp hums on. warm corners, same midnight."
          : "lights off. back to midnight.";
      },
      date: () => {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, "0");
        const mm = String(now.getMinutes()).padStart(2, "0");
        return `it is exactly ${hh}:${mm}. somewhere, it is always 02:14.`;
      },
      time: () => commands.date(),
      clear: () => {
        out.textContent = "";
        return null;
      },
      hello: () => "suzu nods politely. type help for tricks.",
      hi: () => commands.hello(),
      hey: () => commands.hello(),
      yo: () => commands.hello(),
      goodnight: () => "goodnight. the cursor keeps blinking.",
      coffee: () => "suzu doesn't brew. she naps next to the machine while it does.",
      sudo: () => "suzu does not accept root from strangers.",
      rm: () => "nice try. suzu guards this filesystem with her life.",
      vim: () => "suzu uses koda, obviously.",
      emacs: () => "suzu uses koda, obviously.",
      nano: () => "suzu uses koda, obviously.",
      man: () => "this console has exactly one page: help.",
      exit: () => {
        window.setTimeout(() => input.blur(), 300);
        sleep();
        return "suzu curls back up. zzz.";
      },
      quit: () => commands.exit(),
      bye: () => commands.exit(),
    };

    const run = (raw) => {
      const trimmed = raw.trim();
      if (!trimmed) return;
      print(`❯ ${trimmed}`, "c-in");
      const [name, ...args] = trimmed.split(/\s+/);
      const command = commands[name.toLowerCase()];
      if (command) {
        const result = command(args);
        if (result) print(result, "c-out");
      } else {
        print(notFound[missCount++ % notFound.length](name), "c-pink");
      }
    };

    const history = [];
    let historyIndex = -1;

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const value = input.value;
      if (!value.trim()) return;
      history.push(value);
      historyIndex = history.length;
      input.value = "";
      run(value);
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "ArrowUp" && history.length > 0) {
        event.preventDefault();
        historyIndex = Math.max(0, historyIndex - 1);
        input.value = history[historyIndex] ?? input.value;
      } else if (event.key === "ArrowDown" && history.length > 0) {
        event.preventDefault();
        historyIndex = Math.min(history.length, historyIndex + 1);
        input.value = history[historyIndex] ?? "";
      }
    });

    let blurTimer = 0;
    input.addEventListener("focus", () => {
      window.clearTimeout(blurTimer);
      wake();
    });
    input.addEventListener("blur", () => {
      window.clearTimeout(blurTimer);
      blurTimer = window.setTimeout(() => {
        if (!input.value.trim()) sleep();
      }, 5000);
    });

    consoleAPI = { note };

    print("✦ suzu console — type help and press enter", "c-ok");
  };

  /* ------------------------------------------------------------------ *
   *  Header: live clock + reading progress                              *
   * ------------------------------------------------------------------ */

  const initHeader = () => {
    const clock = $("#header-clock");

    const tickClock = () => {
      if (!clock) return;
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const label = now.getHours() < 5 ? "midnight hours" : "online";
      clock.textContent = `${hh}:${mm} · ${label}`;
    };

    if (clock) {
      tickClock();
      window.setInterval(tickClock, 30000);
    }

    const bar = $("#progress-bar");
    if (!bar) return;

    let queued = false;
    const update = () => {
      queued = false;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      bar.style.width = `${pct.toFixed(2)}%`;
    };

    const request = () => {
      if (!queued) {
        queued = true;
        window.requestAnimationFrame(update);
      }
    };

    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    update();
  };

  /* ------------------------------------------------------------------ *
   *  Reveal on scroll                                                   *
   * ------------------------------------------------------------------ */

  const initReveal = () => {
    const items = $$(".reveal");
    if (items.length === 0) return;

    $$("[data-stagger]").forEach((group) => {
      $$(".reveal", group).forEach((el, index) => {
        el.style.setProperty("--rd", `${Math.min(index * 70, 420)}ms`);
      });
    });

    if (!("IntersectionObserver" in window) || !motionOK()) {
      items.forEach((el) => el.classList.add("in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );

    items.forEach((el) => io.observe(el));
  };

  /* ------------------------------------------------------------------ *
   *  Ambience: cursor glow, click sparks, shooting stars                *
   * ------------------------------------------------------------------ */

  let heroMoon = null;

  const glowMoon = () => {
    if (!heroMoon) return;
    heroMoon.classList.add("is-glowing");
    window.setTimeout(() => heroMoon.classList.remove("is-glowing"), 1500);
  };

  const shootStar = () => {
    if (!motionOK()) return;
    const layer = $(".hero-stars");
    if (!layer) return;
    const star = document.createElement("span");
    star.className = "shooting-star";
    star.style.setProperty("--sy", `${rand(8, 42).toFixed(1)}%`);
    star.style.setProperty("--sx", `${rand(4, 58).toFixed(1)}%`);
    layer.append(star);
    star.addEventListener("animationend", () => star.remove());
  };

  const initAmbience = () => {
    heroMoon = $("#hero-moon");

    if (heroMoon) {
      heroMoon.addEventListener("click", (event) => {
        event.stopPropagation();
        glowMoon();
        shootStar();
        wake();
        setStatus("suzu watches the shooting star.");
        window.setTimeout(() => {
          if (!suzu.petting) setStatus(suzu.awake ? "suzu is listening." : "asleep at 02:14");
        }, 3200);
      });
    }

    if (!motionOK()) return;

    /* Ambient shooting stars while the hero is on screen. */
    const hero = $(".hero");
    if (hero) {
      window.setTimeout(shootStar, 5200);
      window.setInterval(() => {
        if (document.visibilityState !== "visible") return;
        const rect = hero.getBoundingClientRect();
        const visible = rect.bottom > 0 && rect.top < window.innerHeight;
        if (visible && Math.random() < 0.55) shootStar();
      }, 26000);
    }

    /* Soft glow that follows the cursor. */
    if (finePointer.matches) {
      const glow = document.createElement("div");
      glow.className = "cursor-glow";
      glow.setAttribute("aria-hidden", "true");
      document.body.append(glow);

      let targetX = 0;
      let targetY = 0;
      let currentX = 0;
      let currentY = 0;
      let started = false;
      let frame = 0;

      const step = () => {
        currentX += (targetX - currentX) * 0.14;
        currentY += (targetY - currentY) * 0.14;
        glow.style.transform = `translate(${currentX.toFixed(1)}px, ${currentY.toFixed(1)}px)`;
        if (Math.abs(targetX - currentX) > 0.4 || Math.abs(targetY - currentY) > 0.4) {
          frame = window.requestAnimationFrame(step);
        } else {
          frame = 0;
        }
      };

      window.addEventListener(
        "pointermove",
        (event) => {
          targetX = event.clientX;
          targetY = event.clientY;
          if (!started) {
            started = true;
            currentX = targetX;
            currentY = targetY;
            glow.classList.add("on");
          }
          if (!frame) frame = window.requestAnimationFrame(step);
        },
        { passive: true }
      );

      document.addEventListener("mouseleave", () => glow.classList.remove("on"));
      document.addEventListener("mouseenter", () => {
        if (started) glow.classList.add("on");
      });
    }

    /* Tiny spark wherever you click. */
    document.addEventListener(
      "pointerdown",
      (event) => {
        if (event.button !== 0) return;
        if ($$(".click-spark").length > 30) return;
        const spark = document.createElement("span");
        spark.className = "click-spark";
        spark.textContent = pick(["✦", "✧", "·"]);
        spark.style.left = `${event.clientX}px`;
        spark.style.top = `${event.clientY}px`;
        spark.style.color = pick(["var(--lav)", "var(--pink)", "var(--mint)", "var(--gold)"]);
        spark.style.setProperty("--dx", `${rand(-16, 16).toFixed(0)}px`);
        spark.style.setProperty("--rot", `${rand(-90, 90).toFixed(0)}deg`);
        document.body.append(spark);
        spark.addEventListener("animationend", () => spark.remove());
      },
      true
    );
  };

  /* ------------------------------------------------------------------ *
   *  Terminal tilt + live vynl spectrum                                 *
   * ------------------------------------------------------------------ */

  const initToys = () => {
    if (finePointer.matches && motionOK()) {
      $$(".term").forEach((term) => {
        term.addEventListener("pointermove", (event) => {
          const rect = term.getBoundingClientRect();
          const px = (event.clientX - rect.left) / rect.width - 0.5;
          const py = (event.clientY - rect.top) / rect.height - 0.5;
          term.classList.add("is-tilting");
          term.style.transform =
            `perspective(700px) rotateX(${(-py * 4).toFixed(2)}deg) ` +
            `rotateY(${(px * 5).toFixed(2)}deg)`;
        });
        term.addEventListener("pointerleave", () => {
          term.classList.remove("is-tilting");
          term.style.transform = "";
        });
      });
    }

    /* The vynl spectrum dances while its terminal is on screen. */
    const specs = $$(".term-vynl .spec");
    const deck = $(".term-vynl");
    if (specs.length > 0 && deck && motionOK() && "IntersectionObserver" in window) {
      const bars = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];
      let timer = 0;

      const draw = () => {
        const t = performance.now();
        specs.forEach((span, s) => {
          let text = "";
          for (let c = 0; c < 6; c += 1) {
            const phase = (s * 6 + c) * 0.62;
            const level =
              Math.abs(Math.sin(t / 640 + phase)) * 0.72 +
              Math.abs(Math.sin(t / 300 + phase * 1.7)) * 0.28;
            text += bars[Math.round(level * (bars.length - 1))] || "▁";
          }
          span.textContent = text;
        });
      };

      new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !timer) timer = window.setInterval(draw, 140);
          if (!entry.isIntersecting && timer) {
            window.clearInterval(timer);
            timer = 0;
          }
        },
        { threshold: 0.2 }
      ).observe(deck);
    }
  };

  /* ------------------------------------------------------------------ *
   *  Easter eggs: konami code, typing “meow” anywhere                   *
   * ------------------------------------------------------------------ */

  const starRain = () => {
    if (!motionOK()) return;
    const layer = document.createElement("div");
    layer.className = "star-rain";
    layer.setAttribute("aria-hidden", "true");
    document.body.append(layer);

    const glyphs = ["✦", "✧", "·", "♡", "✦", "✧"];
    const tints = ["", "tint-pink", "tint-mint", "tint-gold"];

    for (let i = 0; i < 26; i += 1) {
      window.setTimeout(() => {
        const span = document.createElement("span");
        span.textContent = pick(glyphs);
        span.style.left = `${rand(0, 100).toFixed(1)}vw`;
        span.style.fontSize = `${rand(11, 19).toFixed(0)}px`;
        span.style.setProperty("--fd", `${rand(0, 500).toFixed(0)}ms`);
        if (Math.random() < 0.6) span.classList.add(pick(tints));
        layer.append(span);
        span.addEventListener("animationend", () => span.remove());
      }, i * 55);
    }

    window.setTimeout(() => layer.remove(), 5200);
  };

  const initEggs = () => {
    const konami = [
      "arrowup",
      "arrowup",
      "arrowdown",
      "arrowdown",
      "arrowleft",
      "arrowright",
      "arrowleft",
      "arrowright",
      "b",
      "a",
    ];
    let progress = 0;

    document.addEventListener("keydown", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const typing = target?.closest("input, textarea, select");
      const key = event.key.toLowerCase();

      if (!typing) {
        progress = key === konami[progress] ? progress + 1 : key === konami[0] ? 1 : 0;
        if (progress === konami.length) {
          progress = 0;
          starRain();
          wake();
          celebrate(FACE.love, 3200);
          setStatus("the stars obey you. ✦");
          if (consoleAPI) consoleAPI.note("✦ konami accepted. the stars obey you.");
        }
      }
    });

    /* Type “meow” anywhere on the page (outside the console). */
    let typed = "";
    document.addEventListener("keydown", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest("input, textarea, select")) return;
      if (!/^[a-z]$/i.test(event.key)) return;
      typed = (typed + event.key.toLowerCase()).slice(-4);
      if (typed !== "meow") return;
      typed = "";
      wake();
      celebrate(FACE.happy, 2000);
      sparkles();
      setStatus("suzu heard that. meow.");
      if (consoleAPI) {
        consoleAPI.note("suzu heard that. meow.");
      }
    });
  };

  /* ------------------------------------------------------------------ *
   *  Hero eyebrow types itself in                                       *
   * ------------------------------------------------------------------ */

  const initTyping = () => {
    const typed = $("#typed");
    if (!typed || !motionOK()) return;
    const text = typed.textContent;
    typed.textContent = "";
    window.setTimeout(() => {
      let i = 0;
      const step = () => {
        i += 1;
        typed.textContent = text.slice(0, i);
        if (i < text.length) window.setTimeout(step, rand(45, 130));
      };
      step();
    }, 700);
  };

  /* ------------------------------------------------------------------ *
   *  Active section in the primary navigation                           *
   * ------------------------------------------------------------------ */

  const initNav = () => {
    const navLinks = $$('.nav-list a[href^="#"]');
    const sectionPairs = navLinks
      .map((link) => {
        const id = link.getAttribute("href").slice(1);
        return { link, section: document.getElementById(id) };
      })
      .filter((pair) => pair.section);

    if (sectionPairs.length === 0) return;

    let queued = false;

    const updateActiveLink = () => {
      queued = false;
      const headerHeight =
        $(".site-header")?.getBoundingClientRect().height || 0;
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
  };

  /* ------------------------------------------------------------------ *
   *  Boot                                                               *
   * ------------------------------------------------------------------ */

  initSuzuBody();
  initConsole();
  initHeader();
  initReveal();
  initAmbience();
  initToys();
  initEggs();
  initTyping();
  initNav();
})();
