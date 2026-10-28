import Link from 'next/link';
import type { Route } from 'next';
import type { HomeWall } from '@/lib/backend/home-wall';

/** Her work on Home: a wall of her own photos, with a tile to add another. `wall`
 *  null means her products couldn't load. */
export function WorkWall({ wall, title, link, sub }: { wall: HomeWall | null; title: string; link: string; sub?: string }): React.ReactElement {
  const shownSub = sub ?? wall?.sub;
  return (
    <section aria-labelledby="bk-work">
      <div className="bk-band-head">
        <div>
          <h2 id="bk-work" className="bk-band-title">
            {wall?.title ?? title}
          </h2>
          {wall !== null && shownSub !== undefined && <p className="bk-band-sub">{shownSub}</p>}
        </div>
        <Link className="bk-band-link" href="/manage/products">
          {link}
        </Link>
      </div>
      {wall === null ? (
        <p role="alert" className="bk-error">
          Your products couldn’t load. Refresh to try again.
        </p>
      ) : (
        <ul className="bk-wall">
          <li>
            <Link className="bk-wall-add" href="/manage/products/new">
              Add a product
            </Link>
          </li>
          {wall.items.map((p) => (
            <li key={p.id}>
              <Link className="bk-wall-item" href={`/manage/products/${p.id}` as Route}>
                {p.photoUrl === null ? (
                  <span className="bk-wall-blank">No photo yet</span>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- her own upload, sized by CSS
                  <img src={p.photoUrl} alt="" loading="lazy" />
                )}
                {p.status === 'draft' && <span className="bk-wall-tag">Draft</span>}
                <span className="bk-wall-name">{p.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
