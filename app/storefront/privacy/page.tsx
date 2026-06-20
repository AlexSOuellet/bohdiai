import type { Metadata } from 'next';
import LegalPage from '../_components/LegalPage';
import { storefrontMetadata } from '@/lib/storefront/metadata';

export function generateMetadata(): Promise<Metadata> {
  return storefrontMetadata({ path: '/privacy', pageName: 'Privacy', noindex: true });
}

export default async function StorefrontPrivacyPage() {
  return <LegalPage doc="privacy" />;
}
