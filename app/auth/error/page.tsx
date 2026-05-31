import Link from 'next/link';

export default function AuthErrorPage() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Something went wrong</h1>
      <p>Your sign-in link may have expired. Please try again.</p>
      <Link href="/">Go back</Link>
    </main>
  );
}
