(() => {
  "use strict";

  /* ------------------------------------------------------------------ *
   *  kiyra.lol — suzu is a real cat, drawn from the reference sheet.    *
   *                                                                     *
   *  Her art comes verbatim from the cat reference: one curled body —   *
   *  the sleeping cat's — for every mood, and her face only ever swaps   *
   *  between the reference faces (o.o ^.^ O.O >.< -.- *.*). The waving   *
   *  cat's raised paw greets you when she is happy.                      *
   *                                                                     *
   *  She keeps a crepuscular predator's schedule on your local clock,   *
   *  nothing ever depletes — the good half of a tamagotchi, forever     *
   *  online — and care happens through the buttons beside her.          *
   *                                                                     *
   *  Everything here is decoration: without this file the site is       *
   *  fully readable, and every effect respects prefers-reduced-motion.  *
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
    getRaw(key) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    },
  };

  const rand = (min, max) => min + Math.random() * (max - min);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const hhmm = (date = new Date()) =>
    `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

  /* ------------------------------------------------------------------ *
   *  The reference faces — copied character for character.              *
   * ------------------------------------------------------------------ */

  const FACES = {
    awake: { face: " o.o ", mouth: " ^ " },
    happy: { face: " ^.^ ", mouth: " w " },
    surprise: { face: " O.O ", mouth: " o " },
    sly: { face: " >.< ", mouth: " ^ " },
    starry: { face: " *.* ", mouth: " ^ " },
    blink: { face: " -.- ", mouth: " ^ " },
    asleep: { face: " -.- ", mouth: " ^ " },
  };

  /* One body for every mood: the reference sleeping cat's curled body.
     Awake or asleep, only her face changes — the heart beside her never
     moves. */

  /* ------------------------------------------------------------------ *
   *  Suzu's day — a crepuscular predator's schedule, by local hour.     *
   *  `to` is exclusive; hour 24 wraps to 0.                             *
   * ------------------------------------------------------------------ */

  const SCHEDULE = [
    {
      name: "hunting",
      from: 0,
      to: 5,
      asleep: false,
      blinkEvery: [3200, 6500],
      noteEvery: [7000, 14000],
      notes: ["!", "?", "!"],
      faces: ["sly"],
      status: [
        "hunting at {t} — peak predator hours",
        "prowling the dark between keys",
        "tracking something only she can see",
        "a shadow moves. suzu moves faster.",
        "ears flat, eyes narrowed. the hunt is on.",
        "somewhere a cursor blinks. suzu hunts it.",
        "silence. then: the pounce.",
        "the midnight shift is hers alone.",
        "she has not blinked in four minutes.",
      ],
      arrives: [
        "the clock hits midnight. suzu's eyes narrow.",
        "hunting hours. she slips off the windowsill.",
      ],
      talk: [
        "suzu: quiet. something moved under the desk.",
        "suzu: the hunt is on. whisper.",
        "suzu: at this hour the terminal belongs to me.",
        "suzu: i hunt the thing that eats your commits.",
        "suzu: shh. i'm tracking it. ... it's gone.",
        "suzu: this is my favorite hour. it's dark and everything is mine.",
      ],
      sleepyReplies: [],
    },
    {
      name: "zoomies",
      from: 5,
      to: 8,
      asleep: false,
      blinkEvery: [2400, 5200],
      noteEvery: [5000, 9000],
      notes: ["♪", "!", "♪", "♪"],
      faces: ["happy"],
      status: [
        "DAWN ZOOMIES. hold on to something.",
        "three laps around the desk at {t}",
        "suzu has left her body. she is speed.",
        "the {t} hour belongs to chaos",
        "zooming past the project cards",
        "frantic, joyful, unstoppable",
        "sprint. skid. sprint. skid. repeat.",
      ],
      arrives: [
        "dawn breaks. so does suzu's impulse control.",
        "zoomies detected. secure the cables.",
      ],
      talk: [
        "suzu: THE SUN IS COMING. DID YOU SEE IT. DID YOU.",
        "suzu: no time to explain. time to run.",
        "suzu: i ran four laps. i remember none of them.",
        "suzu: zoomies first. questions never.",
        "suzu: my tail started it. i just followed.",
        "suzu: it is five in the morning and i am thriving.",
      ],
      sleepyReplies: [],
    },
    {
      name: "napping",
      from: 8,
      to: 12,
      asleep: true,
      blinkEvery: [9000, 16000],
      noteEvery: [6000, 11000],
      notes: ["z", "z", "z"],
      faces: ["asleep"],
      status: [
        "asleep at {t} — morning nap",
        "sleeping off the dawn shift",
        "the bed is warm, the world is loud",
        "dreaming of an infinite box",
        "do not disturb. this means you.",
        "paws twitching. chasing something fast.",
        "a nap earned by the zoomies of dawn",
      ],
      arrives: [
        "the dawn shift ends. suzu settles down where she stands.",
        "morning nap taken. dignity optional.",
      ],
      talk: [
        "suzu: ...zzz... (she dreams of a box with no lid)",
        "suzu: mrr... (a paw twitches toward some distant prey)",
        "suzu: (she sleeps like the compiled: fully, and with trust)",
        "suzu: ...zzz... the dream mouse is faster this time",
      ],
      sleepyReplies: [
        "suzu: ...zzz... (she dreams of a box with no lid)",
        "suzu: mrr... (a paw twitches toward some distant prey)",
        "suzu: (she sleeps like the compiled: fully, and with trust)",
        "suzu: ...zzz... the dream mouse is faster this time",
      ],
    },
    {
      name: "sunbathing",
      from: 12,
      to: 14,
      asleep: true,
      blinkEvery: [11000, 18000],
      noteEvery: [9000, 15000],
      notes: ["z", "z"],
      faces: ["asleep"],
      status: [
        "sunbathing at {t} — warmth acquired",
        "recharging in the light patch",
        "half-asleep, fully comfortable",
        "the sun is her heat lamp",
        "a purr, slowly, on loop",
        "the patch of light moved. she moved with it.",
      ],
      arrives: [
        "the light patch found the windowsill. so did suzu.",
        "sunbathing mode. the window glows warmer.",
      ],
      talk: [
        "suzu: (she stretches one paw toward the sun, sighs, keeps it there)",
        "suzu: mrrp. (translation: the warm spot is occupied. by me.)",
        "suzu: (toast mode. do not adjust.)",
      ],
      sleepyReplies: [
        "suzu: (she stretches one paw toward the sun, sighs, keeps it there)",
        "suzu: mrrp. (translation: the warm spot is occupied. by me.)",
        "suzu: (toast mode. do not adjust.)",
      ],
    },
    {
      name: "loafing",
      from: 14,
      to: 17,
      asleep: false,
      blinkEvery: [4200, 8200],
      noteEvery: [11000, 19000],
      notes: ["♪", "·", "♪"],
      faces: ["awake"],
      status: [
        "loafing. fully bread-shaped.",
        "watching you with half-closed eyes",
        "drowsy supervision in progress",
        "she is loaf. the loaf is her.",
        "slow blink. that means trust.",
        "budgeting energy for the dusk shift",
        "the loaf endures at {t}",
      ],
      arrives: [
        "suzu sits back down and pretends to be a loaf. afternoon begins.",
        "energy saved for dusk. loaf mode engaged.",
      ],
      talk: [
        "suzu: i am loaf. this is the whole message.",
        "suzu: (she watches the cursor. the cursor watches back.)",
        "suzu: ask again after my dusk nap. and my pre-dusk nap.",
        "suzu: (slow blink. you may interpret this as affection.)",
        "suzu: i'd pounce, but the loaf is at a critical stage.",
      ],
      sleepyReplies: [],
    },
    {
      name: "playing",
      from: 17,
      to: 21,
      asleep: false,
      blinkEvery: [2800, 6000],
      noteEvery: [5500, 10000],
      notes: ["♪", "!", "♪", "✦"],
      faces: ["happy", "awake"],
      status: [
        "playing at {t} — the dusk shift",
        "a bottle cap is the finest toy",
        "bouncing after dust motes",
        "the evening game is on. bring the feather.",
        "pouncing at nothing, victoriously",
        "primed for mischief at {t}",
        "she has selected you as entertainment.",
      ],
      arrives: [
        "dusk. suzu's second wind arrives like a small storm.",
        "evening shift begins. the feather is requested.",
      ],
      talk: [
        "suzu: play with me. that is an order and also a plea.",
        "suzu: the bottle cap is under the fridge. this is a tragedy.",
        "suzu: i caught the dust mote. i am undefeated.",
        "suzu: (her butt wiggles. this is the pre-pounce warning.)",
        "suzu: dusk is for games. dawn is for zoomies. night is for the hunt. noon is for toast.",
      ],
      sleepyReplies: [],
    },
    {
      name: "grooming",
      from: 21,
      to: 23,
      asleep: false,
      blinkEvery: [4600, 9000],
      noteEvery: [12000, 20000],
      notes: ["♪", "·"],
      faces: ["awake", "happy"],
      status: [
        "grooming — evening maintenance",
        "washing behind the ears",
        "reorganizing the fluff",
        "paw lick. paw lick. whisker check.",
        "winding down for the night shift",
        "presentable for the midnight hunt",
      ],
      arrives: [
        "the evening bath begins. dignity restored.",
        "grooming hour. every whisker accounted for.",
      ],
      talk: [
        "suzu: (one more patch of fluff, then the world may resume)",
        "suzu: grooming is self-care and also armor.",
        "suzu: tonight's hunt requires shine. standby.",
        "suzu: (she pauses mid-lick to judge you, then continues.)",
      ],
      sleepyReplies: [],
    },
    {
      name: "dozing",
      from: 23,
      to: 24,
      asleep: true,
      blinkEvery: [10000, 17000],
      noteEvery: [8000, 13000],
      notes: ["z", "z"],
      faces: ["asleep"],
      status: [
        "dozing off at {t}",
        "eyes heavy. the keyboard is warm.",
        "drifting... drifting...",
        "the night hunt can wait an hour",
        "pre-hunt hibernation. a known tactic.",
      ],
      arrives: [
        "suzu settles where she stands. the pre-hunt doze takes her.",
        "dozing. the midnight shift will wake her on its own.",
      ],
      talk: [
        "suzu: ...one more minute. then the hunt. (she will not get up.)",
        "suzu: zz. (translation: the prey will still be there at midnight.)",
      ],
      sleepyReplies: [
        "suzu: ...one more minute. then the hunt. (she will not get up.)",
        "suzu: zz. (translation: the prey will still be there at midnight.)",
      ],
    },
  ];

  const stateFor = (date = new Date()) => {
    const hour = date.getHours();
    return SCHEDULE.find((slot) => hour >= slot.from && hour < slot.to) || SCHEDULE[0];
  };
  const stateByName = (name) => SCHEDULE.find((slot) => slot.name === name) || null;

  /* ------------------------------------------------------------------ *
   *  Art control                                                        *
   * ------------------------------------------------------------------ */

  const art = {
    face: $("#suzu-face"),
    mouth: $("#suzu-mouth"),
    mouthRow: $("#suzu-mouth-row"),
    wave: $("#suzu-wave"),
    zz: $("#suzu-zz"),
    scene: $("#suzu-art"),
    window: $(".mascot-window"),
    status: $("#suzu-status"),
    body: $(".window-body"),
    moon: $("#hero-moon"),
  };

  let current = stateFor();
  let overrideFace = null; // {key, until}
  let consoleAPI = null;

  const setStatus = (text) => {
    if (art.status) art.status.textContent = text;
  };

  const statusFromPool = (state, pool) => {
    const text = pick(pool.length > 0 ? pool : state.status);
    return text.replace("{t}", hhmm());
  };

  const applyFace = (key) => {
    const face = FACES[key];
    if (!face) return;
    if (art.face) art.face.textContent = face.face;
    if (art.mouth) art.mouth.textContent = face.mouth;
  };

  const renderFace = () => {
    if (!art.face) return;
    if (overrideFace && Date.now() < overrideFace.until) {
      applyFace(overrideFace.key);
      return;
    }
    overrideFace = null;
    applyFace(pick(current.faces));
  };

  const flashFace = () => {
    if (!art.face || !motionOK()) return;
    art.face.classList.remove("flash");
    void art.face.offsetWidth;
    art.face.classList.add("flash");
  };

  const celebrate = (key, ms, wave = false) => {
    overrideFace = { key, until: Date.now() + ms };
    applyFace(key);
    flashFace();
    if (wave && art.wave) {
      art.wave.textContent = "/";
      window.setTimeout(() => {
        art.wave.textContent = " ";
      }, ms);
    }
  };

  const sparkles = () => {
    if (!art.window) return;
    art.window.classList.remove("is-petted");
    void art.window.offsetWidth;
    art.window.classList.add("is-petted");
  };

  const morph = () => {
    if (!art.scene || !motionOK()) return;
    art.scene.classList.remove("is-morphing");
    void art.scene.offsetWidth;
    art.scene.classList.add("is-morphing");
    window.setTimeout(() => art.scene.classList.remove("is-morphing"), 480);
  };

  /* ------------------------------------------------------------------ *
   *  Particles — zzz, hearts, notes, fish, yarn, paw, box               *
   * ------------------------------------------------------------------ */

  const spawnNote = (glyph, cls) => {
    if (!art.body || !motionOK()) return;
    const note = document.createElement("span");
    note.className = `float-note ${cls || ""}`;
    note.textContent = glyph;
    note.style.left = `${rand(38, 52).toFixed(1)}%`;
    note.style.top = `${rand(26, 38).toFixed(1)}%`;
    art.body.append(note);
    note.addEventListener("animationend", () => note.remove());
  };

  const burstHearts = (count = 3) => {
    for (let i = 0; i < count; i += 1) {
      window.setTimeout(() => spawnNote("♡", "tint-heart"), i * 220);
    }
  };

  const spawnFish = () => {
    if (!art.body || !motionOK()) return;
    const fish = document.createElement("span");
    fish.className = "fish";
    fish.textContent = "><(((\">";
    fish.style.top = `${rand(24, 34).toFixed(1)}%`;
    art.body.append(fish);
    fish.addEventListener("animationend", () => fish.remove());
  };

  const spawnYarn = () => {
    if (!art.body || !motionOK()) return;
    const yarn = document.createElement("span");
    yarn.className = "yarn";
    yarn.textContent = "(@)~~~";
    yarn.style.top = `${rand(30, 40).toFixed(1)}%`;
    art.body.append(yarn);
    yarn.addEventListener("animationend", () => yarn.remove());
  };

  const spawnLaser = () => {
    if (!art.body || !motionOK()) return;
    const dot = document.createElement("span");
    dot.className = "laser-dot";
    art.body.append(dot);
    dot.addEventListener("animationend", () => dot.remove());
  };

  const spawnPaw = () => {
    if (!art.body || !motionOK()) return;
    const paw = document.createElement("span");
    paw.className = "paw";
    paw.textContent = "  (_)  (_)\n (_)    (_)\n    .--.\n   (    )\n    `--'";
    paw.style.left = `${rand(62, 74).toFixed(1)}%`;
    paw.style.top = `${rand(18, 30).toFixed(1)}%`;
    art.body.append(paw);
    paw.addEventListener("animationend", () => paw.remove());
  };

  const BOX_CAT = "  /\\_/\\\n ( o.o )\n +-----+\n |     |\n +-----+";

  const spawnBoxCat = () => {
    if (!art.body || !motionOK()) return;
    const box = document.createElement("span");
    box.className = "box-cat";
    box.textContent = BOX_CAT;
    box.style.left = `${rand(26, 44).toFixed(1)}%`;
    box.style.top = `${rand(24, 36).toFixed(1)}%`;
    art.body.append(box);
    box.addEventListener("animationend", () => box.remove());
  };

  const footerNotes = () => {
    const holder = $(".footer-art");
    if (!holder || !motionOK()) return;
    const note = document.createElement("span");
    note.className = "float-note footer-z";
    note.textContent = pick(["z", "Z"]);
    note.style.left = `${rand(44, 58).toFixed(1)}%`;
    note.style.top = `${rand(30, 44).toFixed(1)}%`;
    holder.append(note);
    note.addEventListener("animationend", () => note.remove());
  };

  /* ------------------------------------------------------------------ *
   *  Bond, memory — the good half of the tamagotchi ledger              *
   *  Nothing decays. There is no hunger. She is a website cat; she      *
   *  is always fine. The numbers only ever go up.                       *
   * ------------------------------------------------------------------ */

  const REL_LEVELS = [
    { min: 0, name: "stranger", line: "suzu is still deciding about you" },
    { min: 5, name: "acquaintance", line: "suzu tolerates you. affectionately." },
    { min: 20, name: "friend", line: "suzu considers you a friend" },
    { min: 50, name: "best friend", line: "suzu considers you family" },
    { min: 100, name: "staff", line: "you are staff. suzu is management." },
  ];

  const ledger = {
    pets: store.get("suzu-pets"),
    fed: store.get("suzu-fed"),
    played: store.get("suzu-played"),
    groomed: store.get("suzu-groomed"),
    lasers: store.get("suzu-lasers"),
    visits: store.get("suzu-visits", 0),
    firstSeen: store.get("suzu-first-seen"),
    rel() {
      let level = REL_LEVELS[0];
      for (const entry of REL_LEVELS) if (ledger.pets >= entry.min) level = entry;
      return level;
    },
  };

  const initLedger = () => {
    const today = new Date().toDateString();
    if (!ledger.firstSeen) {
      ledger.firstSeen = Date.now();
      store.set("suzu-first-seen", ledger.firstSeen);
      ledger.visits = 1;
      store.set("suzu-visits", 1);
      store.set("suzu-last-visit", today);
      return { firstEver: true };
    }
    const lastVisit = store.getRaw("suzu-last-visit");
    let returning = false;
    if (lastVisit !== today) {
      ledger.visits += 1;
      store.set("suzu-visits", ledger.visits);
      store.set("suzu-last-visit", today);
      returning = true;
    }
    return { firstEver: false, returning };
  };

  const daysKnown = () =>
    Math.max(1, Math.ceil((Date.now() - ledger.firstSeen) / 86400000));

  const petMilestone = () => {
    const n = ledger.pets;
    if (n === 1) return "purrs. the terminal warms up.";
    if (n === 10) return "has claimed you as staff. ♡";
    if (n === 25) return "considers you family now.";
    if (n === 50) return `has been petted ${n} times. legendary.`;
    if (n === 100) return "grants you the title of co-owner. there is no co-owner.";
    if (n % 100 === 0 && n > 0) return `— ${n} pets. a bond beyond counting.`;
    if (n > 4) return `purrs ×${n}.`;
    return pick([
      "blinks slowly at you.",
      "tucks a paw over the cursor.",
      "headbutts your hand. rude, but affectionate.",
      "flops over. full trust.",
      "raises a paw to wave back.",
    ]);
  };

  /* ------------------------------------------------------------------ *
   *  Petting, waking, state changes                                     *
   * ------------------------------------------------------------------ */

  const pet = () => {
    const asleep = current.asleep;
    ledger.pets += 1;
    store.set("suzu-pets", ledger.pets);

    const message = asleep
      ? pick([
          "sleepily leans into your hand. don't stop.",
          "purrs without waking. muscle memory.",
          "mrr. (the dream-you is also petting her.)",
          "accepts pets from within the dream.",
        ])
      : petMilestone();

    setStatus(`suzu ${message}`);
    if (asleep) {
      celebrate("asleep", 1600);
    } else {
      celebrate("happy", 2400, true);
      spawnPaw();
    }
    sparkles();
    burstHearts(asleep ? 1 : 3);
    if (consoleAPI && Math.random() < 0.35) consoleAPI.note(`suzu ${message}`);
  };

  const wakeUp = (reason) => {
    if (!current.asleep) return false;
    morph();
    celebrate("surprise", 1500);
    sparkles();
    if (reason === "laser") {
      setStatus("THE DOT. SUZU IS AWAKE. THE DOT.");
      if (consoleAPI) consoleAPI.note("suzu: THE DOT.");
    } else {
      setStatus("suzu wakes. judges you. forgives you. mostly.");
    }
    window.setTimeout(renderFace, 1600);
    return true;
  };

  const applyState = (state, announce = false) => {
    const wasAsleep = current.asleep;
    current = state;
    overrideFace = null;

    if (art.zz) {
      art.zz.textContent = state.asleep ? " zZz" : "    ";
    }
    if (state.asleep !== wasAsleep) {
      morph();
    }
    if (art.mouthRow) {
      art.mouthRow.classList.toggle("is-hidden", state.asleep);
    }
    if (art.wave) art.wave.textContent = " ";
    if (art.window) {
      art.window.classList.toggle("is-sunbathing", state.name === "sunbathing");
      art.window.classList.toggle("is-breathing", state.asleep);
    }
    renderFace();
    setStatus(statusFromPool(state, state.status));

    if (announce && consoleAPI) {
      consoleAPI.note(pick(state.arrives));
      if (state.asleep && motionOK()) {
        for (let i = 0; i < 3; i += 1) window.setTimeout(() => spawnNote("z", ""), i * 300);
      }
    }
  };

  const checkSchedule = () => {
    const next = stateFor();
    if (next.name !== current.name) applyState(next, true);
  };

  /* ------------------------------------------------------------------ *
   *  Loops: blinking, idle particles, the minute hand                   *
   * ------------------------------------------------------------------ */

  const startBlinking = () => {
    const step = () => {
      const [minDelay, maxDelay] = current.blinkEvery;
      if (!document.hidden && !overrideFace) {
        if (current.asleep) {
          renderFace(); /* sleep faces drift */
        } else {
          applyFace("blink");
          window.setTimeout(() => {
            if (!overrideFace) renderFace();
          }, 170);
        }
      }
      window.setTimeout(step, rand(minDelay, maxDelay));
    };
    window.setTimeout(step, rand(2200, 5000));
  };

  const startIdleNotes = () => {
    const step = () => {
      const [minDelay, maxDelay] = current.noteEvery;
      if (!document.hidden) {
        const glyph = pick(current.notes);
        const cls =
          glyph === "!" ? "tint-gold" : glyph === "♪" ? "tint-mint" : glyph === "♡" ? "tint-heart" : "";
        spawnNote(glyph, cls);
        if (!current.asleep && Math.random() < 0.1) spawnNote("=^.^=", "tint-heart");
        if (!current.asleep && Math.random() < 0.12) burstHearts(1);
      }
      window.setTimeout(step, rand(minDelay, maxDelay));
    };
    window.setTimeout(step, rand(3000, 6000));
  };

  /* ------------------------------------------------------------------ *
   *  Care actions — buttons, not commands. Each with a stack of         *
   *  possible outcomes, because she is her own cat.                     *
   * ------------------------------------------------------------------ */

  const CARE = [
    {
      id: "pet",
      run: () => pet(),
    },
    {
      id: "feed",
      run: () => {
        ledger.fed += 1;
        store.set("suzu-fed", ledger.fed);
        spawnFish();
        const line = current.asleep
          ? pick([
              "suzu sleep-walks one paw to the treat. acceptable.",
              "she eats with 10% of her brain. the rest stays asleep.",
              "the treat vanishes. she never moved. do not ask.",
              "dream-eating counts. probably.",
            ])
          : pick([
              "the treat travels across the desk. suzu travels faster.",
              "suzu: (she is at the treat before the treat exists.)",
              "a clean catch. she pretends it was nothing.",
              "suzu: i would do anything for shrimp. and i have.",
              "she chews exactly twice. it is a whole ceremony.",
              "suzu: the bowl is 41% full again. this is a famine.",
              "the treat is gone. the memory remains.",
              "suzu: (she leads you to the bowl even though she just ate.)",
            ]);
        setStatus(line);
        if (current.asleep) {
          celebrate("asleep", 1800);
        } else {
          celebrate("happy", 2600, true);
        }
        if (!current.asleep) burstHearts(2);
        if (consoleAPI && Math.random() < 0.4) consoleAPI.note(line);
      },
    },
    {
      id: "play",
      run: () => {
        ledger.played += 1;
        store.set("suzu-played", ledger.played);
        if (current.asleep) {
          const line = pick([
            "she swats once from inside the dream. counts double in dream points.",
            "the feather passes. a paw rises, considers, declines.",
            "playing with a sleeping cat is a solo sport.",
          ]);
          setStatus(line);
          if (consoleAPI && Math.random() < 0.4) consoleAPI.note(line);
          return;
        }
        if (Math.random() < 0.4) spawnYarn();
        celebrate("surprise", 1300);
        sparkles();
        const line = pick([
          "the feather dangles. the pounce lands. the feather escapes. classic.",
          "suzu: (butt wiggle. pre-pounce. brace yourself.)",
          "she catches the invisible. victory is declared.",
          "three consecutive air-pounces. the crowd goes quiet.",
          "the yarn rolls past. she gives chase. the yarn wins.",
          "suzu: again. AGAIN. (the feather is tired. suzu is not.)",
          "a full sprint, a skid, a leap. ten out of ten. no notes.",
          "the feather is batted behind the window bar. a draw.",
        ]);
        setStatus(line);
        window.setTimeout(() => {
          celebrate("happy", 1800, true);
          burstHearts(1);
        }, 1400);
        if (consoleAPI && Math.random() < 0.4) consoleAPI.note(line);
      },
    },
    {
      id: "groom",
      run: () => {
        ledger.groomed += 1;
        store.set("suzu-groomed", ledger.groomed);
        const line = current.asleep
          ? "grooming is scheduled after the nap. the nap is scheduled after the grooming."
          : pick([
              "paw lick. paw lick. whisker check. passed.",
              "suzu: (one more patch of fluff, then the world may resume.)",
              "behind-the-ear access granted. a rare honor.",
              "the fluff is reorganized. the fluff wins anyway.",
              "suzu grooms with the focus of a type checker.",
              "every whisker accounted for. inspection passed.",
            ]);
        setStatus(line);
        if (current.asleep) {
          celebrate("asleep", 2200);
        } else {
          celebrate("happy", 2200);
        }
        if (consoleAPI && Math.random() < 0.4) consoleAPI.note(line);
      },
    },
    {
      id: "laser",
      run: () => {
        ledger.lasers += 1;
        store.set("suzu-lasers", ledger.lasers);
        spawnLaser();
        if (current.asleep) wakeUp("laser");
        else celebrate("sly", 2200);
        const line = pick([
          "suzu pounces. the dot escapes. obviously.",
          "a wall. a bookshelf. nowhere is safe. the dot remains free.",
          "she predicts the dot's path. the dot reads her prediction.",
          "the dot touches the moon. suzu follows. physics objects.",
        ]);
        window.setTimeout(() => {
          setStatus(line);
          sparkles();
          if (consoleAPI && Math.random() < 0.5) consoleAPI.note(line);
        }, 3200);
      },
    },
  ];

  const initCare = () => {
    const row = $("#care-row");
    if (!row) return;
    row.hidden = false;
    $$(".care-button", row).forEach((button) => {
      const action = CARE.find((entry) => entry.id === button.dataset.care);
      if (!action) return;
      button.addEventListener("click", () => {
        if (document.activeElement === button) button.blur();
        action.run();
      });
    });
  };

  const initSuzuBody = () => {
    const artEl = $("#suzu-art");

    if (artEl) {
      artEl.addEventListener("click", (event) => {
        if (event.target.closest("#hero-moon")) return;
        pet();
      });
    }

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) checkSchedule();
    });

    window.setInterval(checkSchedule, 60000);

    if (motionOK()) {
      window.setInterval(() => {
        if (!document.hidden && current.asleep) footerNotes();
      }, 7000);
    }
  };

  /* ------------------------------------------------------------------ *
   *  Suzu's console — for talking, not for care. Care is buttons.       *
   * ------------------------------------------------------------------ */

  const files = {
    koda: "an IDE that arrives already knowing the language. rust, built-in lsp, zero config.",
    kitten: "a small language learning to compile itself. go + c; the tool is purr, the files are .ktn.",
    vynl: "a dj booth in your terminal. fft spectrum, vinyl mode, gapless playback. no browser required.",
    grimmoire: "an ascii-first rpg in a village that survived by feeding the water. rust, all glyphs.",
    suzu: "your terminal familiar. keeps predator hours. likes: boxes, the moon, and you (probably).",
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

  const ASK_ANSWERS = [
    "suzu: the signs say yes. the whiskers say ask again after dinner.",
    "suzu: absolutely. (she is not listening.)",
    "suzu: no. but do it anyway.",
    "suzu: the answer is a box. the answer is always a box.",
    "suzu: 42, but for cats.",
    "suzu: my tail says yes. my tail says many things.",
    "suzu: ask the moon. she answers at 02:14.",
    "suzu: unlikely, but the zoomies disagree.",
    "suzu: yes, if you believe. also if you feed me. the button is right there.",
    "suzu: the compiler is always right. wait. that's the spec. both are right.",
    "suzu: it depends whether it's before or after my nap.",
    "suzu: i have seen the future. there is a warm keyboard in it.",
  ];

  const TOPICS = [
    {
      match: /\b(love|like you|cute|pretty|beautiful|good cat|best cat)\b/,
      lines: [
        "suzu: (she shows her belly. it is a trap. it is also love.)",
        "suzu: i know. the moon told me first.",
        "suzu: (headbutt. that's the highest honor available.)",
        "suzu: love is stored in the purr.",
      ],
    },
    {
      match: /\b(hungry|food|eat|treat|fish|snack|dinner|breakfast)\b/,
      lines: [
        "suzu: the feed button exists. i am not pointing at it. i am pointing at it.",
        "suzu: i ate at 06:00. that was another lifetime.",
        "suzu: feed the cat, feed the compiler. it's the same machine.",
        "suzu: (she looks at the feed button. then at you. then at the button.)",
        "suzu: i would trade three of your passwords for one shrimp.",
      ],
    },
    {
      match: /\b(night|dark|midnight|moon|star|sleep|insomnia)\b/,
      lines: [
        "suzu: the dark hours are the honest hours.",
        "suzu: the moon and i have an arrangement. she shines, i guard.",
        "suzu: midnight is when the ideas hunt you. i protect the good ones.",
        "suzu: every 02:14 is the same 02:14. that's the secret.",
      ],
    },
    {
      match: /\b(code|bug|compile|compiler|rust|golang|go\b|program|debug|type check)\b/,
      lines: [
        "suzu: a bug is just a feature that hasn't been fed.",
        "suzu: the type checker and i both reject things we don't understand.",
        "suzu: rustc is the only authority i respect.",
        "suzu: have you tried turning the specification off and on again.",
        "suzu: i sat on the keyboard once. it compiled. i have been proud since.",
      ],
    },
    {
      match: /\b(koda|kitten|vynl|grimmoire)\b/,
      lines: [
        "suzu: koda? the polite one. opens doors for languages.",
        "suzu: kitten compiles itself. i supervise. mostly i sit on the spec.",
        "suzu: vynl goes brrr correctly. 1024-point fft. i checked.",
        "suzu: grimmoire is the dark forest story. i am technically in it. as a shadow.",
        "suzu: four worlds and i live in the best one. the windowsill.",
      ],
    },
    {
      match: /\b(tired|exhausted|burn|rest|coffee)\b/,
      lines: [
        "suzu: nap. that's the whole advice. nap like the dawn shift never happened.",
        "suzu: cats sleep 16 hours a day and ship 4 projects. correlation.",
        "suzu: coffee is just bean tea that yells at you.",
        "suzu: rest is also part of the system. interface and engineering.",
      ],
    },
    {
      match: /\b(box|boxes|carton)\b/,
      lines: [
        "suzu: if it fits, i sits. this is law.",
        "suzu: a box is a room you can own in one jump.",
        "suzu: (her eyes go wide at the word alone.)",
      ],
    },
    {
      match: /\b(bird|birb|pigeon|sparrow)\b/,
      lines: [
        "suzu: ek-ek-ek-ek. (that's bird chatter. it means she cares.)",
        "suzu: one day the glass will not be there. one day.",
        "suzu: the birds know what they did.",
      ],
    },
    {
      match: /\b(music|song|dj|bpm|mix)\b/,
      lines: [
        "suzu: put on something at 126 bpm. my tail keeps the tempo.",
        "suzu: the fft spectrum is my favorite lightning.",
        "suzu: vinyl mode couples tempo and pitch. like a real turntable. like real prey.",
      ],
    },
    {
      match: /\b(who are you|your name|suzu)\b/,
      lines: [
        "suzu: suzu. terminal familiar. first of her name. keeper of the windowsill.",
        "suzu: named after the sound a small bell makes. i am not small. i am compact.",
        "suzu: i was compiled at midnight, like everything good.",
      ],
    },
    {
      match: /\b(bye|goodbye|see you|later|cya)\b/,
      lines: [
        "suzu: (she watches the door until you're gone, then grooms.)",
        "suzu: return before midnight. the hunt is better with witnesses.",
        "suzu: (slow blink. dismissed with love.)",
      ],
    },
  ];

  const GREETING = () => {
    const hour = new Date().getHours();
    const part =
      hour < 5 ? "the hunt is on" : hour < 8 ? "the zoomies just ended" :
      hour < 12 ? "you caught the nap. lucky." : hour < 14 ? "the sun is warm" :
      hour < 17 ? "the loaf is in session" : hour < 21 ? "dusk. playtime." :
      hour < 23 ? "grooming hour" : "almost midnight";
    return pick([
      `suzu: hello. ${part}.`,
      `suzu: hi. ${part}, in case you wondered.`,
      `suzu: mrrp. (${part}, naturally.)`,
      `suzu: hello again. day ${daysKnown()} of knowing you.`,
    ]);
  };

  const CARE_WORDS =
    /\b(pet|feed|treat|play|groom|laser|nap|wake|hunt)\b/;

  const initConsole = () => {
    const box = $("#suzu-console");
    const out = $("#console-out");
    const form = $("#console-form");
    const input = $("#console-input");
    if (!box || !out || !form || !input) return;

    box.hidden = false;

    const print = (text, cls = "c-out") => {
      const line = document.createElement("p");
      line.className = cls;
      line.textContent = text;
      out.append(line);
      while (out.children.length > 90) out.firstElementChild.remove();
      out.scrollTop = out.scrollHeight;
    };

    const note = (text) => print(text, "c-ok");

    const goto = (name) => {
      const sel = targets[name];
      const el = sel ? $(sel) : null;
      if (!el) return `no such place: ${name}. try: ls`;
      el.scrollIntoView({ behavior: motionOK() ? "smooth" : "auto", block: "start" });
      return pick([
        `walking you to ${name}. try to keep up.`,
        `jumping to ${name} ✦`,
        `${name}. she headbutts the link on the way.`,
      ]);
    };

    let missCount = 0;

    const asleepNote = () => {
      if (current.asleep && Math.random() < 0.6) {
        print("(suzu sleeps through your typing. the room answers.)", "c-dim");
      }
    };

    const commands = {
      help: () => {
        [
          "available commands:",
          "  help        — this list",
          "  whoami      — who is kiyra",
          "  ls          — look around",
          "  cat <name>  — read: koda, kitten, vynl, grimmoire, suzu, ~/.why",
          "  open <name> — jump to a project or section",
          "  talk <...>  — actually talk to suzu. she has opinions.",
          "  ask <...>   — ask suzu anything. answers are legally binding.",
          "  meow        — say hi in her language",
          "  moon        — make a wish",
          "  stars       — a small shower",
          "  lights      — toggle the lamp",
          "  mood        — how suzu is doing (always fine)",
          "  stats       — the friendship ledger",
          "  schedule    — suzu's day, hour by hour",
          "  date        — the time, cat-adjusted",
          "  clear       — clean the console",
          "  exit        — let suzu be",
          "",
          "  care — pet, feed, play, groom, laser — lives on the",
          "  buttons beside her. she refuses to be administered by CLI.",
        ].forEach((lineText) => print(lineText));
        return null;
      },
      whoami: () =>
        "kiyra (etokiyra) — builds compilers, terminal tools & small worlds. this page is one of them.",
      whois: () => commands.whoami(),
      ls: () => {
        asleepNote();
        return "koda/  kitten/  vynl/  grimmoire/  suzu  ~/.why";
      },
      pwd: () => {
        asleepNote();
        return "/home/kiyra/midnight";
      },
      uname: () => "midnight/1.0 kiyra.lol tty/01 — quiet, dark, keyboard-first.",
      cat: (args) => {
        const name = (args[0] || "").toLowerCase();
        if (!name) return "cat what? try: cat koda";
        const file = files[name] || files[args.join(" ")];
        if (!file) return `no such file: ${name}. try: ls`;
        asleepNote();
        print(file, "c-pink");
        return null;
      },
      open: (args) => goto((args[0] || "").toLowerCase()),
      goto: (args) => goto((args[0] || "").toLowerCase()),
      cd: (args) => goto((args[0] || "home").toLowerCase().replace(/[~/.]/g, "") || "home"),

      /* --- talking to suzu --- */
      talk: (args) => {
        const text = args.join(" ");
        if (current.asleep) return pick(current.sleepyReplies);
        if (!text) return pick(current.talk);
        if (CARE_WORDS.test(text.toLowerCase())) {
          return "suzu: that's what the buttons are for. (she gestures at them with her whole face.)";
        }
        const topic = TOPICS.find((entry) => entry.match.test(text.toLowerCase()));
        if (topic) {
          if (Math.random() < 0.35) burstHearts(1);
          return pick(topic.lines);
        }
        return pick([
          `suzu: "${text}". (she considers it. slowly.) ...valid.`,
          `suzu: "${text}" — she blinks. that's a yes.`,
          `suzu: interesting. tell me more at dusk. everything is better at dusk.`,
          `suzu: (she files "${text}" under things the tall one says.)`,
          `suzu: i've heard worse. i've also heard better. mostly worse.`,
          `suzu: (she has no idea what that means, and commits anyway.)`,
        ]);
      },
      chat: (args) => commands.talk(args),
      say: (args) => commands.talk(args),
      ask: (args) => {
        if (current.asleep) return pick(current.sleepyReplies);
        return args.length === 0
          ? "ask what? suzu answers everything. try: ask will the build pass"
          : pick(ASK_ANSWERS);
      },
      meow: () => {
        if (current.asleep) {
          if (Math.random() < 0.4) {
            wakeUp("meow");
            return "one ear rotates. suzu surfaces: mrrp? YOU MEOWED?";
          }
          return "a paw twitches. the meow was absorbed by the nap.";
        }
        celebrate(pick(["surprise", "happy"]), 1600);
        return pick([
          "suzu: meow.",
          "suzu: meow. (translation: feed the compiler.)",
          "suzu: mrrp?",
          "suzu: meow meow. (translation: the build is fine, probably.)",
          "suzu: meow. (translation: i understood none of that and agree completely.)",
          "suzu: mrow. (translation: the windowsill is excellent today.)",
          "suzu: ekek-ek. (that's not a meow. that's bird chatter. ignore it.)",
        ]);
      },
      purr: () => {
        sparkles();
        celebrate("happy", 2000);
        return "suzu purrs. the window vibrates faintly. ♡";
      },

      /* --- care is buttons now; suzu is firm about this --- */
      pet: () => "suzu: petting is a button, not a command. (she points at the buttons.)",
      feed: () => "suzu: the treat jar is wired to the feed button. CLI access denied.",
      play: () => "suzu: the feather is button-operated. union rules.",
      groom: () => "suzu: grooming is booked via the button. her calendar is full anyway.",
      laser: () => "suzu: the laser is button-activated. for safety. hers.",
      nap: () => "suzu: she schedules her own naps. look at the status line.",
      wake: () => (current.asleep ? "suzu: she heard you. she is choosing not to." : "suzu: she is already awake. mostly."),

      /* --- toys that are not care --- */
      box: () => {
        spawnBoxCat();
        return pick([
          "a box? WHERE. (it's the console. she is in it.)",
          "suzu: if it fits, i sits. she fits. she sits.",
          "the box is imaginary. the joy is real.",
        ]);
      },
      cucumber: () => {
        celebrate("surprise", 2600);
        sparkles();
        return "suzu: DO NOT. bring that. here. (she is on the ceiling.)";
      },
      bird: () => {
        if (current.asleep) return "even asleep, her ears rotate toward the word 'bird'.";
        celebrate("sly", 2000);
        return "suzu: ek-ek-ek-ek. (the glass remains undefeated.)";
      },

      /* --- scenery --- */
      moon: () => {
        shootStar();
        if (art.moon) glowMoon();
        if (!current.asleep) celebrate("starry", 2600);
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
      mood: () => {
        const rel = ledger.rel();
        return pick([
          `mood: excellent, as always. she is a website cat — nothing depletes.`,
          `mood: [♥♥♥♥♥♥♥♥♥♥] suzu is exactly as fine as she was a minute ago.`,
          `she is fine. she was fine at 02:14. she will be fine at 03:14.`,
        ]) + ` bond: ${rel.name}.`;
      },
      stats: () => {
        const rel = ledger.rel();
        [
          `✦ suzu — day ${daysKnown()} of knowing you`,
          `  pets: ${ledger.pets}   treats: ${ledger.fed}   plays: ${ledger.played}`,
          `  grooms: ${ledger.groomed}   lasers: ${ledger.lasers}   visits: ${ledger.visits}`,
          `  bond: ${rel.name} — ${rel.line}`,
          `  right now: ${current.name} (${current.asleep ? "asleep" : "awake"})`,
        ].forEach((lineText) => print(lineText, "c-ok"));
        return null;
      },
      schedule: () => {
        SCHEDULE.forEach((slot) => {
          const marker = slot === current ? "▸" : " ";
          const line = `${marker} ${String(slot.from).padStart(2, "0")}:00–${String(slot.to % 24).padStart(2, "0")}:00  ${slot.name}${slot.asleep ? " (asleep)" : ""}`;
          print(line, slot === current ? "c-ok" : "c-out");
        });
        print("crepuscular: peak hours at dawn and dusk.", "c-dim");
        return null;
      },
      day: () => commands.schedule(),
      date: () => `it is exactly ${hhmm()}. suzu's schedule: ${current.name}.`,
      time: () => commands.date(),
      clear: () => {
        out.textContent = "";
        return null;
      },
      hello: () => (current.asleep ? pick(current.sleepyReplies) : GREETING()),
      hi: () => commands.hello(),
      hey: () => commands.hello(),
      yo: () => commands.hello(),
      greetings: () => commands.hello(),
      goodmorning: () => (current.asleep ? "suzu: (it is morning for you. it is naptime for her.)" : "suzu: morning. the zoomies were historic."),
      goodnight: () => pick(["goodnight. the cursor keeps blinking.", "suzu: goodnight. i'll take it from here."]),
      goodevening: () => "suzu: evening. the best shift.",
      coffee: () => "suzu doesn't brew. she naps next to the machine while it does.",
      sudo: () => "suzu does not accept root from strangers.",
      rm: () => "nice try. suzu guards this filesystem with her life.",
      vim: () => "suzu uses koda, obviously.",
      emacs: () => "suzu uses koda, obviously.",
      nano: () => "suzu uses koda, obviously.",
      man: () => "this console has exactly one page: help.",
      name: () => "suzu. terminal familiar. first of her name. keeper of the windowsill.",
      exit: () => {
        window.setTimeout(() => input.blur(), 300);
        setStatus(statusFromPool(current, current.status));
        return pick(["suzu curls back up. zzz.", "suzu: (dismissed, with a slow blink.)"]);
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
        const misses = [
          () => "command not found. suzu suggests: help",
          (cmd) => `command not found: “${cmd}”. suzu stares at you blankly.`,
          () => "suzu has never heard that one. help exists, though. or try: talk <anything>",
        ];
        print(misses[missCount++ % misses.length](name), "c-pink");
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
    });
    input.addEventListener("blur", () => {
      window.clearTimeout(blurTimer);
      blurTimer = window.setTimeout(() => {
        if (!input.value.trim()) setStatus(statusFromPool(current, current.status));
      }, 5000);
    });

    consoleAPI = { note, print };
    applyState(stateFor(), false);

    const boot = initLedger();
    if (boot.firstEver) {
      print("✦ suzu has noticed you. (day 1)", "c-ok");
      print("type help — or just talk to her.", "c-out");
    } else if (boot.returning) {
      print(`✦ suzu remembers you. day ${daysKnown()} of knowing you.`, "c-ok");
    }
    print("✦ suzu console — type help and press enter", "c-ok");
  };

  /* ------------------------------------------------------------------ *
   *  Header: live clock + reading progress                              *
   * ------------------------------------------------------------------ */

  const initHeader = () => {
    const clock = $("#header-clock");

    const tickClock = () => {
      if (!clock) return;
      const hour = new Date().getHours();
      const label =
        hour < 5 ? "midnight hours" : hour < 8 ? "dawn shift" : hour < 17 ? "online" :
        hour < 21 ? "dusk shift" : "night hours";
      clock.textContent = `${hhmm()} · ${label}`;
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
   *  Ambience: cursor glow, click bursts, shooting stars                *
   * ------------------------------------------------------------------ */

  const glowMoon = () => {
    if (!art.moon) return;
    art.moon.classList.add("is-glowing");
    window.setTimeout(() => art.moon.classList.remove("is-glowing"), 1500);
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

  const clickBurst = (x, y) => {
    if (!motionOK()) return;
    if ($$(".click-spark").length > 40) return;

    const ring = document.createElement("span");
    ring.className = "click-ring";
    ring.style.left = `${x}px`;
    ring.style.top = `${y}px`;
    document.body.append(ring);
    ring.addEventListener("animationend", () => ring.remove());

    const main = document.createElement("span");
    main.className = "click-spark";
    main.textContent = pick(["✦", "✧"]);
    main.style.left = `${x}px`;
    main.style.top = `${y}px`;
    main.style.color = pick(["var(--lav)", "var(--pink)", "var(--gold)"]);
    main.style.setProperty("--dy", "-46px");
    main.style.setProperty("--rot", `${rand(-90, 90).toFixed(0)}deg`);
    document.body.append(main);
    main.addEventListener("animationend", () => main.remove());

    for (let i = 0; i < 3; i += 1) {
      const spark = document.createElement("span");
      spark.className = "click-spark";
      spark.textContent = pick(["✦", "✧", "·", "♡"]);
      spark.style.left = `${x}px`;
      spark.style.top = `${y}px`;
      spark.style.color = pick(["var(--lav)", "var(--pink)", "var(--mint)", "var(--gold)"]);
      spark.style.setProperty("--dx", `${rand(-34, 34).toFixed(0)}px`);
      spark.style.setProperty("--dy", `${rand(-56, -18).toFixed(0)}px`);
      spark.style.setProperty("--rot", `${rand(-120, 120).toFixed(0)}deg`);
      spark.style.animationDelay = `${i * 70}ms`;
      document.body.append(spark);
      spark.addEventListener("animationend", () => spark.remove());
    }
  };

  const initAmbience = () => {
    if (art.moon) {
      art.moon.addEventListener("click", (event) => {
        event.stopPropagation();
        glowMoon();
        shootStar();
        setStatus(`suzu watches the shooting star. (${current.name} hours)`);
        if (!current.asleep) celebrate("starry", 2600);
        window.setTimeout(() => setStatus(statusFromPool(current, current.status)), 3200);
      });
    }

    if (!motionOK()) return;

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

    document.addEventListener(
      "pointerdown",
      (event) => {
        if (event.button !== 0) return;
        clickBurst(event.clientX, event.clientY);
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
   *  Easter eggs                                                        *
   * ------------------------------------------------------------------ */

  const starRain = () => {
    if (!motionOK()) return;
    const layer = document.createElement("div");
    layer.className = "star-rain";
    layer.setAttribute("aria-hidden", "true");
    document.body.append(layer);

    const glyphs = ["✦", "✧", "·", "=^..^=", "♡", "~(=^..^)"];
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
          if (!current.asleep) celebrate("happy", 3200, true);
          burstHearts(4);
          setStatus("the stars obey you. ✦");
          if (consoleAPI) consoleAPI.note("✦ konami accepted. the stars obey you.");
        }
      }
    });

    let typed = "";
    document.addEventListener("keydown", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest("input, textarea, select")) return;
      if (!/^[a-z]$/i.test(event.key)) return;
      typed = (typed + event.key.toLowerCase()).slice(-4);
      if (typed !== "meow") return;
      typed = "";
      if (!current.asleep) celebrate("happy", 2000);
      sparkles();
      setStatus(current.asleep ? "suzu heard that. in her dream." : "suzu heard that. meow.");
      if (consoleAPI) {
        consoleAPI.note(current.asleep ? "suzu heard that. in her dream." : "suzu heard that. meow.");
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
      const headerHeight = $(".site-header")?.getBoundingClientRect().height || 0;
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
  initCare();
  initConsole();
  initHeader();
  initReveal();
  initAmbience();
  initToys();
  initEggs();
  initTyping();
  initNav();
  startBlinking();
  startIdleNotes();

  /* Hidden debug handle — only when the hash asks for it. */
  if (window.location.hash === "#suzu-debug") {
    window.__suzu = {
      setState: (name) => {
        const state = stateByName(name);
        if (state) applyState(state, true);
      },
      state: () => current.name,
      ledger: () => ({
        pets: ledger.pets,
        fed: ledger.fed,
        played: ledger.played,
        groomed: ledger.groomed,
        lasers: ledger.lasers,
        rel: ledger.rel().name,
      }),
    };
  }
})();
