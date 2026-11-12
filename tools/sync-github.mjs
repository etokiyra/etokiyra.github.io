#!/usr/bin/env node
/* ==========================================================================
   sync-github.mjs — the boring part of the site, kept honest.

   Reads the public repositories of one GitHub user and writes
   site/data/projects.json. The site stays a static pile of files: no API
   calls at runtime, no rate limits for visitors, and a sensible last-known
   value if GitHub is having a day.

   Run it locally with:
     GITHUB_TOKEN=… node tools/sync-github.mjs

   The token is optional. Public data works without one; a token raises the
   rate limit and is used automatically in GitHub Actions.
   ========================================================================== */

import { readFile, rename, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const OWNER = "etokiyra";

/* Hand-picked order for the big cards. Everything else is discovered. */
const FEATURED = [
  "kemori",
  "percylang",
  "vynl",
  "grimmoire",
  "caelestia-rice",
  "opencode-config",
];

/* The profile repository and this site are not "projects". */
const SKIP = new Set(["etokiyra", "etokiyra.github.io"]);

const API = "https://api.github.com";
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
const OUT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "site",
  "data",
  "projects.json"
);

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

const headers = (authenticated) => {
  const out = {
    Accept: "application/vnd.github+json",
    "User-Agent": `${OWNER}-site-sync`,
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (authenticated && TOKEN) out.Authorization = `Bearer ${TOKEN}`;
  return out;
};

/**
 * One GET, with a gentle retry. Returns null for a missing resource so a
 * repository without releases is not treated as an error.
 */
async function api(path, { authenticated = true, attempts = 3 } = {}) {
  const url = path.startsWith("http") ? path : `${API}${path}`;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let response;
    try {
      response = await fetch(url, { headers: headers(authenticated) });
    } catch (error) {
      if (attempt === attempts) throw error;
      await sleep(600 * attempt);
      continue;
    }

    if (response.status === 404) return null;

    if (response.status === 401 || response.status === 403) {
      /* An installation token can be scoped to a single repository. Public
         data is still public, so try once more as an anonymous reader. */
      if (authenticated && TOKEN) {
        return api(path, { authenticated: false, attempts });
      }
      const remaining = response.headers.get("x-ratelimit-remaining");
      if (remaining === "0") {
        throw new Error(`GitHub rate limit reached for ${url}`);
      }
      throw new Error(`GitHub refused ${url} (${response.status})`);
    }

    if (!response.ok) {
      if (attempt === attempts) {
        throw new Error(`GitHub returned ${response.status} for ${url}`);
      }
      await sleep(600 * attempt);
      continue;
    }

    return response.json();
  }

  return null;
}

/**
 * A supplementary request (releases, commits) may fail without taking the
 * whole sync down. `undefined` means "we do not know"; the caller keeps the
 * previous value instead of replacing it with an empty list.
 */
async function safeApi(path, label) {
  try {
    return await api(path);
  } catch (error) {
    console.warn(`sync-github: skipping ${label}: ${error.message}`);
    return undefined;
  }
}

const clean = (text, limit = 320) => {
  if (!text) return "";
  const flattened = String(text)
    .replace(/\r/g, "")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (flattened.length <= limit) return flattened;
  return `${flattened.slice(0, limit).replace(/\s+\S*$/, "")}…`;
};

const firstLine = (text, limit = 160) => clean(String(text || "").split("\n")[0], limit);

const normalizeRepo = (repo) => ({
  name: repo.name,
  description: repo.description || "",
  url: repo.html_url,
  homepage: repo.homepage || "",
  language: repo.language || "",
  license: repo.license?.spdx_id && repo.license.spdx_id !== "NOASSERTION"
    ? repo.license.spdx_id
    : "",
  topics: Array.isArray(repo.topics) ? repo.topics.slice(0, 8) : [],
  defaultBranch: repo.default_branch || "main",
  fork: Boolean(repo.fork),
  archived: Boolean(repo.archived),
  createdAt: repo.created_at || "",
  pushedAt: repo.pushed_at || "",
});

const latestRelease = (release) => {
  if (!release) return null;
  return {
    tag: release.tag_name || "",
    title: release.name || release.tag_name || "",
    date: release.published_at || release.created_at || "",
    url: release.html_url || "",
    notes: clean(release.body || "", 260),
  };
};

const latestCommit = (commit) => {
  if (!commit) return null;
  return {
    sha: String(commit.sha || "").slice(0, 7),
    message: firstLine(commit.commit?.message || "", 140),
    date: commit.commit?.committer?.date || commit.commit?.author?.date || "",
    url: commit.html_url || "",
  };
};

/* Stable content comparison: a daily cron should not create a daily commit
   just to say "still true". generatedAt is metadata, not content. */
const fingerprint = (data) => {
  const { generatedAt: _ignored, ...rest } = data;
  return JSON.stringify(rest);
};

async function readExisting() {
  try {
    return JSON.parse(await readFile(OUT, "utf8"));
  } catch {
    return null;
  }
}

async function writeAtomic(data) {
  await mkdir(dirname(OUT), { recursive: true });
  const temp = `${OUT}.tmp`;
  await writeFile(temp, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  await rename(temp, OUT);
}

async function main() {
  const existing = await readExisting();
  const listPath = `/users/${OWNER}/repos?per_page=100&sort=pushed&type=owner`;

  let repos = null;
  try {
    repos = await api(listPath, { authenticated: true });
  } catch (error) {
    console.warn(`sync-github: repository list attempt failed: ${error.message}`);
  }

  /* A token scoped to this repository is fine for writing data, but the
     public user listing must still be readable. Fall back to the anonymous
     endpoint rather than giving up on a deploy. */
  if (!Array.isArray(repos) || repos.length === 0) {
    repos = await api(listPath, { authenticated: false });
  }

  if (!Array.isArray(repos) || repos.length === 0) {
    throw new Error("Could not read the repository list; keeping the old data.");
  }

  const publicRepos = repos
    .filter((repo) => !repo.fork && !repo.private && !SKIP.has(repo.name))
    .map(normalizeRepo);

  const byName = new Map(publicRepos.map((repo) => [repo.name, repo]));
  const previous = new Map(
    (Array.isArray(existing?.featured) ? existing.featured : []).map((repo) => [repo.name, repo])
  );
  const featuredNames = FEATURED.filter((name) => byName.has(name));
  const featured = [];

  for (const name of featuredNames) {
    const repo = byName.get(name);
    const old = previous.get(name);

    const [releases, commits] = await Promise.all([
      safeApi(`/repos/${OWNER}/${name}/releases?per_page=3`, `${name} releases`),
      safeApi(`/repos/${OWNER}/${name}/commits?per_page=1`, `${name} commits`),
    ]);

    const releasesOut =
      releases === undefined
        ? Array.isArray(old?.releases)
          ? old.releases
          : []
        : Array.isArray(releases)
          ? releases.slice(0, 3).map(latestRelease).filter(Boolean)
          : [];

    const commitOut =
      commits === undefined
        ? old?.latestCommit ?? null
        : Array.isArray(commits)
          ? latestCommit(commits[0])
          : null;

    featured.push({
      ...repo,
      latestRelease: releasesOut[0] || null,
      releases: releasesOut,
      latestCommit: commitOut,
    });
  }

  const featuredSet = new Set(featuredNames);
  const others = publicRepos
    .filter((repo) => !featuredSet.has(repo.name))
    .sort((a, b) => String(b.pushedAt).localeCompare(String(a.pushedAt)));

  const activity = [];
  for (const repo of featured) {
    for (const release of repo.releases.slice(0, 2)) {
      activity.push({
        type: "release",
        repo: repo.name,
        title: release.title || release.tag,
        tag: release.tag,
        date: release.date,
        url: release.url,
        summary: release.notes,
      });
    }
    if (repo.latestCommit) {
      activity.push({
        type: "commit",
        repo: repo.name,
        title: repo.latestCommit.message,
        tag: repo.latestCommit.sha,
        date: repo.latestCommit.date,
        url: repo.latestCommit.url,
        summary: "",
      });
    }
  }

  activity.sort((a, b) => String(b.date).localeCompare(String(a.date)));

  const spotlight = featured
    .filter((repo) => !repo.archived)
    .sort((a, b) => String(b.pushedAt).localeCompare(String(a.pushedAt)))[0];

  const data = {
    owner: OWNER,
    generatedAt: new Date().toISOString(),
    source: `https://github.com/${OWNER}`,
    spotlight: spotlight
      ? { name: spotlight.name, description: spotlight.description, url: spotlight.url }
      : null,
    featured,
    others,
    activity: activity.slice(0, 12),
  };

  if (existing && fingerprint(existing) === fingerprint(data)) {
    console.log("Project data already current; nothing to write.");
    return;
  }

  await writeAtomic(data);
  console.log(
    `Wrote ${OUT}: ${featured.length} featured, ${others.length} other, ` +
      `${data.activity.length} activity entries.`
  );
}

main().catch((error) => {
  console.error(`sync-github: ${error.message}`);
  /* The workflow is allowed to keep the previous data and carry on. */
  process.exitCode = 1;
});
