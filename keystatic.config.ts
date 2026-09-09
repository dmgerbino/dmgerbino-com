import { config, collection, fields } from '@keystatic/core';

export default config({
  // LOCAL mode for development. To go live, switch to GitHub mode:
  //   storage: { kind: 'github', repo: 'dmgerbino/dmgerbino-com' },
  // then run the one-time GitHub App setup Keystatic prompts you through
  // and add the generated KEYSTATIC_* env vars to Vercel.
  storage: { kind: 'local' },

  collections: {
    writing: collection({
      label: 'Writing',
      slugField: 'title',
      path: 'src/content/writing/*',
      entryLayout: 'content',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        description: fields.text({
          label: 'Description',
          description: 'One or two sentences. Used as the meta description and the summary AI engines quote.',
          multiline: true,
          validation: { isRequired: true },
        }),
        pubDate: fields.date({ label: 'Published', validation: { isRequired: true } }),
        updatedDate: fields.date({ label: 'Updated' }),
        tags: fields.array(fields.text({ label: 'Tag' }), {
          label: 'Tags',
          itemLabel: (props) => props.value,
        }),
        youtube: fields.text({
          label: 'YouTube video ID',
          description: 'Just the ID (e.g. dQw4w9WgXcQ), not the full URL.',
        }),
        sources: fields.array(
          fields.object({
            title: fields.text({ label: 'Source title' }),
            url: fields.url({ label: 'URL' }),
          }),
          { label: 'Sources / citations', itemLabel: (props) => props.fields.title.value }
        ),
        draft: fields.checkbox({ label: 'Draft', defaultValue: false }),
        content: fields.mdx({ label: 'Content' }),
      },
    }),
    research: collection({
      label: 'Research',
      // Editions are dated, so the filename is set by hand rather than
      // derived from the title: YYYY-MM-DD-short-name, not the-slugified-title.
      slugField: 'title',
      path: 'src/content/research/*',
      entryLayout: 'content',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({
          name: { label: 'Title' },
          slug: {
            label: 'Filename',
            description: 'Date first: YYYY-MM-DD-short-name. This becomes the URL.',
          },
        }),
        description: fields.text({
          label: 'Description',
          description:
            'One or two sentences. Used as the meta description and the summary AI engines quote.',
          multiline: true,
          validation: { isRequired: true },
        }),
        pubDate: fields.date({ label: 'Published', validation: { isRequired: true } }),
        updatedDate: fields.date({ label: 'Updated' }),
        program: fields.text({
          label: 'Research program',
          description:
            'Must match a program title on the /research index exactly, or this edition will not be listed under it.',
          validation: { isRequired: true },
        }),
        edition: fields.text({
          label: 'Edition',
          description: 'How this edition is labelled in the series, e.g. "August 2026".',
          validation: { isRequired: true },
        }),
        // The charts themselves are never edited here. This names the
        // bundle the pipeline produced; everything about the charts --
        // dimensions, alt text, source lines -- is read from its
        // meta.json, so nothing typed in this CMS can contradict what was
        // actually rendered.
        bundle: fields.text({
          label: 'Chart bundle',
          description:
            'Directory name under src/data/reports, matching the edition slug. Copied in from the report pipeline; the build fails if it is missing.',
          validation: { isRequired: true },
        }),
        tags: fields.array(fields.text({ label: 'Tag' }), {
          label: 'Tags',
          itemLabel: (props) => props.value,
        }),
        sources: fields.array(
          fields.object({
            title: fields.text({ label: 'Source title' }),
            url: fields.url({ label: 'URL (optional for internal datasets)' }),
          }),
          { label: 'Sources / citations', itemLabel: (props) => props.fields.title.value }
        ),
        draft: fields.checkbox({ label: 'Draft', defaultValue: false }),
        content: fields.mdx({ label: 'Content' }),
      },
    }),
    projects: collection({
      label: 'Projects',
      slugField: 'title',
      path: 'src/content/projects/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        description: fields.text({ label: 'Description', multiline: true, validation: { isRequired: true } }),
        url: fields.url({ label: 'Live URL' }),
        status: fields.select({
          label: 'Status',
          options: [
            { label: 'Live', value: 'live' },
            { label: 'Building', value: 'building' },
            { label: 'Archived', value: 'archived' },
          ],
          defaultValue: 'live',
        }),
        order: fields.integer({ label: 'Sort order', defaultValue: 99 }),
        content: fields.mdx({ label: 'Notes' }),
      },
    }),
  },
});
