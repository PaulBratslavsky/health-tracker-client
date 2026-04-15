import { Fragment } from 'react';
import { HeroBlock, type IHeroBlock } from './hero-block';
import { FeatureGridBlock, type IFeatureGridBlock } from './feature-grid-block';
import { FeedPreviewBlock, type IFeedPreviewBlock } from './feed-preview-block';
import { PremiumCalloutBlock, type IPremiumCalloutBlock } from './premium-callout-block';
import { ContentSectionBlock, type IContentSectionBlock } from './content-section-block';
import { FaqsBlock, type IFaqsBlock } from './faqs-block';

export type Block =
  | IHeroBlock
  | IFeatureGridBlock
  | IFeedPreviewBlock
  | IPremiumCalloutBlock
  | IContentSectionBlock
  | IFaqsBlock;

function renderBlock(block: Block) {
  switch (block.__component) {
    case 'blocks.hero':
      return <HeroBlock {...block} />;
    case 'blocks.feature-grid':
      return <FeatureGridBlock {...block} />;
    case 'blocks.feed-preview':
      return <FeedPreviewBlock {...block} />;
    case 'blocks.premium-callout':
      return <PremiumCalloutBlock {...block} />;
    case 'blocks.content-section':
      return <ContentSectionBlock {...block} />;
    case 'blocks.faqs':
      return <FaqsBlock {...block} />;
    default:
      return null;
  }
}

export function BlockRenderer({ blocks }: Readonly<{ blocks: Block[] }>) {
  return (
    <>
      {blocks.map((block, index) => (
        <Fragment key={`${block.__component}-${block.id}-${index}`}>
          {renderBlock(block)}
        </Fragment>
      ))}
    </>
  );
}
