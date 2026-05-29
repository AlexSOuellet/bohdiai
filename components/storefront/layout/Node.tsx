import type { Density, LayoutNode } from '@/lib/layout';
import { inheritedDensity } from './intent';
import { Band } from './primitives/Band';
import { Bleed } from './primitives/Bleed';
import { Grid } from './primitives/Grid';
import { Gutter } from './primitives/Gutter';
import { Marquee } from './primitives/Marquee';
import { Overlap } from './primitives/Overlap';
import { Pane } from './primitives/Pane';
import { Row } from './primitives/Row';
import { Split } from './primitives/Split';
import { Stack } from './primitives/Stack';
import { ButtonContent } from './content/Button';
import { CartContent } from './content/Cart';
import { CollectionGridContent } from './content/CollectionGrid';
import { ContactFormContent } from './content/ContactForm';
import { DividerContent } from './content/Divider';
import { EventsListContent } from './content/EventsList';
import { FeaturedCollectionContent } from './content/FeaturedCollection';
import { FeaturedProductContent } from './content/FeaturedProduct';
import { FeaturedSubscriptionContent } from './content/FeaturedSubscription';
import { ImageContent } from './content/Image';
import { NavLinksContent } from './content/NavLinks';
import { ProductGridContent } from './content/ProductGrid';
import { QuoteContent } from './content/Quote';
import { SocialLinksContent } from './content/SocialLinks';
import { SubscriptionGridContent } from './content/SubscriptionGrid';
import { TextContent } from './content/Text';
import { VideoContent } from './content/Video';
import { WordmarkContent } from './content/Wordmark';

export interface RenderContext {
  density?: Density;
}

export interface NodeProps {
  node: LayoutNode;
  ctx: RenderContext;
}

export function deriveCtx(node: LayoutNode, ctx: RenderContext): RenderContext {
  const density = inheritedDensity(ctx.density, node.intent);
  return density === undefined ? {} : { density };
}

export function Node({ node, ctx }: NodeProps) {
  switch (node.type) {
    case 'band':
      return <Band node={node} ctx={ctx} />;
    case 'stack':
      return <Stack node={node} ctx={ctx} />;
    case 'row':
      return <Row node={node} ctx={ctx} />;
    case 'split':
      return <Split node={node} ctx={ctx} />;
    case 'grid':
      return <Grid node={node} ctx={ctx} />;
    case 'overlap':
      return <Overlap node={node} ctx={ctx} />;
    case 'bleed':
      return <Bleed node={node} ctx={ctx} />;
    case 'pane':
      return <Pane node={node} ctx={ctx} />;
    case 'marquee':
      return <Marquee node={node} ctx={ctx} />;
    case 'gutter':
      return <Gutter node={node} ctx={ctx} />;
    case 'text':
      return <TextContent node={node} ctx={ctx} />;
    case 'image':
      return <ImageContent node={node} ctx={ctx} />;
    case 'button':
      return <ButtonContent node={node} ctx={ctx} />;
    case 'wordmark':
      return <WordmarkContent node={node} ctx={ctx} />;
    case 'video':
      return <VideoContent node={node} ctx={ctx} />;
    case 'divider':
      return <DividerContent node={node} ctx={ctx} />;
    case 'quote':
      return <QuoteContent node={node} ctx={ctx} />;
    case 'productGrid':
      return <ProductGridContent node={node} ctx={ctx} />;
    case 'featuredProduct':
      return <FeaturedProductContent node={node} ctx={ctx} />;
    case 'collectionGrid':
      return <CollectionGridContent node={node} ctx={ctx} />;
    case 'featuredCollection':
      return <FeaturedCollectionContent node={node} ctx={ctx} />;
    case 'subscriptionGrid':
      return <SubscriptionGridContent node={node} ctx={ctx} />;
    case 'featuredSubscription':
      return <FeaturedSubscriptionContent node={node} ctx={ctx} />;
    case 'contactForm':
      return <ContactFormContent node={node} ctx={ctx} />;
    case 'cart':
      return <CartContent node={node} ctx={ctx} />;
    case 'socialLinks':
      return <SocialLinksContent node={node} ctx={ctx} />;
    case 'navLinks':
      return <NavLinksContent node={node} ctx={ctx} />;
    case 'eventsList':
      return <EventsListContent node={node} ctx={ctx} />;
    default: {
      const _exhaustive: never = node;
      void _exhaustive;
      return null;
    }
  }
}
