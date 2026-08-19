# dmgerbino.com

Astro 7 (static output) + Keystatic + Vercel. Git remote
`dmgerbino/dmgerbino-com`, default branch `master`. Vercel deploys from
`master`, so publishing is whatever gets merged there.

## The design rule that governs everything

From `src/styles/global.css`: **sans for interface, serif for what David
wrote, mono for data.** A page the reader enters to read is serif. Controls,
navigation, and labels are sans. Numbers are mono, usually with
`font-variant-numeric: tabular-nums`.

Dark mode's base is `#000000` — OLED pixels off, a hard requirement. In dark
mode elevation is expressed as borders, never shadows (`--elev-1: none`).

Themes are stamped, not inferred: an inline script in `Base.astro` sets
`data-theme="light"` or `data-theme="dark"` on `<html>` before paint, so
there is no unstamped state to design around. Tokens live under
`[data-theme='light']` and `[data-theme='dark']`.

The reading measure is `--measure: 42rem`. Report pages widen the outer band
to 57rem and keep prose at 42rem inside it; see below for why that number is
not adjustable by taste.

## Content collections

Three, all `glob` + zod in `src/content.config.ts`:

| Collection | Path | Route |
|---|---|---|
| `writing` | `src/content/writing/*.mdx` | `/writing/<slug>` |
| `projects` | `src/content/projects/*.mdx` | rendered on `/projects` |
| `research` | `src/content/research/*.mdx` | `/research/<slug>` |

All three are editable in Keystatic. For `research`, only the prose fields
are: the charts are never authored here.

## Research reports and the chart bundle contract

A report's charts are **not** made in this repo. They are built by the
`dmarc_scanner` project's pipeline (`~/dmarc_scanner/viz/`) and copied in as
a bundle. This repo renders what it is given and checks that it understands
the shape.

**No editions are published yet.** `src/content/research/` holds only a
`.gitkeep`, so `/research` shows the program list with status lines and no
edition links, and no report pages are generated. That is the correct state,
not a broken one — the machinery below is finished and tested, waiting on a
bundle.

### What arrives

```
src/data/reports/<slug>/
    meta.json                      the manifest, and the authority
    charts/<chart>.svg             wide in-page canvas, 880px
    charts/<chart>-narrow.svg      narrow in-page canvas, 380px
public/research/<slug>/social/
    <chart>-{square,portrait,landscape}.png
src/styles/chart-theme.css         the --chart-* tokens the SVGs reference
```

Copy it with the publisher rather than by hand:

```bash
node ~/dmarc_scanner/viz/publish.mjs --target ~/dmgerbino --dry-run
node ~/dmarc_scanner/viz/publish.mjs --target ~/dmgerbino
```

It refuses to overwrite a published edition without `--force`, refuses an
incomplete bundle, and refuses a contract mismatch.

### The contract

`meta.json` carries `contractVersion`. `src/lib/bundle.ts` declares
`SUPPORTED_CONTRACT`, currently **2**, and `getBundle()` throws when they
disagree. The publisher reads that same constant out of the source, so the
two projects cannot drift apart silently.

Version 1 had a single web SVG per chart. Rendering only that one puts 12px
chart text at 4.7px in a phone column, which breaks the text floor — so a
version 1 bundle is refused rather than rendered badly.

**`meta.json` is the authority**, not the MDX frontmatter. Chart dimensions,
alt text, source lines, and the footnote markers all come from it.
Frontmatter names the bundle and nothing more, so nothing typed in Keystatic
can contradict what was actually rendered.

### Rules for report pages that are not preferences

- **Charts inline as SVG, never `<img>`.** Their text has to stay real text:
  selectable, readable by a screen reader, quotable by an answer engine, and
  themed by the page's own CSS variables.
- **Both canvases are inlined and swapped by media query at 57rem.** This is
  not responsive-image polish. The wide canvas is only valid at 1:1, which
  needs an 880px container; below that the narrow canvas takes over. Changing
  the 57rem breakpoint or the band width without changing the canvases
  silently pushes chart text under the 12px floor.
- **The share control is never hover-only.** It appears on hover, on
  `:focus-within`, and permanently under `@media (hover: none)`. Long press
  opens it on touch. Information behind hover alone is forbidden in a
  published format.
- **Chart colours come from `chart-theme.css`, not the site palette.** One
  rendered chart must look the same in the report, in an artifact, and on
  social. Do not map `--chart-*` onto `--color-*`.

### Cascade note

`article.report > *` is specificity (0,1,1). A bare `.report-figure` at
(0,1,0) loses, so the figure rule is written `article.report > .report-figure`
to escape the reading column. Anything else that needs the full band needs
the same treatment.

## Scripts

```bash
npm run dev       # localhost:4321
npm run build     # also the only real type/contract check
npm run preview   # unsupported: the Vercel adapter has no preview command
```

To serve a build locally, serve `dist/client` statically instead.

**Do not pipe the build through `tail` or `head`.** The pipe returns the
filter's exit code, not the build's, so a failing build reports success.
Redirect to a file and check `$?`:

```bash
npm run build > /tmp/build.log 2>&1; echo "exit=$?"
```

**After deleting or renaming a report, clear both content caches.** Astro
keeps a data store in two places and clearing one is not enough:

```bash
rm -rf .astro node_modules/.astro dist
```

Skip this and the build keeps trying to render an entry whose file no longer
exists, failing with `UnknownContentCollectionError` and naming a slug that
is absent from both the working tree and git.

## Conventions worth keeping

- `trailingSlash: 'never'` in the Astro config; RSS links carry one anyway,
  which is `@astrojs/rss` behaviour and predates the research work.
- Interactive behaviour is vanilla `is:inline` script, matching the theme
  toggle in `Base.astro`. React is installed but is not used for controls.
- Page-level scripts live in the layout, not the component, so they are
  emitted once rather than once per instance.
- `public/llms.txt` is maintained by hand. A published report belongs in it
  with real figures, not just a link.
- Every published report goes in the RSS feed alongside writing.

## Known fragility

`src/pages/research/index.astro` matches editions to programs by exact
title string. A report whose `program` frontmatter differs from the index
array by a single character does not error — it silently vanishes from the
listing. Either add a build-time assertion or move the program list into its
own collection.

## Writing

Follow `~/.claude/shared/writing-style-rules.md`. It applies to prose in
MDX, to UI copy, and to these docs.
