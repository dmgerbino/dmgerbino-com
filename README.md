# dmgerbino.com

Static Astro site + Keystatic (git-backed visual CMS), deployed on Vercel.
Every public page is prerendered HTML with the GEO layer baked into templates.

## Stack

- **Astro 5** — static output, content collections (`writing`, `notes`, `projects`)
- **Keystatic** — visual editor at `/keystatic`; commits to the repo, Vercel rebuilds
- **Vercel** — hosting + `vercel.json` redirects for old Tumblr URLs

## What's already wired in (GEO/SEO layer)

- JSON-LD on every page: `WebSite` + `Person` graph; `BlogPosting` with
  `author`, `datePublished`, `dateModified`, `wordCount`, and `citation`
  (from the `sources` frontmatter field) on posts
- Canonical URLs, Open Graph, Twitter cards
- `public/robots.txt` — explicit allow for GPTBot, OAI-SearchBot, ClaudeBot,
  PerplexityBot, Google-Extended, CCBot
- `public/llms.txt` — site summary for AI crawlers
- `sitemap-index.xml` (auto), `rss.xml`
- Semantic HTML, one `h1` per page, skip link, visible focus states
- Dark mode base `#000000` (OLED), light/dark per design tokens in
  `src/styles/global.css`
- YouTube facade component — zero third-party JS until the reader clicks play

## Local development

```bash
npm install
npm run dev        # site at localhost:4321, editor at localhost:4321/keystatic
```

Keystatic starts in **local mode**: edits write straight to files on disk.

## Going live

1. Push this repo to GitHub (e.g. `dmgerbino/dmgerbino-com`).
2. Import the repo in Vercel. Framework preset: Astro. Deploy.
3. Point dmgerbino.com DNS at Vercel.

## Switching Keystatic to GitHub mode (edit from any browser)

1. In `keystatic.config.ts`, change storage to:
   ```ts
   storage: { kind: 'github', repo: 'dmgerbino/dmgerbino-com' }
   ```
2. Deploy, then visit `https://www.dmgerbino.com/keystatic` — Keystatic walks
   you through creating its GitHub App (one time).
3. Add the env vars it generates (`KEYSTATIC_GITHUB_CLIENT_ID`,
   `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET`) to Vercel and redeploy.
4. From then on: log in at `/keystatic` from phone/tablet/Chromebook,
   edit → save → commit → auto-deploy (~60s to live).

## Publishing workflow

1. Draft by voice (Pixel Recorder → Google Doc).
2. Open `/keystatic` on any device → New entry in Writing.
3. Paste, format, fill in **description** (this is the sentence AI engines
   quote — write it as the answer), add tags and sources.
4. Save. Vercel rebuilds. Done.

## Tumblr migration (next sprint)

- Export blog XML from Tumblr settings.
- Migration script parses XML → MDX files in `src/content/writing/`
  and generates a redirect map (`/post/:id/:slug` → `/writing/:slug`,
  plus `/amp` variants) appended to `vercel.json`.

## Content model

`writing`: title, description (required — meta + AI summary), pubDate,
updatedDate, tags, youtube (video ID), sources (title+url citations), draft.
`notes`: title, pubDate, tags, draft.
`projects`: title, description, url, status, order.
