# kiyra — little worlds for the terminal

The source for [etokiyra.github.io](https://etokiyra.github.io/): a single-page
personal site for **kiyra** (`etokiyra`), built around a midnight terminal
bedroom, an ASCII cat called Suzu, and four real projects.

The site is plain, hand-written HTML, CSS, and a small amount of JavaScript. There
is no build step, no package manager, no backend, no analytics, and no external
runtime requests. Fonts are system fonts; every image is stored in this repository.

## What is here

```text
.
├── .github/workflows/pages.yml   # deploy site/ with GitHub Pages
├── site/                         # the published artifact
│   ├── index.html                # the whole page
│   ├── 404.html                  # lost-in-the-terminal page
│   ├── assets/
│   │   ├── css/style.css         # all styles
│   │   ├── js/site.js            # Suzu + active nav link
│   │   ├── favicon.svg
│   │   ├── apple-touch-icon.png
│   │   └── og.png                # 1200 × 630 social card
│   ├── robots.txt
│   └── sitemap.xml
├── tools/
│   ├── og-card.html              # source for assets/og.png
│   └── icon.html                 # source for assets/apple-touch-icon.png
├── .gitignore
└── README.md
```

The site lives in `site/` so the Pages artifact contains only public website
files, not the README or workflow.

## Preview locally

From the repository root:

```sh
python3 -m http.server 8000 --directory site
```

Then open <http://localhost:8000/>. Any static file server works; there is
nothing to compile.

## Editing content

- **Page copy and project descriptions:** `site/index.html`. Each featured project
  is an `<article>` with an `id` (`koda`, `kitten`, `vynl`, `grimmoire`).
- **Colours, type, spacing, responsive rules:** the custom properties at the top of
  `site/assets/css/style.css`.
- **Suzu's messages and the active nav link:** `site/assets/js/site.js`. The page is
  fully readable and navigable with JavaScript disabled; the “pet suzu” button is
  only revealed by JavaScript.
- **Social preview:** edit `tools/og-card.html`, then regenerate `site/assets/og.png`
  at exactly 1200 × 630. In this environment:

  ```sh
  firefox --headless --no-remote --window-size=1200,630 \
    --screenshot "$PWD/site/assets/og.png" \
    "file://$PWD/tools/og-card.html"
  ```

  (The screenshot path must be absolute.) The icon uses the same method at
  180 × 180 with `tools/icon.html`.
- **Project facts:** every project description was checked against the repository
  README and metadata in October 2026. If a repository changes, re-read its README
  before editing the copy. The site deliberately does not display stars, downloads,
  or other popularity metrics.

## Deployment

The workflow in `.github/workflows/pages.yml` runs on every push to `main` and can
also be started manually with **workflow_dispatch**. It:

1. checks out the repository;
2. configures GitHub Pages;
3. uploads only `site/` as the Pages artifact;
4. deploys the artifact with the official Pages actions.

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

The site URL is <https://etokiyra.github.io/>. Do not add a `CNAME` file unless a
custom domain is actually being configured.

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
deno check site/assets/js/site.js

# Whitespace / conflict markers
git diff --check
```

Browser rendering was checked with headless Firefox at desktop, tablet, and mobile
widths. Keyboard focus states, reduced-motion rules, and the no-JavaScript path
are part of the design; keep them that way when editing.

## If deployment fails

- **The workflow is missing or does not run:** confirm the file is on `main` and that
  the repository's Pages source is **GitHub Actions**, not “Deploy from a branch”.
- **`Get Pages site failed` / not enabled:** open **Settings → Pages** and choose
  **GitHub Actions** once; the workflow needs Pages enabled before the deploy step.
- **Artifact is empty:** confirm `site/index.html` exists and the upload step still
  uses `path: site`.
- **Permission errors:** check that the workflow still grants `pages: write` and
  `id-token: write`, and that the job targets the `github-pages` environment.
- **The site loads without styles:** asset paths in `index.html` are relative and
  must stay under `site/assets/`. `404.html` uses root-absolute paths so it works
  from any unknown URL.
- Re-run the job from **Actions** after fixing the cause. A failed deploy never
  replaces the previously published site.

## Notes

- The page targets the root of a GitHub **user site**, not a project subpath.
  Internal links use `#fragment` and root-absolute paths where needed.
- No secrets, tokens, or environment-specific values are stored in this repository.
- Project links point only to public repositories under
  [github.com/etokiyra](https://github.com/etokiyra).

---

Made at midnight, one commit at a time.
