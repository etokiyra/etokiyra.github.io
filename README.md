# kiyra — little worlds for the terminal

The source for [kiyra.lol](https://kiyra.lol/): a terminal-native dev
portfolio for **kiyra** (`etokiyra`). The page is structured like a portfolio —
selected work, a live GitHub signal, a profile, a stack, notes, and an open
channel — but the details are a midnight terminal: black and grey surfaces,
white type, and red and rose accents. A star-cat called Suzu keeps real
predator hours and answers to care buttons. Suzu is drawn in the same visual
vocabulary as Kemori's familiar (`/\___/\`, `ω` mouth, `✦` stars, `☾` moon).

The page is a single scroll: a hero, **selected work** (a scannable index plus
four case files and two side experiments), a **signal** section fed live by
GitHub, **about** (bio plus a profile card), **stack**, **notes**, and
**contact**. Section IDs are stable — `#projects`, `#signal`, `#about`,
`#interests`, `#notes`, `#contact` — because the console and command palette
navigate by them.

The site is served by GitHub Pages from the `etokiyra.github.io` repository,
with `site/CNAME` pinning the custom domain.

The site is plain, hand-written HTML, CSS, and a small amount of JavaScript.
There is no framework, no package manager, no backend, and no analytics. Fonts
and images are stored in this repository. The only runtime request the page
makes is for its own generated JSON.

## What is here

```text
.
├── .github/workflows/
│   └── pages.yml                 # refresh data, then deploy site/
├── site/                         # the published artifact
│   ├── index.html                # the whole page
│   ├── 404.html                  # lost-in-the-terminal page
│   ├── lost+found/index.html     # the room that is not on the map
│   ├── CNAME                     # pins kiyra.lol as the Pages domain
│   ├── data/
│   │   └── projects.json         # generated from the public GitHub API
│   ├── assets/
│   │   ├── css/style.css         # all styles
│   │   ├── js/site.js            # Suzu, her console, nav, clock, and effects
│   │   ├── js/live.js            # hydrates cards from data/projects.json
│   │   ├── js/extra.js           # command palette, achievements, small eggs
│   │   ├── js/polish.js          # header state, pointer light, scroll polish
│   │   ├── fonts/
│   │   │   ├── jetbrains-mono-latin-wght-normal.woff2
│   │   │   ├── inter-latin-wght-normal.woff2
│   │   │   ├── OFL.txt
│   │   │   └── INTER-OFL.txt
│   │   ├── favicon.svg
│   │   ├── apple-touch-icon.png
│   │   └── og.png                # 1200 × 630 social card
│   ├── robots.txt
│   └── sitemap.xml
├── tools/
│   ├── sync-github.mjs           # the GitHub → projects.json generator
│   ├── og-card.html              # source for assets/og.png
│   └── icon.html                 # source for assets/apple-touch-icon.png
├── .gitignore
└── README.md
```

The site lives in `site/` so the Pages artifact contains only public website
files, not the README or workflows.

## Auto-updating project data

The prose is still hand-written. The facts are not.

`tools/sync-github.mjs` reads the public repositories of `etokiyra` and writes
`site/data/projects.json`. It fetches:

- repository names, descriptions, languages, licences, topics and last push;
- the latest releases and the latest commit for each featured repository;
- every other public, non-fork repository, for the auto-listed desk;
- a spotlight repository: the featured one pushed most recently.

`site/assets/js/live.js` then quietly upgrades the page:

- project cards get live language, licence, status and “updated … ago”;
- **recently shipped** lists the newest releases and commits;
- **the rest of the desk** lists repositories that do not have a full card;
- the hero footnote points at the repository with the newest commit;
- the footer shows how fresh the project data is.

The JSON is committed, so the site stays static and fast, visitors never hit
the GitHub API, and the page works offline and with JavaScript disabled. The
deploy workflow refreshes that file inside the build workspace before it
uploads the artifact, so the published site is always newer than or equal to
the committed copy. The committed file is the local-preview copy and the
fallback when GitHub is unavailable.

### When it runs

`.github/workflows/pages.yml` runs on three triggers:

- every push to `main`;
- **every hour at :17 UTC** (so project repositories update without a site
  commit);
- manual dispatch, or a `repository_dispatch` with type `project-updated`.

Before uploading the artifact it runs `tools/sync-github.mjs`. If GitHub is
unavailable or the API is rate-limited, the step is allowed to fail and the
last committed data is deployed. Nothing about a deploy depends on the sync
succeeding.

The default `GITHUB_TOKEN` is enough for public data. If API rate limits become
a problem (or you ever add private repositories), add a personal token as a
repository secret and pass it as `GITHUB_TOKEN`; the script already reads it
from the environment.

### Instant updates from project repositories

The hourly sync is enough for most days. For an update the moment a project
repository is pushed, add this tiny workflow to that repository
(`.github/workflows/notify-site.yml`):

```yaml
name: Notify kiyra.lol

on:
  push:
  release:
    types: [published]

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - name: Send a repository dispatch
        run: |
          curl -sS -X POST \
            -H "Authorization: Bearer ${{ secrets.KIYRA_SITE_TOKEN }}" \
            -H "Accept: application/vnd.github+json" \
            https://api.github.com/repos/etokiyra/etokiyra.github.io/dispatches \
            -d '{"event_type":"project-updated"}'
```

Create a fine-grained personal access token with **Contents: write** on
`etokiyra/etokiyra.github.io`, store it as `KIYRA_SITE_TOKEN` in the project
repository. The site's deploy workflow will run immediately. This is
optional; without it, the hourly schedule still picks the change up.

### Running it locally

With Node 18+:

```sh
GITHUB_TOKEN=… node tools/sync-github.mjs
```

Or with Deno, which is enough in this repository:

```sh
deno run -A tools/sync-github.mjs
```

The token is optional. Without one, public data still works under GitHub's
anonymous rate limit.

To change which repositories get full cards, edit `FEATURED` at the top of
`tools/sync-github.mjs`. New public repositories appear under **the rest of the
desk** automatically. The site deliberately does not show stars, downloads, or
other popularity metrics.

## Interactive bits

The page is still a single static file, but it plays back:

- **Suzu keeps a crepuscular cat's schedule** on the visitor's local clock:
  hunting at midnight, dawn zoomies, a morning nap, sunbathing at noon,
  loafing through the afternoon, playing at dusk, grooming in the evening,
  and dozing before the hunt resumes. Each state has its own faces, tail
  speed, idle particles, status lines and arrival announcements, and the
  active slot is re-checked every minute and on tab return.
- **Care is buttons, not commands.** A row beside her — pet, feed, play,
  groom, laser — each with a stack of random outcomes and its own animation
  (hearts, a treat fish, a dangling toy, a laser dot). Nothing depletes:
  this is deliberately the good half of a tamagotchi, permanently online.
  The pet count persists in `localStorage` and unlocks milestone messages.
- **Suzu's console** lives inside the hero terminal window for talking and
  navigation: `help`, `whoami`, `ls`, `cat <name>`, `open <name>` (jumps to a
  section), `talk <anything>` (topic-aware dialogue), `ask` (cat 8-ball),
  `meow`, `moon` (shooting star), `lights` (warm lamp overlay), `mood`,
  `stats`, `achievements`, `schedule`, `date`, `clear`, `exit`, command history
  (↑/↓), and a few hidden reactions (`box`, `cucumber`, `bird`, `sudo`, `rm`,
  `cat lost+found`). Care commands politely redirect to the buttons.
- **The command palette** opens with **Ctrl/⌘+K**, `:` or `/`. It jumps to
  sections and projects, opens repositories, pets Suzu, toggles the lamp, asks
  for a shooting star, and finds anything in the live repository list. Arrow
  keys move, Enter runs, Escape closes.
- **The work index** has a random case-file button for people who cannot
  choose. The contact card copies `kiyrai@proton.me` to the clipboard; the
  address is also a normal `mailto:` link.
- **Achievements** are stored in this browser under `kiyra-achievements` and
  listed behind the footer’s `achievements` button (or the console command of
  the same name). Some are easy; one requires the Konami code, one requires
  being awake at 03:00, and one is only in a room that is not on the map.
- **The moon** in the hero art triggers a shooting star when clicked; stars
  also cross the hero occasionally on their own.
- **Elsewhere:** a header that settles as you scroll, staggered scroll reveals,
  live rows that land one at a time, a pointer light that stays inside the
  cards, a reading-progress line and live clock in the header, terminal cards
  that tilt slightly under the cursor, vynl's spectrum bars that dance while
  visible, flickering braziers in Grimmoire's chapel, a soft cursor glow, and a
  small spark burst wherever you click.
- **Secrets:** the Konami code (↑↑↓↓←→←→BA) makes it rain stars; typing
  `meow` anywhere on the page (outside the console) makes Suzu answer; the
  footer has a button labelled **do not press**; and `/lost+found/` is a hidden
  room linked only from the 404 page and the console.
- **The fonts** are JetBrains Mono for terminal/display type and Inter for body
  copy, both self-hosted under the SIL Open Font License. The page looks the
  same on every OS and makes no external font request.

All of the above is decoration. With JavaScript disabled the site remains
complete: project copy, static statuses and all links are still there, while
live data, the palette, achievements and the box stay on the shelf.
`prefers-reduced-motion` turns every moving part off.

## Preview locally

From the repository root:

```sh
python3 -m http.server 8000 --directory site
```

Then open <http://localhost:8000/>. Any static file server works; there is
nothing to compile. The committed `site/data/projects.json` means the live
sections work in preview without running the sync script first.

## Editing content

- **Page copy and project descriptions:** `site/index.html`. Each featured project
  is an `<article>` with an `id` (`kemori`, `kitten`, `vynl`, `grimmoire`,
  `caelestia-rice`, `opencode-config`) and `data-repo` for the live facts.
- **Colours, type, spacing, responsive rules:** the custom properties at the top of
  `site/assets/css/style.css`.
- **Suzu's messages, her console commands, and the active nav link:**
  `site/assets/js/site.js`.
- **Live data rendering:** `site/assets/js/live.js`; the palette and
  achievements live in `site/assets/js/extra.js`.
- **Repository list and feed sources:** `tools/sync-github.mjs`. Do not hand-edit
  `site/data/projects.json`; it is regenerated.
- **The hidden room:** `site/lost+found/index.html`. It is deliberately
  `noindex` and disallowed in `robots.txt`.
- **Social preview:** edit `tools/og-card.html`, then regenerate `site/assets/og.png`
  at exactly 1200 × 630. In this environment:

  ```sh
  firefox --headless --no-remote --window-size=1200,630 \
    --screenshot "$PWD/site/assets/og.png" \
    "file://$PWD/tools/og-card.html"
  ```

  (The screenshot path must be absolute.) The icon uses the same method at
  180 × 180 with `tools/icon.html`.
- **Project facts:** the hand-written descriptions were checked against the
  repository READMEs. The metadata is refreshed automatically; if a repository
  changes direction, re-read its README before editing the prose.

## Deployment

`.github/workflows/pages.yml` runs on every push to `main`, on an hourly
schedule, on manual **workflow_dispatch**, and on a `repository_dispatch` with
type `project-updated`. It:

1. checks out the repository;
2. configures GitHub Pages;
3. refreshes `site/data/projects.json` (non-blocking if the API is unavailable);
4. uploads only `site/` as the Pages artifact;
5. deploys the artifact with the official Pages actions.

Permissions are limited to `contents: read`, `pages: write`, and `id-token: write`.

### First-time repository setup

The repository must be named **`etokiyra.github.io`** to publish at the clean root
URL. It must be public for GitHub Pages on a free account.

1. Create the repository on GitHub (do not add a README, licence, or `.gitignore`
   remotely if this local history will be pushed).
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Push `main`:

   ```sh
   git remote add origin git@github.com:etokiyra/etokiyra.github.io.git
   git push -u origin main
   ```

5. Watch the run under **Actions → Deploy to GitHub Pages**. The deployment URL is
   also shown in the `github-pages` environment.

The site is served at <https://kiyra.lol/>. `site/CNAME` contains the custom
domain so Pages keeps serving it; DNS must point `kiyra.lol` at the Pages
servers (an apex `A`/`AAAA`/`ALIAS` record set or a `www` CNAME, per GitHub's
docs). HTTPS can be enforced once the domain verifies in
**Settings → Pages**.

## Verification

Checks that can be run without installing a toolchain:

```sh
# HTML (W3C Nu validator, requires network)
curl -sS -H 'Content-Type: text/html; charset=utf-8' \
  --data-binary @site/index.html \
  'https://validator.w3.org/nu/?out=json'

# CSS (W3C CSS validator; upload the file)
curl -sS -F 'file=@site/assets/css/style.css' \
  -F 'output=json' \
  'https://jigsaw.w3.org/css-validator/validator'

# JavaScript syntax/runtime check (Deno is optional)
deno check site/assets/js/site.js site/assets/js/live.js \
  site/assets/js/extra.js site/assets/js/polish.js tools/sync-github.mjs

# Data generator smoke test (writes only when something changed)
deno run -A tools/sync-github.mjs

# Whitespace / conflict markers
git diff --check
```

Browser rendering was checked with headless Firefox at desktop, tablet, and mobile
widths. Keyboard focus states, reduced-motion rules, the command palette, and the
no-JavaScript path are part of the design; keep them that way when editing.

## If deployment fails

- **The workflow is missing or does not run:** confirm the file is on `main` and that
  the repository's Pages source is **GitHub Actions**, not “Deploy from a branch”.
- **`Get Pages site failed` / not enabled:** open **Settings → Pages** and choose
  **GitHub Actions** once; the workflow needs Pages enabled before the deploy step.
- **Artifact is empty:** confirm `site/index.html` exists and the upload step still
  uses `path: site`.
- **Permission errors:** check that the workflow still grants `pages: write` and
  `id-token: write`, and that the job targets the `github-pages` environment.
- **The scheduled deploy does not run:** GitHub disables scheduled workflows
  after a long period without repository activity. Run the workflow manually
  once, or push any commit; the hourly schedule resumes.
- **The live sections are empty:** run `node tools/sync-github.mjs` locally and
  check `site/data/projects.json`; if the file is valid, the issue is usually a
  stale cache or a missing `data/` upload.
- **The site loads without styles:** asset paths in `index.html` are relative and
  must stay under `site/assets/`. `404.html` and `lost+found/index.html` use
  root-absolute paths so they work from any unknown URL.
- Re-run the job from **Actions** after fixing the cause. A failed deploy never
  replaces the previously published site.

## Notes

- The page targets the root of a GitHub **user site**, not a project subpath.
  Internal links use `#fragment` and root-absolute paths where needed.
- No secrets, tokens, or environment-specific values are stored in this repository.
- Project links point only to public repositories under
  [github.com/etokiyra](https://github.com/etokiyra).
- The public contact address is **kiyrai@proton.me**. The site uses a `mailto:`
  link and a copy-to-clipboard button; there is no form and no tracking.
- The only browser storage is a handful of `localStorage` keys: `suzu-*` for the
  cat, `kiyra-achievements` for the shelf, and `kiyra-button-presses` for the
  button that asked for none of this.

---

Made at midnight, one commit at a time.
