/* ==========================================================================
   live.js — the part of the site GitHub keeps fresh.

   Reads site/data/projects.json (written by tools/sync-github.mjs) and
   quietly upgrades the hand-written page with real metadata, a release
   feed, and the repositories that did not earn a full card. Everything is
   an enhancement: if the file is missing or the visitor is offline, the
   page stays exactly as written.
   ========================================================================== */

(() => {
  "use strict";

  const root = document.documentElement;
  const DATA_URL = new URL("data/projects.json", document.baseURI);

  const relative = (iso) => {
    if (!iso) return "";
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return "";
    const diff = then - Date.now();
    const abs = Math.abs(diff);
    const units = [
      ["year", 31536000000],
      ["month", 2592000000],
      ["week", 604800000],
      ["day", 86400000],
      ["hour", 3600000],
      ["minute", 60000],
    ];
    const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    for (const [unit, size] of units) {
      if (abs >= size) return formatter.format(Math.round(diff / size), unit);
    }
    return "just now";
  };

  const dateLabel = (iso) => {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const external = (href, className) => {
    const link = el("a", className);
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener";
    return link;
  };

  const setText = (selector, text) => {
    const node = document.querySelector(selector);
    if (node) node.textContent = text;
  };

  const statusFor = (repo) => {
    if (repo.archived) return "archived";
    if (repo.latestRelease?.tag) return repo.latestRelease.tag;
    if (!repo.pushedAt) return "active";
    const days = (Date.now() - new Date(repo.pushedAt).getTime()) / 86400000;
    if (days < 30) return "active";
    if (days < 120) return "resting";
    return "quiet";
  };

  /* ------------------------------------------------------------------ *
   *  Featured cards                                                     *
   * ------------------------------------------------------------------ */

  const hydrateCards = (featured) => {
    for (const repo of featured) {
      const card = document.querySelector(`[data-repo="${repo.name}"]`);
      if (!card) continue;

      const language = card.querySelector("[data-repo-fact='language']");
      const license = card.querySelector("[data-repo-fact='license']");
      const status = card.querySelector("[data-repo-status]");
      const updated = card.querySelector("[data-repo-updated]");

      if (language && repo.language) language.textContent = repo.language;
      if (license && repo.license) license.textContent = repo.license;
      if (status) {
        status.textContent = statusFor(repo);
        status.dataset.state = statusFor(repo).toLowerCase().replace(/[^a-z0-9]+/g, "-");
      }
      if (updated && repo.pushedAt) {
        updated.hidden = false;
        updated.textContent = `updated ${relative(repo.pushedAt)}`;
        updated.title = dateLabel(repo.pushedAt);
      }
    }
  };

  /* ------------------------------------------------------------------ *
   *  What shipped / what moved                                          *
   * ------------------------------------------------------------------ */

  const hydrateActivity = (activity) => {
    const list = document.querySelector("#activity-list");
    const section = document.querySelector("#activity");
    if (!list || !section || !activity.length) return;

    list.replaceChildren();

    activity.slice(0, 6).forEach((item, index) => {
      const row = el("li", "activity-row is-live");
      row.style.setProperty("--i", String(index));

      const time = el("time", "activity-time", relative(item.date));
      time.dateTime = item.date;
      time.title = dateLabel(item.date);

      const link = external(item.url, "activity-link");
      const head = el("span", "activity-head");
      head.append(
        el("span", "activity-repo", item.repo),
        el("span", `activity-kind activity-kind-${item.type}`, item.type === "release" ? "release" : "commit")
      );

      const title = el("span", "activity-title", item.title || item.tag);

      link.append(head, title);

      const tail = el("span", "activity-tail");
      if (item.tag) tail.append(el("span", "activity-tag", item.tag));
      tail.append(el("span", "activity-date", dateLabel(item.date)));

      link.append(tail);
      if (item.summary) link.append(el("span", "activity-summary", item.summary));

      row.append(time, link);
      list.append(row);
    });

    section.hidden = false;
    root.classList.add("has-live-data");
  };

  /* ------------------------------------------------------------------ *
   *  The rest of the desk                                               *
   * ------------------------------------------------------------------ */

  const hydrateOthers = (others) => {
    const grid = document.querySelector("#other-repos");
    const section = document.querySelector("#others");
    const count = document.querySelector("#other-count");
    if (!grid || !section || !others.length) return;

    grid.replaceChildren();
    if (count) count.textContent = String(others.length);

    others.forEach((repo, index) => {
      const card = external(repo.url, "repo-card is-live");
      card.style.setProperty("--i", String(index));

      const top = el("span", "repo-card-top");
      top.append(el("span", "repo-name", repo.name));
      if (repo.language) top.append(el("span", "repo-lang", repo.language));

      const description = el(
        "span",
        "repo-desc",
        repo.description || "no description. the mystery is the feature."
      );

      const foot = el("span", "repo-foot");
      foot.append(el("span", "repo-updated", repo.pushedAt ? `pushed ${relative(repo.pushedAt)}` : "quiet"));
      if (repo.archived) foot.append(el("span", "repo-archived", "archived"));
      foot.append(el("span", "repo-arrow", "↗"));

      card.append(top, description, foot);
      grid.append(card);
    });

    section.hidden = false;
  };

  /* ------------------------------------------------------------------ *
   *  Small live facts                                                   *
   * ------------------------------------------------------------------ */

  const hydrateFacts = (data) => {
    const repos = [...(data.featured || []), ...(data.others || [])];
    const languages = new Set(repos.map((repo) => repo.language).filter(Boolean));

    setText("#stat-repos", String(repos.length));
    setText("#stat-languages", String(languages.size));

    if (data.spotlight?.name) {
      setText("#now-label", "last commit in");
      const link = document.querySelector("#now-building");
      if (link) {
        link.textContent = data.spotlight.name;
        link.href = data.spotlight.url;
        link.target = "_blank";
        link.rel = "noopener";
      }

      const spotlight = repos.find((repo) => repo.name === data.spotlight.name);
      if (spotlight?.pushedAt) {
        const stat = document.querySelector("#stat-updated");
        if (stat) {
          stat.textContent = relative(spotlight.pushedAt);
          stat.title = dateLabel(spotlight.pushedAt);
          stat.classList.remove("is-updated");
          void stat.offsetWidth;
          stat.classList.add("is-updated");
        }
      }
    }

    const stamp = document.querySelector("#data-stamp");
    if (stamp && data.generatedAt) {
      stamp.textContent = `project data · ${relative(data.generatedAt)}`;
      stamp.title = dateLabel(data.generatedAt);
    }

    root.dataset.synced = data.generatedAt || "";
  };

  /* ------------------------------------------------------------------ *
   *  Boot                                                               *
   * ------------------------------------------------------------------ */

  const boot = async () => {
    try {
      const response = await fetch(DATA_URL, { cache: "no-cache" });
      if (!response.ok) return;
      const data = await response.json();

      hydrateCards(Array.isArray(data.featured) ? data.featured : []);
      hydrateActivity(Array.isArray(data.activity) ? data.activity : []);
      hydrateOthers(Array.isArray(data.others) ? data.others : []);
      hydrateFacts(data);

      window.dispatchEvent(new CustomEvent("kiyra:data", { detail: data }));
    } catch {
      /* Offline, or the file is not there yet. The page is still the page. */
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
