/**
 * Report bundles produced by the dmarc_scanner chart pipeline.
 *
 * A bundle is a directory under src/data/reports: a meta.json describing
 * every chart, and the SVGs themselves. The PNGs live in public/research
 * instead, because they are fetched at runtime by the share control rather
 * than inlined at build time.
 *
 * Nothing here is authored by hand. meta.json is copied from the pipeline
 * unchanged, and it -- not the MDX frontmatter -- is the authority on chart
 * dimensions, alt text, and source lines.
 */

/**
 * The bundle shape this site understands.
 *
 * 1 had a single web SVG per chart. Rendering only that one puts 12px chart
 * text at 4.7px in a phone column, which breaks the text floor, so a
 * version 1 bundle is refused rather than rendered badly.
 */
export const SUPPORTED_CONTRACT = 2;

export interface ChartAsset {
  file: string;
  width: number;
  height: number;
}

export interface WebAsset extends ChartAsset {
  /** Narrowest container this canvas may be rendered in. */
  minContainer: number;
  /** Widest it should be allowed to scale to. */
  maxWidth: number;
}

export interface SocialAsset extends ChartAsset {
  bytes: number;
}

export type SocialFormat = 'square' | 'portrait' | 'landscape';

export interface Chart {
  slug: string;
  title: string;
  eyebrow: string;
  altText: string;
  descriptor: string;
  source: string;
  footnote: string;
  web: WebAsset;
  webNarrow: WebAsset;
  social: Record<SocialFormat, SocialAsset>;
}

export interface Bundle {
  contractVersion: number;
  report: string;
  slug: string;
  date: string;
  title: string;
  generatedAt: string;
  font: string;
  charts: Chart[];
}

const metaModules = import.meta.glob<Bundle>('../data/reports/*/meta.json', {
  eager: true,
  import: 'default',
});

const svgModules = import.meta.glob<string>('../data/reports/*/charts/*.svg', {
  eager: true,
  query: '?raw',
  import: 'default',
});

/** '../data/reports/<slug>/meta.json' -> '<slug>' */
function slugOf(path: string): string {
  return path.split('/data/reports/')[1]!.split('/')[0]!;
}

const bundles = new Map<string, Bundle>(
  Object.entries(metaModules).map(([path, meta]) => [slugOf(path), meta]),
);

const svgs = new Map<string, string>(
  Object.entries(svgModules).map(([path, svg]) => {
    const [, rest] = path.split('/data/reports/');
    return [rest!, svg];
  }),
);

export function getBundle(slug: string): Bundle {
  const bundle = bundles.get(slug);
  if (!bundle) {
    throw new Error(
      `No report bundle at src/data/reports/${slug}. ` +
        `Found: ${[...bundles.keys()].join(', ') || 'none'}`,
    );
  }
  if (bundle.contractVersion !== SUPPORTED_CONTRACT) {
    throw new Error(
      `Bundle ${slug} declares contractVersion ${bundle.contractVersion}, ` +
        `this site reads ${SUPPORTED_CONTRACT}. Rebuild it, or update ` +
        `src/lib/bundle.ts to handle the new shape.`,
    );
  }
  return bundle;
}

export function getChart(bundleSlug: string, chartSlug: string): Chart {
  const bundle = getBundle(bundleSlug);
  const chart = bundle.charts.find((c) => c.slug === chartSlug);
  if (!chart) {
    throw new Error(
      `Bundle ${bundleSlug} has no chart "${chartSlug}". ` +
        `It has: ${bundle.charts.map((c) => c.slug).join(', ')}`,
    );
  }
  return chart;
}

/**
 * The SVG markup itself, inlined rather than linked so its text stays real
 * text: selectable, readable by a screen reader, and quotable by an answer
 * engine. An <img> would make all three impossible.
 */
export function chartSvg(bundleSlug: string, file: string): string {
  const svg = svgs.get(`${bundleSlug}/${file}`);
  if (!svg) {
    throw new Error(`Bundle ${bundleSlug} is missing ${file}`);
  }
  return svg;
}

/** Where the share control fetches a social export from. */
export function socialUrl(bundleSlug: string, asset: SocialAsset): string {
  return `/research/${bundleSlug}/${asset.file}`;
}
