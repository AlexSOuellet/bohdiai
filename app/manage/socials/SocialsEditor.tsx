'use client';

import { saveSocials, type SocialsForm } from '@/lib/backend/profile/actions';
import { buildProfileHomes, EMPTY_PROFILE } from '@/lib/backend/profile/profile-form';
import { useSaveForm } from '../_components/useSaveForm';
import { ScreenHead } from '../_components/ScreenHead';

/** Socials: the accounts whose icons show in the site's footer. */
export function SocialsEditor({ initial, siteUrl }: { initial: SocialsForm; siteUrl: string }): React.ReactElement {
  const s = useSaveForm(initial, saveSocials, (f) => {
    const r = buildProfileHomes({ ...EMPTY_PROFILE, ...f });
    return r.ok ? null : r.error;
  });
  return (
    <>
      <ScreenHead title="Socials" siteUrl={siteUrl} unsaved={s.unsaved} busy={s.busy} onSave={() => void s.submit()} />
      <main id="main" className="bk-content">
        {s.notice.area}
        <section className="bk-section" aria-labelledby="s-socials">
          <h2 id="s-socials" className="bk-section-title">Your accounts</h2>
          <p className="bk-note">Each one shows as an icon in your site’s footer, only when it’s filled in.</p>
          <div className="bk-field">
            <label htmlFor="s-facebook" className="bk-label">
              Facebook page
            </label>
            <input id="s-facebook" className="bk-input" inputMode="url" placeholder="facebook.com/yourpage" value={s.form.facebookUrl} onChange={(e) => s.update({ facebookUrl: e.target.value })} />
          </div>
          <div className="bk-field">
            <label htmlFor="s-instagram" className="bk-label">
              Instagram
            </label>
            <input id="s-instagram" className="bk-input" inputMode="url" placeholder="instagram.com/yourname or @yourname" value={s.form.instagramUrl} onChange={(e) => s.update({ instagramUrl: e.target.value })} />
          </div>
        </section>
      </main>
    </>
  );
}
