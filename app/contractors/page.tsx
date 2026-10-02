import type { Metadata } from 'next';
import { PricingPage } from '@/components/pricing/PricingPage';

export const metadata: Metadata = {
  title: 'Websites for contractors — BohdiAI',
  description:
    'A real web developer for less than a site builder. Built free, from $14.99 a month, and every lead is yours alone.',
};

export default function ContractorsPage(): React.ReactElement {
  return (
    <PricingPage
      audience="contractor"
      path="/contractors"
      copy={{
        badge: 'Websites for contractors',
        sub: 'A site that brings in work. Customers send photos of the job, and the estimate request lands with you. Built free, and every lead is yours alone.',
        compareSub: 'You can build it yourself at night, or pay for leads your competitors also get.',
      }}
    />
  );
}
