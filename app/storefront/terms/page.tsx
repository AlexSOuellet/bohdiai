import type { Metadata } from 'next';
import LegalPage from '../_components/LegalPage';
import { storefrontMetadata } from '@/lib/storefront/metadata';

export function generateMetadata(): Promise<Metadata> {
  return storefrontMetadata({ path: '/terms', pageName: 'Terms', noindex: true });
}

export default async function StorefrontTermsPage() {
  return <LegalPage doc="terms" />;
}
