import type { Metadata } from 'next';
import { backendFace } from '../../manage/fonts';
import '../../manage/backend.css';
import SetPasswordForm from './SetPasswordForm';

export const metadata: Metadata = { title: 'Set your password', robots: { index: false, follow: false } };

/** Outside the backend on purpose: the backend sends a maker with no site yet to the
 *  site form, and someone arriving from an emailed link needs a password first. */
export default function SetPasswordPage(): React.ReactElement {
  return (
    <div className={`bk ${backendFace.variable}`}>
      <main id="main" className="bk-auth">
        <div className="bk-card">
          <h1 className="bk-title">Set your password</h1>
          <SetPasswordForm />
        </div>
      </main>
    </div>
  );
}
