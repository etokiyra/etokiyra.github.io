/* ==========================================================================
   extra.js — the fun layer.

   A command palette (Ctrl/⌘+K), a small achievements shelf, and a button
   that was explicitly labelled "do not press". Nothing here is required
   to read the site; without JavaScript the page is still the page.
   ========================================================================== */

(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const store = {
    get(key, fallback = "") {
      try {
        const value = window.localStorage.getItem(key);
        return value === null ? fallback : value;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        window.localStorage.setItem(key, String(value));
      } catch {
        /* private mode. the shelf is imaginary. */
      }
    },
  };

  const toastStack = $("#toast-stack");

  const say = (text, { mark = "✦", name = "", desc = "", kind = "note" } = {}) => {
    if (!toastStack) return;

    const toast = document.createElement("button");
    toast.type = "button";
    toast.className = `toast toast-${kind}`;

    const glyph = document.createElement("span");
    glyph.className = "toast-mark";
    glyph.setAttribute("aria-hidden", "true");
    glyph.textContent = mark;

    const copy = document.createElement("span");
    copy.className = "toast-copy";

    if (name) {
      const kicker = document.createElement("span");
      kicker.className = "toast-kicker";
      kicker.textContent = "achievement unlocked";
      const title = document.createElement("span");
      title.className = "toast-name";
      title.textContent = name;
      copy.append(kicker, title);
    } else {
      const title = document.createElement("span");
      title.className = "toast-name";
      title.textContent = text;
      copy.append(title);
    }

    if (desc) {
      const detail = document.createElement("span");
      detail.className = "toast-desc";
      detail.textContent = desc;
      copy.append(detail);
    }

    toast.append(glyph, copy);
    toast.addEventListener("click", () => {
      toast.remove();
      if (name) openShelf();
    });

    toastStack.append(toast);
    while (toastStack.children.length > 3) toastStack.firstElementChild.remove();

    window.setTimeout(() => {
      toast.classList.add("is-leaving");
      window.setTimeout(() => toast.remove(), 260);
    }, name ? 5600 : 3600);
  };

  /* ------------------------------------------------------------------ *
   *  Achievements                                                       *
   * ------------------------------------------------------------------ */

  const ACHIEVEMENTS = [
    {
      id: "first-light",
      name: "first light",
      glyph: "✦",
      desc: "You found the lamp. Welcome in.",
      hint: "Visit the site.",
      test: () => true,
    },
    {
      id: "night-owl",
      name: "night owl",
      glyph: "☾",
      desc: "The site looks better after midnight. You checked.",
      hint: "Visit between midnight and 05:00.",
      test: () => new Date().getHours() < 5,
    },
    {
      id: "three-am",
      name: "the cat's hour",
      glyph: "✧",
      desc: "03:00. Suzu is hunting. You are here.",
      hint: "Be awake at 03:00.",
      test: () => new Date().getHours() === 3,
    },
    {
      id: "regular",
      name: "regular",
      glyph: "·",
      desc: "You came back. Suzu noticed, obviously.",
      hint: "Return on another day.",
      test: () => Number(store.get("suzu-visits", "0")) > 1,
    },
    {
      id: "cat-person",
      name: "cat person",
      glyph: "♡",
      desc: "Ten pets. She has claimed you as staff.",
      hint: "Pet Suzu ten times.",
      test: () => Number(store.get("suzu-pets", "0")) >= 10,
    },
    {
      id: "middle-management",
      name: "middle management",
      glyph: "♛",
      desc: "One hundred pets. You report to the cat now.",
      hint: "Pet Suzu one hundred times.",
      test: () => Number(store.get("suzu-pets", "0")) >= 100,
    },
    {
      id: "moonstruck",
      name: "moonstruck",
      glyph: "☾",
      desc: "You clicked the moon. It clicked back.",
      hint: "Click the moon in the hero.",
      test: () => false,
    },
    {
      id: "palette",
      name: "keyboard native",
      glyph: "⌘",
      desc: "Ctrl+K. A person of culture.",
      hint: "Open the command palette.",
      test: () => false,
    },
    {
      id: "the-old-code",
      name: "the old code",
      glyph: "↑",
      desc: "↑↑↓↓←→←→BA. Some rituals never die.",
      hint: "The Konami code works here.",
      test: () => false,
    },
    {
      id: "fluent-in-cat",
      name: "fluent in cat",
      glyph: "ω",
      desc: "You typed meow at a website and it answered.",
      hint: "Type meow anywhere outside the console.",
      test: () => false,
    },
    {
      id: "release-notes",
      name: "release notes enjoyer",
      glyph: "◷",
      desc: "You scrolled all the way to what shipped.",
      hint: "Find the recently shipped feed.",
      test: () => false,
    },
    {
      id: "read-the-source",
      name: "read the source",
      glyph: "{ }",
      desc: "The best documentation is sometimes the repo.",
      hint: "Open the site source.",
      test: () => false,
    },
    {
      id: "terminal-native",
      name: "terminal native",
      glyph: "❯",
      desc: "You talked to Suzu in her own console.",
      hint: "Run a command in Suzu's console.",
      test: () => false,
    },
    {
      id: "curiosity",
      name: "curiosity, punished",
      glyph: "!",
      desc: "The button said do not press. You pressed it five times.",
      hint: "Resist. Then don't.",
      test: () => Number(store.get("kiyra-button-presses", "0")) >= 5,
    },
    {
      id: "lost-and-found",
      name: "lost + found",
      glyph: "⌂",
      desc: "You found the room that is not on the map.",
      hint: "Somewhere off the sitemap.",
      test: () => false,
    },
    {
      id: "completionist",
      name: "suzu's favourite",
      glyph: "★",
      desc: "Every secret found. She pretends not to be impressed.",
      hint: "Find everything else.",
      test: () => false,
    },
  ];

  const FOUND_KEY = "kiyra-achievements";
  let found = new Set();

  const knownIds = new Set(ACHIEVEMENTS.map((entry) => entry.id));

  try {
    const saved = JSON.parse(store.get(FOUND_KEY, "{}"));
    if (saved && typeof saved === "object") {
      found = new Set(Object.keys(saved).filter((id) => knownIds.has(id)));
    }
  } catch {
    found = new Set();
  }

  const saveFound = () => {
    const payload = {};
    for (const id of found) payload[id] = true;
    store.set(FOUND_KEY, JSON.stringify(payload));
  };

  const updateCount = () => {
    const counter = $("#achievement-count");
    if (!counter) return;
    counter.textContent = `${found.size}/${ACHIEVEMENTS.length}`;
  };

  const unlock = (id, { silent = false } = {}) => {
    const entry = ACHIEVEMENTS.find((item) => item.id === id);
    if (!entry || found.has(id)) return;
    found.add(id);
    saveFound();
    updateCount();
    if (!silent) say("", { mark: entry.glyph, name: entry.name, desc: entry.desc });

    if (id !== "completionist" && ACHIEVEMENTS.every((item) => item.id === "completionist" || found.has(item.id))) {
      window.setTimeout(() => unlock("completionist"), 700);
    }
  };

  const check = () => {
    for (const entry of ACHIEVEMENTS) {
      if (entry.id === "completionist" || found.has(entry.id)) continue;
      let passed = false;
      try {
        passed = entry.test();
      } catch {
        passed = false;
      }
      if (passed) unlock(entry.id);
    }
  };

  let shelfDialog = null;

  const renderShelf = () => {
    const list = $("#achievements-list");
    const progress = $("#achievements-progress");
    if (!list) return;

    list.replaceChildren();
    for (const entry of ACHIEVEMENTS) {
      const isFound = found.has(entry.id);
      const item = document.createElement("li");
      item.className = `achievement${isFound ? " is-found" : ""}`;

      const glyph = document.createElement("span");
      glyph.className = "achievement-glyph";
      glyph.setAttribute("aria-hidden", "true");
      glyph.textContent = isFound ? entry.glyph : "?";

      const copy = document.createElement("span");
      copy.className = "achievement-copy";

      const name = document.createElement("span");
      name.className = "achievement-name";
      name.textContent = isFound ? entry.name : "not found yet";

      const desc = document.createElement("span");
      desc.className = "achievement-desc";
      desc.textContent = isFound ? entry.desc : entry.hint;

      copy.append(name, desc);
      item.append(glyph, copy);
      list.append(item);
    }

    if (progress) progress.textContent = `${found.size} of ${ACHIEVEMENTS.length} found`;
    updateCount();
  };

  const openShelf = () => {
    if (!shelfDialog) shelfDialog = $("#achievements-dialog");
    if (!shelfDialog) return;
    renderShelf();
    if (typeof shelfDialog.showModal === "function" && !shelfDialog.open) {
      shelfDialog.showModal();
    } else {
      shelfDialog.setAttribute("open", "");
    }
  };

  const closeShelf = () => {
    if (!shelfDialog) return;
    if (typeof shelfDialog.close === "function" && shelfDialog.open) {
      shelfDialog.close();
    } else {
      shelfDialog.removeAttribute("open");
    }
  };

  const initShelf = () => {
    shelfDialog = $("#achievements-dialog");

    $("#achievements-open")?.addEventListener("click", openShelf);
    $("#achievements-close")?.addEventListener("click", closeShelf);

    shelfDialog?.addEventListener("click", (event) => {
      const box = shelfDialog.getBoundingClientRect();
      const outside =
        event.clientX < box.left ||
        event.clientX > box.right ||
        event.clientY < box.top ||
        event.clientY > box.bottom;
      if (outside) closeShelf();
    });

    updateCount();
    check();

    /* Petting and care live in site.js. React to the page, not to internals. */
    document.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest("#suzu-art, .care-button")) {
        window.setTimeout(check, 80);
      }
      if (target?.closest('a[href*="etokiyra.github.io"]')) unlock("read-the-source");
    });

    $("#console-form")?.addEventListener("submit", () => unlock("terminal-native"));

    /* Scroll watchers for the data-driven section. */
    const watchActivity = () => {
      const section = $("#activity");
      if (!section || section.hidden) return;
      if (!("IntersectionObserver" in window)) return;
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            unlock("release-notes");
            observer.disconnect();
          }
        },
        { threshold: 0.25 }
      );
      observer.observe(section);
    };

    window.addEventListener("kiyra:data", watchActivity, { once: true });
    if (document.documentElement.classList.contains("has-live-data")) watchActivity();
    window.addEventListener("kiyra:achievements", openShelf);
  };

  /* ------------------------------------------------------------------ *
   *  The button that asked for none of this                             *
   * ------------------------------------------------------------------ */

  const BUTTON_LINES = [
    "nothing happened. regrettable.",
    "you pressed it again. the button remembers.",
    "suzu looked up. she is judging you.",
    "a distant meow of disapproval.",
    "fine. stars. but you were warned.",
    "the button has filed a complaint. management is a cat.",
    "it is still not a feature. it is a button you pressed.",
  ];

  const initButton = () => {
    const button = $("#do-not-press");
    if (!button) return;

    button.addEventListener("click", () => {
      const count = Number(store.get("kiyra-button-presses", "0")) + 1;
      store.set("kiyra-button-presses", count);
      const line = BUTTON_LINES[Math.min(count - 1, BUTTON_LINES.length - 1)];
      say(line, { mark: "!" });
      button.textContent = count < 3 ? "do not press" : count < 6 ? "stop pressing" : "you keep pressing";
      if (count === 5) {
        for (const delay of [0, 280, 640]) {
          window.setTimeout(() => $("#hero-moon")?.click(), delay);
        }
      }
      window.setTimeout(() => {
        button.textContent = "do not press";
      }, 4200);
      check();
    });
  };

  /* ------------------------------------------------------------------ *
   *  Command palette                                                    *
   * ------------------------------------------------------------------ */

  const palette = {
    root: null,
    input: null,
    list: null,
    empty: null,
    commands: [],
    active: 0,
    previousFocus: null,
  };

  const goTo = (selector) => {
    const target = document.querySelector(selector);
    if (!target || target.hidden) return false;
    target.scrollIntoView({
      behavior: reducedMotion.matches ? "auto" : "smooth",
      block: "start",
    });
    return true;
  };

  const runConsole = (command) => {
    const form = $("#console-form");
    const input = $("#console-input");
    if (!form || !input) return false;
    input.value = command;
    form.requestSubmit();
    return true;
  };

  const randomProject = () => {
    const cards = Array.from(document.querySelectorAll(".project[id]"));
    if (!cards.length) return;
    const card = cards[Math.floor(Math.random() * cards.length)];
    const name = card.querySelector("h3")?.textContent?.trim() || card.id;
    card.scrollIntoView({
      behavior: reducedMotion.matches ? "auto" : "smooth",
      block: "start",
    });
    window.clearTimeout(randomProject.timer);
    card.classList.add("is-target");
    randomProject.timer = window.setTimeout(() => card.classList.remove("is-target"), 1800);
    say(`landed on ${name}. good luck.`, { mark: "↝" });
  };

  const copyEmail = async () => {
    const email = "kiyrai@proton.me";
    try {
      await navigator.clipboard.writeText(email);
      say("email copied. no pressure.", { mark: "@" });
    } catch {
      say(`clipboard said no. the address is ${email}.`, { mark: "@" });
    }
  };

  const baseCommands = () => [
    { id: "go:top", group: "go", label: "top of the page", hint: "back to the hero", run: () => goTo("#top") },
    { id: "go:projects", group: "go", label: "selected work", hint: "four case files and two experiments", run: () => goTo("#projects") },
    { id: "go:signal", group: "go", label: "signal", hint: "releases and commits from github", run: () => goTo("#signal") },
    { id: "go:about", group: "go", label: "about", hint: "the short version", run: () => goTo("#about") },
    { id: "go:interests", group: "go", label: "stack", hint: "the layer underneath the layer", run: () => goTo("#interests") },
    { id: "go:notes", group: "go", label: "notes", hint: "habits and experiments", run: () => goTo("#notes") },
    { id: "go:contact", group: "go", label: "contact", hint: "the open channel", run: () => goTo("#contact") },
    { id: "fun:random", group: "go", label: "open a random case file", hint: "let the terminal decide", run: randomProject },
    { id: "fun:email", group: "links", label: "copy email address", hint: "kiyrai@proton.me", run: copyEmail },
    {
      id: "go:activity",
      group: "go",
      label: "recently shipped",
      hint: "releases and commits from github",
      run: () => {
        if (!goTo("#activity")) say("the wire is quiet. live data has not arrived yet.", { mark: "·" });
      },
    },
    {
      id: "go:others",
      group: "go",
      label: "the rest of the desk",
      hint: "the repos without a full card",
      run: () => {
        if (!goTo("#others")) say("the wire is quiet. live data has not arrived yet.", { mark: "·" });
      },
    },
    { id: "open:kemori", group: "projects", label: "kemori", hint: "the terminal-native IDE", run: () => goTo("#kemori") },
    { id: "open:kitten", group: "projects", label: "kitten", hint: "a language learning to compile itself", run: () => goTo("#kitten") },
    { id: "open:vynl", group: "projects", label: "vynl", hint: "a DJ booth in your terminal", run: () => goTo("#vynl") },
    { id: "open:grimmoire", group: "projects", label: "grimmoire", hint: "a dark-fantasy world in glyphs", run: () => goTo("#grimmoire") },
    { id: "open:caelestia-rice", group: "projects", label: "caelestia-rice", hint: "the desktop, dressed in glass", run: () => goTo("#caelestia-rice") },
    { id: "open:opencode-config", group: "projects", label: "opencode-config", hint: "the coding agent, ready to work", run: () => goTo("#opencode-config") },
    {
      id: "fun:pet",
      group: "suzu",
      label: "pet suzu",
      hint: "she will allow it",
      run: () => {
        $("#suzu-art")?.click();
        say("suzu has been petted. she allowed it.", { mark: "♡" });
      },
    },
    {
      id: "fun:lights",
      group: "suzu",
      label: "toggle the lamp",
      hint: "warm corners, same midnight",
      run: () => {
        const lit = document.body.classList.toggle("is-lit");
        say(lit ? "the lamp hums on." : "lights off. back to midnight.", { mark: "☾" });
      },
    },
    {
      id: "fun:moon",
      group: "suzu",
      label: "make a wish",
      hint: "a shooting star crosses the hero",
      run: () => {
        $("#hero-moon")?.click();
        say("a shooting star crosses the hero. wish noted.", { mark: "✧" });
      },
    },
    {
      id: "fun:stars",
      group: "suzu",
      label: "star shower",
      hint: "three stars, for luck",
      run: () => {
        for (const delay of [0, 260, 640]) {
          window.setTimeout(() => $("#hero-moon")?.click(), delay);
        }
        say("three stars, for luck.", { mark: "✦" });
      },
    },
    {
      id: "fun:achievements",
      group: "suzu",
      label: "achievements",
      hint: "things you found in the dark",
      run: openShelf,
    },
    {
      id: "fun:console",
      group: "suzu",
      label: "open suzu's console",
      hint: "type help",
      run: () => {
        goTo("#suzu-console");
        window.setTimeout(() => $("#console-input")?.focus(), 220);
      },
    },
    {
      id: "link:github",
      group: "links",
      label: "github.com/etokiyra",
      hint: "opens in a new tab",
      run: () => window.open("https://github.com/etokiyra", "_blank", "noopener"),
    },
    {
      id: "link:repos",
      group: "links",
      label: "all repositories",
      hint: "everything public",
      run: () => window.open("https://github.com/etokiyra?tab=repositories", "_blank", "noopener"),
    },
    {
      id: "link:source",
      group: "links",
      label: "site source",
      hint: "the html, the css, the cat",
      run: () => {
        unlock("read-the-source");
        window.open("https://github.com/etokiyra/etokiyra.github.io", "_blank", "noopener");
      },
    },
  ];

  const rebuildCommands = () => {
    const map = new Map(baseCommands().map((entry) => [entry.id, entry]));
    for (const entry of palette.extra) map.set(entry.id, entry);
    palette.commands = Array.from(map.values());
  };

  palette.extra = [];

  const addRepos = (data) => {
    const repos = [...(data.featured || []), ...(data.others || [])];
    palette.extra = repos.map((repo) => ({
      id: `repo:${repo.name}`,
      group: "repositories",
      label: repo.name,
      hint: repo.description || "no description. the mystery is the feature.",
      run: () => window.open(repo.url, "_blank", "noopener"),
    }));
    rebuildCommands();
  };

  const normalize = (text) =>
    String(text)
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "");

  const matches = (entry, query) => {
    if (!query) return true;
    const haystack = normalize(`${entry.label} ${entry.hint} ${entry.group}`);
    return query.split(/\s+/).every((word) => haystack.includes(word));
  };

  const setActive = (index, { scroll = false } = {}) => {
    const items = palette.list ? Array.from(palette.list.children) : [];
    if (!items.length) {
      palette.active = 0;
      return;
    }
    palette.active = Math.max(0, Math.min(index, items.length - 1));
    items.forEach((item, position) => {
      const active = position === palette.active;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-selected", String(active));
    });
    if (scroll) items[palette.active].scrollIntoView({ block: "nearest" });
  };

  const paint = () => {
    const { list, empty: emptyNode, input } = palette;
    if (!list) return;

    const query = normalize(input?.value.trim() || "");
    const results = palette.commands.filter((entry) => matches(entry, query));
    palette.active = Math.min(palette.active, Math.max(0, results.length - 1));

    list.replaceChildren();
    if (emptyNode) emptyNode.hidden = results.length > 0;

    results.forEach((entry, index) => {
      const item = document.createElement("li");
      item.className = "palette-item";
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", String(index === palette.active));

      const button = document.createElement("button");
      button.type = "button";
      button.className = "palette-item-button";
      button.dataset.index = String(index);

      const group = document.createElement("span");
      group.className = "palette-item-group";
      group.textContent = entry.group;

      const label = document.createElement("span");
      label.className = "palette-item-label";
      label.textContent = entry.label;

      const hint = document.createElement("span");
      hint.className = "palette-item-hint";
      hint.textContent = entry.hint;

      button.append(group, label, hint);
      item.append(button);

      button.addEventListener("pointerenter", () => setActive(index));
      button.addEventListener("click", () => execute(entry));

      list.append(item);
    });

    setActive(palette.active);
    palette.results = results;
  };

  const execute = (entry) => {
    if (!entry) return;
    closePalette();
    window.setTimeout(() => {
      try {
        entry.run();
      } catch {
        say("that command tripped over its own tail.", { mark: "!" });
      }
    }, 60);
  };

  const openPalette = () => {
    if (!palette.root || !palette.input) return;
    palette.previousFocus = document.activeElement;
    palette.active = 0;
    palette.input.value = "";
    palette.root.hidden = false;
    document.documentElement.classList.add("palette-open");
    palette.input.setAttribute("aria-expanded", "true");
    paint();
    palette.input.focus();
    unlock("palette");
  };

  const closePalette = () => {
    if (!palette.root) return;
    palette.root.hidden = true;
    document.documentElement.classList.remove("palette-open");
    palette.input?.setAttribute("aria-expanded", "false");
    if (palette.previousFocus instanceof HTMLElement) palette.previousFocus.focus();
  };

  const initPalette = () => {
    palette.root = $("#palette");
    palette.input = $("#palette-input");
    palette.list = $("#palette-results");
    palette.empty = $("#palette-empty");
    if (!palette.root || !palette.input || !palette.list) return;

    palette.extra = [];
    rebuildCommands();

    $("#palette-open")?.addEventListener("click", openPalette);
    $("[data-palette-close]")?.addEventListener("click", closePalette);

    $("#palette-form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      execute(palette.results?.[palette.active]);
    });

    palette.input.addEventListener("input", () => {
      palette.active = 0;
      paint();
    });

    palette.input.addEventListener("keydown", (event) => {
      const results = palette.results || [];
      if (event.key === "ArrowDown") {
        event.preventDefault();
        palette.active = results.length ? (palette.active + 1) % results.length : 0;
        setActive(palette.active, { scroll: true });
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        palette.active = results.length ? (palette.active - 1 + results.length) % results.length : 0;
        setActive(palette.active, { scroll: true });
      } else if (event.key === "Home") {
        event.preventDefault();
        palette.active = 0;
        setActive(palette.active, { scroll: true });
      } else if (event.key === "End") {
        event.preventDefault();
        palette.active = Math.max(0, results.length - 1);
        setActive(palette.active, { scroll: true });
      }
    });

    document.addEventListener("keydown", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const typing = target?.closest("input, textarea, select, [contenteditable]");
      const key = event.key.toLowerCase();

      if (event.key === "Tab" && !palette.root.hidden) {
        const focusable = [
          palette.input,
          ...palette.list.querySelectorAll("button:not(:disabled)"),
        ];
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
        return;
      }

      if ((event.metaKey || event.ctrlKey) && key === "k") {
        event.preventDefault();
        if (palette.root.hidden) openPalette();
        else closePalette();
        return;
      }

      if (event.key === "Escape" && !palette.root.hidden) {
        event.preventDefault();
        closePalette();
        return;
      }

      if (!typing && (event.key === ":" || event.key === "/")) {
        event.preventDefault();
        openPalette();
      }
    });

    window.addEventListener("kiyra:data", (event) => {
      if (event.detail) addRepos(event.detail);
    });
  };

  /* ------------------------------------------------------------------ *
   *  Rituals the old site already had, now with a receipt               *
   * ------------------------------------------------------------------ */

  const initRituals = () => {
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
    let typed = "";

    document.addEventListener("keydown", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest("input, textarea, select, [contenteditable]")) return;
      const key = event.key.toLowerCase();

      progress = key === konami[progress] ? progress + 1 : key === konami[0] ? 1 : 0;
      if (progress === konami.length) {
        progress = 0;
        unlock("the-old-code");
      }

      if (!/^[a-z]$/i.test(event.key)) return;
      typed = (typed + key).slice(-4);
      if (typed === "meow") {
        typed = "";
        unlock("fluent-in-cat");
      }
    });

    $("#hero-moon")?.addEventListener("click", () => unlock("moonstruck"));
    $("#random-project")?.addEventListener("click", randomProject);
    $("#copy-email")?.addEventListener("click", copyEmail);
  };

  /* ------------------------------------------------------------------ *
   *  Boot                                                               *
   * ------------------------------------------------------------------ */

  const boot = () => {
    initShelf();
    initButton();
    initPalette();
    initRituals();
    check();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
