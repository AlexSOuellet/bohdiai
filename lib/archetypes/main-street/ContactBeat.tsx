/**
 * CONTACT on the home page — a one-page site's way to write to the maker (Showcase;
 * Alex, 2026-10-19: at the bottom of the page). The heading and intro are the
 * site's own contact words; the form is the same one the Contact page uses.
 * Class-only (.ms-contactbeat-*).
 */
import type { ReactElement } from 'react';
import type { MainStreetView } from './schemas';
import type { FamilyWords } from './words';
import { MainStreetContactForm } from './MainStreetContactForm';
import { Type } from './Type';
import { dialable } from '@/lib/backend/profile/profile-form';

export function ContactBeat({ contact, phone, words, tenantId }: { contact: MainStreetView['contact']; phone?: string | undefined; words: FamilyWords; tenantId: string }): ReactElement {
  return (
    <section className="ms-contactbeat">
      <div className="ms-wrap ms-contactbeat-inner">
        {contact?.heading && (
          <Type as="h2" role="goodsHead" className="ms-contactbeat-title">
            {contact.heading}
          </Type>
        )}
        {contact?.intro && (
          <Type as="p" role="body" className="ms-contactbeat-intro">
            {contact.intro}
          </Type>
        )}
        {phone !== undefined && (
          <Type as="a" role="navLabel" href={`tel:${dialable(phone)}`} className="ms-contactbeat-phone">
            {phone}
          </Type>
        )}
        <div className="ms-contactbeat-form">
          <MainStreetContactForm tenantId={tenantId} words={words} />
        </div>
      </div>
    </section>
  );
}
