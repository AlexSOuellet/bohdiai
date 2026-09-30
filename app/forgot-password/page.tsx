import type { Metadata } from 'next';
import ForgotForm from './ForgotForm';
import { plex } from '../manage/fonts';
import '../manage/backend.css';

export const metadata: Metadata = { title: 'Forgot password', robots: { index: false, follow: false } };

export default function ForgotPasswordPage(): React.ReactElement {
  return (
    <div className={`bk ${plex.variable}`}>
      <main id="main" className="bk-auth">
        <div className="bk-card">
          <p className="bk-kicker">Site owner</p>
          <h1 className="bk-title">Forgot password</h1>
          <ForgotForm />
        </div>
      </main>
    </div>
  );
}
