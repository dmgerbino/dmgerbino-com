import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const writing = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),          // meta description + the summary AI engines quote
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    youtube: z.string().optional(),   // YouTube video ID for an embedded video
    sources: z
      .array(z.object({ title: z.string(), url: z.string().url() }))
      .default([]),                   // rendered as citations + schema.org citation
    draft: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    url: z.string().url().optional(),
    status: z.enum(['live', 'building', 'archived']).default('live'),
    order: z.number().default(99),
  }),
});

const research = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/research' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),          // meta description + the summary AI engines quote
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    /** Which recurring research project this edition belongs to. */
    program: z.string(),
    /** How this edition is labelled in the series, e.g. "August 2026". */
    edition: z.string(),
    /**
     * Directory under src/data/reports holding the chart bundle the
     * pipeline produced. Its meta.json is the authority on chart
     * dimensions, alt text, and source lines -- none of that is repeated
     * here, so nothing typed in frontmatter can disagree with what was
     * actually rendered.
     */
    bundle: z.string(),
    tags: z.array(z.string()).default([]),
    /**
     * A report's sources are usually its own scan outputs, which have no
     * public URL. The link is therefore optional here, unlike in `writing`
     * where a citation without one would just be a claim.
     */
    sources: z
      .array(z.object({ title: z.string(), url: z.string().url().optional() }))
      .default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { writing, projects, research };
