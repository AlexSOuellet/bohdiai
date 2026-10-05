/**
 * Business card, torch design (show reel and torch spec): a pine-board page
 * where the maker's name burns in with sparks. Opening, scorched stripes, about
 * with the maker's round brand pressed in, every photo as a big framed panel
 * with its caption burned onto a pine plate, the market dates on stained
 * planks, and the contact form on a char card. Every word the maker wrote comes
 * from `data`; the renderer adds only CARD_STRINGS.
 */
import type { ReactElement, ReactNode } from 'react';
import Link from 'next/link';
import { dialable } from '@/lib/backend/profile/profile-form';
import { PLATFORM_URL } from '@/lib/storefront/platform-credit';
import { CARD_STRINGS as S } from './strings';
import { CardContactForm } from './CardContactForm';
import { PhotoViewerProvider, Snapshot } from './PhotoViewer';
import { TorchFire } from './TorchFire';
import { BURN_TIMING, TORCH_FONTS_HREF, torchCss, type BurnKind } from './torch-styles';
import { datePieces, ringFill, torchLines } from './bulletin';
import { bioParagraphs, initials, type CardData } from './data';

const ROOT_ID = 'tt-root';
const ABOUT_ID = 'about';
const WORK_ID = 'work';
const DATES_ID = 'dates';
const TOUCH_ID = 'touch';
const NAME_KINDS: BurnKind[] = ['name1', 'name2', 'name3'];

/** Burned words: a hidden copy holds the space, the char layer is the burn, the
 *  ember layer is the glowing edge (shown only while burning). With `soft`,
 *  everything after the first word turns to the italic (“Goldie, on basswood”). */
function Burn({ lines, kind, soft = false }: { lines: string[]; kind: BurnKind; soft?: boolean }): ReactElement {
  const [d, delay] = BURN_TIMING[kind];
  const text = lines.map((l, i) => {
    const [first = '', ...rest] = l.split(' ');
    return (
      <span key={`${i}-${l}`} className="tt-line">
        {soft && rest.length > 0 ? (
          <>
            {first} <span className="tt-soft">{rest.join(' ')}</span>
          </>
        ) : (
          l
        )}
      </span>
    );
  });
  return (
    <span className={`tt-burn tt-burn--${kind}`} data-burn="" data-d={d} data-delay={delay}>
      <span className="tt-ghost">{text}</span>
      <span className="tt-char" aria-hidden="true">
        {text}
      </span>
      <span className="tt-ember" aria-hidden="true">
        {text}
      </span>
    </span>
  );
}

function Frame({ children }: { children: ReactNode }): ReactElement {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="stylesheet" href={TORCH_FONTS_HREF} />
      <style dangerouslySetInnerHTML={{ __html: torchCss() }} />
      <div className="tt" id={ROOT_ID} data-design="torch">
        <svg className="tt-defs" aria-hidden="true" focusable="false">
          <filter id="tt-burnedge" x="-25%" y="-60%" width="150%" height="220%">
            <feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves={2} seed={9} />
            <feDisplacementMap in="SourceGraphic" scale={2.5} />
          </filter>
          <filter id="tt-scorchy">
            <feTurbulence baseFrequency=".9" numOctaves={2} seed={4} />
            <feDisplacementMap in="SourceGraphic" scale={4} />
          </filter>
        </svg>
        {children}
      </div>
    </>
  );
}

function Footer({ name, platformCredit }: { name: string; platformCredit: boolean }): ReactElement {
  return (
    <footer className="tt-foot">
      <span className="tt-foot__big" aria-hidden="true">
        {name}
      </span>
      <div className="tt-foot__row">
        <span>
          © {new Date().getFullYear()} {name}
        </span>
        <a href="/privacy">{S.footer.privacy}</a>
        <a href="/terms">{S.footer.terms}</a>
        {platformCredit && (
          <a href={PLATFORM_URL}>
            {S.footer.creditPrefix} {S.footer.creditBrand}
          </a>
        )}
      </div>
    </footer>
  );
}

/** The maker's round brand: initials inside a ring of words, pressed into the board. */
function Brand({ name, kicker }: { name: string; kicker: string }): ReactElement {
  return (
    <div className="tt-brand" data-lit="" aria-hidden="true">
      <svg viewBox="0 0 300 300">
        <defs>
          <path id="tt-ring" d="M150,150 m-112,0 a112,112 0 1,1 224,0 a112,112 0 1,1 -224,0" />
        </defs>
        <circle className="tt-ring" cx="150" cy="150" r="138" />
        <circle className="tt-ring tt-ring--in" cx="150" cy="150" r="88" />
        <text>
          <textPath href="#tt-ring">{ringFill(name, kicker).toUpperCase()}</textPath>
        </text>
        <text className="tt-initials" x="150" y="182" textAnchor="middle">
          {initials(name)}
        </text>
      </svg>
    </div>
  );
}

export function TorchLanding({
  data,
  tenantId,
  platformCredit = true,
}: {
  data: CardData;
  tenantId: string | undefined;
  platformCredit?: boolean;
}): ReactElement {
  const { name, profile: p, photos, dates } = data;
  const lines = torchLines(name).slice(0, NAME_KINDS.length);
  const longName = Math.max(...lines.map((l) => l.length)) > 9;
  const bio = bioParagraphs(p.bio);
  const hasAbout = p.aboutTitle !== '' || bio.length > 0;
  const hasWork = photos.length > 0;
  const hasDates = dates.length > 0;
  const canWrite = tenantId !== undefined;
  const hasWays = p.phone !== '' || p.facebookUrl !== '' || p.instagramUrl !== '';
  const hasTouch = canWrite || hasWays;
  const links = [
    ...(hasAbout ? [{ id: ABOUT_ID, label: S.torch.about }] : []),
    ...(hasWork ? [{ id: WORK_ID, label: S.torch.work }] : []),
    ...(hasDates ? [{ id: DATES_ID, label: S.torch.find }] : []),
    ...(hasTouch ? [{ id: TOUCH_ID, label: S.torch.touch }] : []),
  ];
  // Stripes alternate char and red between the sections that are there.
  let stripe = 0;
  const scorch = (): ReactElement => <div className={stripe++ % 2 === 0 ? 'tt-stripe' : 'tt-stripe tt-stripe--red'} data-lit="" aria-hidden="true" />;

  return (
    <Frame>
      {canWrite && (
        <a className="tt-skip" href={`#${TOUCH_ID}`}>
          {S.skip}
        </a>
      )}
      <TorchFire rootId={ROOT_ID} />
      <header className="tt-bar">
        <Link href="/">{name}</Link>
        {links.length > 0 && (
          <nav aria-label={S.nav.label}>
            {links.map((l) => (
              <a key={l.id} href={`#${l.id}`}>
                {l.label}
              </a>
            ))}
          </nav>
        )}
      </header>

      <main id="main">
        <section className={`tt-open tt-open--${lines.length}`}>
          <div>
            {p.kicker !== '' && (
              <div className="tt-kick">
                <Burn lines={[p.kicker]} kind="kick" />
              </div>
            )}
            <h1 className={longName ? 'tt-name tt-name--long' : 'tt-name'} aria-label={name}>
              {lines.map((line, i) => (
                <span key={`${i}-${line}`} className={i === 0 ? 'tt-row' : 'tt-row tt-row--soft'} aria-hidden="true">
                  <Burn lines={[line]} kind={NAME_KINDS[i] ?? 'name3'} />
                </span>
              ))}
            </h1>
            {p.headline !== '' && <p className="tt-head">{p.headline}</p>}
            {(hasWork || hasTouch) && (
              <div className="tt-btns">
                {hasWork && (
                  <a className="tt-tag" href={`#${WORK_ID}`}>
                    {S.seeWork}
                  </a>
                )}
                {hasTouch && (
                  <a className="tt-tag tt-tag--ghost" href={`#${TOUCH_ID}`}>
                    {S.askAbout}
                  </a>
                )}
              </div>
            )}
          </div>
          <span className="tt-cue" aria-hidden="true">
            {S.torch.scroll}
          </span>
        </section>

        {hasAbout && (
          <>
            {scorch()}
            <section className="tt-about" id={ABOUT_ID}>
              <div className="tt-wrap">
                <div>
                  <div className="tt-label">{S.torch.about}</div>
                  {p.aboutTitle !== '' && (
                    <h2 className="tt-h2">
                      <Burn lines={[p.aboutTitle]} kind="head" />
                    </h2>
                  )}
                  {bio.map((para) => (
                    <p key={para.slice(0, 40)}>{para}</p>
                  ))}
                  {p.signature !== '' && <span className="tt-sig">— {p.signature}</span>}
                </div>
                <Brand name={name} kicker={p.kicker} />
              </div>
            </section>
          </>
        )}

        {hasWork && (
          <>
            {scorch()}
            <section className="tt-work" id={WORK_ID}>
              <div className="tt-wrap">
                <div className="tt-label">{S.torch.work}</div>
                <h2 className="tt-h2">
                  <Burn lines={[S.torch.workTitle]} kind="head" />
                </h2>
                <PhotoViewerProvider photos={photos}>
                  <ul className="tt-reel">
                    {photos.map((photo, i) => (
                      <li key={photo.id} className="tt-piece" data-lit="">
                        <figure>
                          <Snapshot index={i} className="tt-shot" label={S.work.open(photo.caption, i + 1)}>
                            {/* The owner's own upload, already shrunk at upload — a plain img like the other maker-photo spots. */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={photo.url} alt={photo.caption} loading={i < 2 ? 'eager' : 'lazy'} />
                          </Snapshot>
                        </figure>
                        {photo.caption !== '' && (
                          <div className="tt-cap" aria-hidden="true">
                            <span className="tt-plate" />
                            <Burn lines={[photo.caption]} kind="cap" soft />
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </PhotoViewerProvider>
              </div>
            </section>
          </>
        )}

        {hasDates && (
          <>
            {scorch()}
            <section className="tt-dates" id={DATES_ID} data-lit="">
              <div className="tt-wrap">
                <div className="tt-label">{S.torch.find}</div>
                <h2 className="tt-h2">
                  <Burn lines={[S.torch.findTitle]} kind="head" />
                </h2>
                <ul className="tt-planks">
                  {dates.map((d) => {
                    const piece = datePieces(d);
                    return (
                      <li key={d.id} className="tt-plank">
                        <b>{piece.day}</b>
                        <span>{piece.market}</span>
                        <small>{piece.town}</small>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>
          </>
        )}

        {hasTouch && (
          <>
            {scorch()}
            <section className="tt-touch" id={TOUCH_ID}>
              <div className="tt-wrap">
                <div>
                  <div className="tt-label">{S.torch.touch}</div>
                  <h2 className="tt-h2">
                    <Burn lines={[S.torch.touchTitle]} kind="head" />
                  </h2>
                  <p className="tt-lede">{S.torch.lede}</p>
                  {hasWays && (
                    <div className="tt-links">
                      {p.phone !== '' && (
                        <a className="tt-tag" href={`tel:${dialable(p.phone)}`}>
                          {p.phone}
                        </a>
                      )}
                      {p.facebookUrl !== '' && (
                        <a className="tt-tag" href={p.facebookUrl} rel="noopener">
                          {S.touch.facebook}
                        </a>
                      )}
                      {p.instagramUrl !== '' && (
                        <a className="tt-tag" href={p.instagramUrl} rel="noopener">
                          {S.touch.instagram}
                        </a>
                      )}
                    </div>
                  )}
                </div>
                {canWrite && (
                  <div className="tt-form">
                    <CardContactForm tenantId={tenantId} />
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>
      <Footer name={name} platformCredit={platformCredit} />
    </Frame>
  );
}

/** Privacy and terms on the pine board, with the top bar. */
export function TorchContentPage({
  name,
  html,
  title,
  body,
  platformCredit = true,
}: {
  name: string;
  html?: string | undefined;
  title?: string | undefined;
  body?: string[] | undefined;
  platformCredit?: boolean;
}): ReactElement {
  return (
    <Frame>
      <header className="tt-bar">
        <Link href="/">{name}</Link>
      </header>
      <main id="main" className="tt-prose">
        {html !== undefined ? (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <div>
            {title !== undefined && <h1>{title}</h1>}
            {(body ?? []).map((para) => (
              <p key={para.slice(0, 32)}>{para}</p>
            ))}
          </div>
        )}
      </main>
      <Footer name={name} platformCredit={platformCredit} />
    </Frame>
  );
}
