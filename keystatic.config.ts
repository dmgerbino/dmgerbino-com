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
    notes: collection({
      label: 'Notes',
      slugField: 'title',
      path: 'src/content/notes/*',
      entryLayout: 'content',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        pubDate: fields.date({ label: 'Published', validation: { isRequired: true } }),
        tags: fields.array(fields.text({ label: 'Tag' }), {
          label: 'Tags',
          itemLabel: (props) => props.value,
        }),
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
