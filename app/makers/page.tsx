import type { Metadata } from 'next';
import { PricingPage } from '@/components/pricing/PricingPage';

export const metadata: Metadata = {
  title: 'Websites for makers — BohdiAI',
  description:
    'A real web developer for less than a site builder. Built free, from $14.99 a month, and never a cut of your sales.',
};

export default function MakersPage(): React.ReactElement {
  return (
    <PricingPage
      audience="maker"
      path="/makers"
      copy={{
        badge: 'Websites for makers',
        sub: 'A site that shows what you make, tells people where to find you, and sells online when you’re ready. Built free, and every dollar your customers pay goes straight to you.',
        compareSub: 'The cheap options make you do the work. The easy ones take a cut of every sale.',
      }}
    />
  );
}
