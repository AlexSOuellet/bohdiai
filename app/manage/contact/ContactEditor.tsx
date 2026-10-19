'use client';

import { saveContact, type ContactForm } from '@/lib/backend/profile/actions';
import { buildProfileHomes, EMPTY_PROFILE } from '@/lib/backend/profile/profile-form';
import { useSaveForm } from '../_components/useSaveForm';
import { ScreenHead } from '../_components/ScreenHead';

/** Contact information: the phone shown on the site, and where its contact messages go. */
export function ContactEditor({ initial, siteUrl }: { initial: ContactForm; siteUrl: string }): React.ReactElement {
  const s = useSaveForm(initial, saveContact, (f) => {
    const r = buildProfileHomes({ ...EMPTY_PROFILE, phone: f.phone });
    return r.ok ? null : r.error;
  });
  return (
    <>
      <ScreenHead title="Contact information" siteUrl={siteUrl} unsaved={s.unsaved} busy={s.busy} onSave={() => void s.submit()} />
      <main id="main" className="bk-content">
        {s.notice.area}
        <section className="bk-section" aria-labelledby="s-contact">
          <h2 id="s-contact" className="bk-section-title">How people reach you</h2>
          <div className="bk-field">
            <label htmlFor="c-phone" className="bk-label">
              Phone
            </label>
            <input id="c-phone" className="bk-input" type="tel" autoComplete="tel" aria-describedby="c-phone-hint" value={s.form.phone} onChange={(e) => s.update({ phone: e.target.value })} />
            <p id="c-phone-hint" className="bk-note">
              Shows on your site only when it’s filled in.
            </p>
          </div>
          <div className="bk-field">
            <label htmlFor="c-email" className="bk-label">
              Email for messages
            </label>
            <input id="c-email" className="bk-input" type="email" autoComplete="email" aria-describedby="c-email-hint" value={s.form.email} onChange={(e) => s.update({ email: e.target.value })} />
            <p id="c-email-hint" className="bk-note">
              Messages from your site’s contact form come here. It isn’t shown on your site.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
