/**
 * The maker's whole story on a one-page site (Showcase; Alex, 2026-10-19). There is
 * no About page, so the about card's "read more" points here instead: the story sits
 * under the card, hidden until that link is clicked (the section is its target).
 * Class-only (.ms-story-*).
 */
import type { ReactElement } from 'react';
import { Type } from './Type';

/** The story's id: the about card's "read more" on a one-page site points at it. */
export const STORY_ID = 'story';

export function OnePageStory({ story }: { story: readonly string[] }): ReactElement | null {
  if (story.length === 0) return null;
  return (
    <section id={STORY_ID} className="ms-story">
      <div className="ms-wrap ms-story-inner">
        {story.map((p, i) => (
          <Type key={i} as="p" role="body" className="ms-story-p">
            {p}
          </Type>
        ))}
      </div>
    </section>
  );
}
