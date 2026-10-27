import Link from 'next/link';
import type { Route } from 'next';
import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { backendMenu } from '@/lib/backend/menu';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { buildMySite, loadSiteData, type PartShow } from '@/lib/backend/my-site';

export const dynamic = 'force-dynamic';

function Show({ show }: { show: PartShow }): React.ReactElement | null {
  switch (show.kind) {
    case 'headline':
      return (
        <div className={show.photo === null ? undefined : 'bk-part-with-photo'}>
          {/* eslint-disable-next-line @next/next/no-img-element -- her own upload, sized by CSS */}
          {show.photo !== null && <img className="bk-part-photo" src={show.photo} alt="" />}
          <div>
            <p className="bk-part-big">{show.headline}</p>
            {show.sub !== '' && <p className="bk-part-line">{show.sub}</p>}
          </div>
        </div>
      );
    case 'strip':
      return <p className="bk-part-strip">{show.text}</p>;
    case 'about':
      return (
        <div className={show.portrait === null ? undefined : 'bk-part-with-photo'}>
          {/* eslint-disable-next-line @next/next/no-img-element -- her own upload, sized by CSS */}
          {show.portrait !== null && <img className="bk-part-portrait" src={show.portrait} alt="" />}
          <div>
            {show.title !== '' && <p className="bk-part-big">{show.title}</p>}
            <p className="bk-part-line">{show.bio}</p>
          </div>
        </div>
      );
    case 'photos':
      return (
        <div>
          <div className="bk-part-thumbs">
            {show.urls.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element -- her own upload, sized by CSS
              <img key={url} src={url} alt="" loading="lazy" />
            ))}
          </div>
          <p className="bk-part-line">{show.total === 1 ? 'One photo' : `${show.total} photos`}</p>
        </div>
      );
    case 'quote':
      return (
        <div>
          <p className="bk-part-quote">“{show.quote}”</p>
          <p className="bk-part-line">
            {show.name}
            {show.total > 1 && `, and ${show.total - 1} more`}
          </p>
        </div>
      );
    case 'line':
      return <p className="bk-part-quote">{show.text}</p>;
    case 'empty':
      return <p className="bk-part-empty">{show.text}</p>;
    case 'failed':
      return <p className="bk-error">This part couldn’t load. Refresh to try again.</p>;
  }
}

/** My site: her site top to bottom; she taps the part she wants to change. */
export default async function MySitePage(): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  const nav = await backendMenu(site.tenantId, await getSiteFeatures(site.tenantId));
  const items = nav.find((s) => s.section === 'My site')?.items ?? [];
  if (items.length === 0) notFound();
  const { parts, tools } = buildMySite(items, await loadSiteData(await createSupabaseServerClient(), site.tenantId, items));
  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">My site</h1>
        <p className="bk-site-lead">Your site from top to bottom. Tap the part you want to change.</p>
      </div>
      <main id="main" className="bk-content bk-site">
        {parts.length > 0 && (
          <ul className="bk-page" aria-label="The parts of your site">
            {parts.map((part) => (
              <li key={part.href}>
                <Link className="bk-part" href={part.href as Route}>
                  <p className="bk-part-name">{part.label}</p>
                  <div className="bk-part-show">
                    <Show show={part.show} />
                  </div>
                  <span className="bk-part-go">Change</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {tools.length > 0 && (
          <section className="bk-tools" aria-labelledby="bk-tools">
            <h2 id="bk-tools" className="bk-tools-title">
              For the whole site
            </h2>
            {tools.map((tool) => (
              <Link key={tool.href} className="bk-tool" href={tool.href as Route}>
                {tool.photo === null ? (
                  <span className="bk-tool-pic" aria-hidden="true" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- her own upload, sized by CSS
                  <img className="bk-tool-pic" src={tool.photo} alt="" />
                )}
                <span>
                  <span className="bk-tool-name">{tool.label}</span>
                  <span className="bk-tool-line">{tool.line}</span>
                </span>
              </Link>
            ))}
          </section>
        )}
      </main>
    </>
  );
}
