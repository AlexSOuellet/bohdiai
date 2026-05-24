export default function AuthErrorPage() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Something went wrong</h1>
      <p>Your sign-in link may have expired. Please try again.</p>
      <a href="/">Go back</a>
    </main>
  );
}
