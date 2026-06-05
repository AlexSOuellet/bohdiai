import StorefrontPage from './_components/StorefrontPage';

export default async function StorefrontHomePage({
  searchParams,
}: {
  searchParams: Promise<{ v?: string }>;
}) {
  const sp = await searchParams;
  return <StorefrontPage slug="/" version={sp.v} />;
}
