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

export const collections = { writing, projects };
