import Link from 'next/link';

const MESSAGES: Record<string, string> = {
  link: 'That link has expired or was already used. Ask Alex for a new invite, or use Forgot password on the sign-in page.',
  nosite: 'This account isn’t linked to a site yet. Ask Alex to finish setting it up.',
};
const DEFAULT_MESSAGE = 'Your sign-in link may have expired. Please try again.';

export default async function AuthErrorPage({ searchParams }: { searchParams: Promise<{ reason?: string | string[] }> }) {
  const { reason } = await searchParams;
  const key = typeof reason === 'string' ? reason : '';
  const message = Object.hasOwn(MESSAGES, key) ? MESSAGES[key] : DEFAULT_MESSAGE;
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Something went wrong</h1>
      <p>{message}</p>
      <Link href="/">Go back</Link>
    </main>
  );
}
