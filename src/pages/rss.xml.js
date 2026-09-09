import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = (await getCollection('writing', ({ data }) => !data.draft)).map((post) => ({
    title: post.data.title,
    description: post.data.description,
    pubDate: post.data.pubDate,
    link: `/writing/${post.id}`,
  }));

  // Research editions belong in the feed for the same reason essays do:
  // a published report is the thing a subscriber is subscribed for.
  const reports = (await getCollection('research', ({ data }) => !data.draft)).map((report) => ({
    title: `${report.data.title} — ${report.data.edition}`,
    description: report.data.description,
    pubDate: report.data.pubDate,
    link: `/research/${report.id}`,
    categories: ['Research'],
  }));

  const items = [...posts, ...reports].sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());

  return rss({
    title: 'David Gerbino',
    description:
      'Fintech data products and research: essays on banking data, DMARC, GEO, SEO, and building with AI.',
    site: context.site,
    items,
  });
}
