import type { ResolvedSocialLink, SocialLinksNode } from '@/lib/layout';
import type { RenderContext } from '../Node';
import { intentToStyleVars, typeRoleStyle } from '../intent';
import { joinClasses } from '../scale';

function resolvedSocialAt(ctx: RenderContext): ResolvedSocialLink[] | null {
  if (ctx.resolved === undefined || ctx.path === undefined) return null;
  const data = ctx.resolved[ctx.path];
  if (!Array.isArray(data)) return null;
  return data as ResolvedSocialLink[];
}

export function SocialLinksContent({ node, ctx }: { node: SocialLinksNode; ctx: RenderContext }) {
  const resolved = resolvedSocialAt(ctx);
  const links: { platform: string; url?: string }[] =
    resolved !== null && resolved.length > 0
      ? resolved.map((l) => ({ platform: l.platform, url: l.url }))
      : (node.platforms ?? ['instagram', 'tiktok', 'youtube']).map((p) => ({
          platform: p,
        }));

  const style = node.style ?? 'icons';

  if (links.length === 0) return null;

  return (
    <ul
      data-node-type="socialLinks"
      data-node-id={node.id}
      style={intentToStyleVars(node.intent)}
      className={joinClasses(
        'flex items-center gap-4',
        style === 'labels' ? 'flex-col items-start gap-2' : '',
      )}
    >
      {links.map((l) => (
        <li key={l.platform} className="inline-flex items-center gap-2">
          {l.url !== undefined ? (
            <a
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 hover:opacity-80"
            >
              {(style === 'icons' || style === 'both') && (
                <span
                  style={{ background: 'var(--color-surface-variant)' }}
                  className="inline-block h-6 w-6 rounded-full"
                  aria-hidden="true"
                />
              )}
              {(style === 'labels' || style === 'both') && (
                <span style={typeRoleStyle('caption')} className="capitalize">
                  {l.platform}
                </span>
              )}
            </a>
          ) : (
            <>
              {(style === 'icons' || style === 'both') && (
                <span
                  style={{ background: 'var(--color-surface-variant)' }}
                  className="inline-block h-6 w-6 rounded-full"
                  aria-hidden="true"
                />
              )}
              {(style === 'labels' || style === 'both') && (
                <span style={typeRoleStyle('caption')} className="capitalize">
                  {l.platform}
                </span>
              )}
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
