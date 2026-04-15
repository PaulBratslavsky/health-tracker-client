import { createFileRoute, redirect } from '@tanstack/react-router';
import { BlockRenderer, type Block } from '#/components/blocks/block-renderer';
import { LANDING_BLOCKS } from '#/data/landing-blocks';
import { getCurrentUser } from '#/data/server-functions/auth';
import { getPublicFeed } from '#/data/server-functions/posts';

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const me = await getCurrentUser();
    if (me) throw redirect({ to: '/feed' });
  },
  loader: async (): Promise<{ blocks: Block[] }> => {
    const previewPosts = await getPublicFeed({ data: { limit: 3 } });
    const blocks = LANDING_BLOCKS.map((block): Block =>
      block.__component === 'blocks.feed-preview'
        ? { ...block, posts: previewPosts }
        : block,
    );
    return { blocks };
  },
  component: LandingPage,
  head: () => ({
    meta: [
      { title: 'Health — track your waist-to-height ratio' },
      {
        name: 'description',
        content:
          'Health is a small social network built around waist-to-height ratio — the best cheap metric for cardiometabolic risk. Measure weekly, post, see the trend.',
      },
    ],
  }),
});

function LandingPage() {
  const { blocks } = Route.useLoaderData();
  return (
    <main>
      <BlockRenderer blocks={blocks} />
    </main>
  );
}
