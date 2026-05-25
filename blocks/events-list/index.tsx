import meta from './meta';
import { supabaseAdmin } from '@/lib/supabase';

export { meta };

interface EventsListContent {
  headline: string;
}

interface EventsListProps {
  content: EventsListContent;
  tenantId: string;
}

interface Event {
  id: string;
  name: string;
  event_date: string;
  end_date: string | null;
  location: string | null;
  url: string | null;
}

function formatEventDate(start: string, end: string | null): string {
  const startDate = new Date(start + 'T00:00:00');
  const formatted = startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  if (end === null || end === start) return formatted;
  const endDate = new Date(end + 'T00:00:00');
  return `${formatted} – ${endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
}

export default async function EventsList({ content, tenantId }: EventsListProps) {
  const db = supabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);

  const { data: events } = await db
    .from('events')
    .select('id, name, event_date, end_date, location, url')
    .eq('tenant_id', tenantId)
    .eq('status', 'upcoming')
    .gte('event_date', today)
    .order('event_date', { ascending: true })
    .limit(6);

  const items: Event[] = events ?? [];

  if (items.length === 0) return null;

  return (
    <section
      style={{
        backgroundColor: 'var(--color-surface)',
        paddingTop: 'var(--spacing-section)',
        paddingBottom: 'var(--spacing-section)',
      }}
    >
      <div className="mx-auto max-w-3xl px-6">
        <h2
          className="mb-8 text-center"
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 'var(--heading-weight)',
            letterSpacing: 'var(--heading-letter-spacing)',
            color: 'var(--color-text)',
            fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
            lineHeight: '1.2',
          }}
        >
          {content.headline}
        </h2>

        <ul className="space-y-4">
          {items.map((event) => (
            <li
              key={event.id}
              className="flex flex-col gap-1 border-b py-4"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <p
                className="font-medium"
                style={{
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--color-text)',
                  fontSize: '1.0625rem',
                }}
              >
                {event.url !== null ? (
                  <a href={event.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {event.name}
                  </a>
                ) : (
                  event.name
                )}
              </p>
              <p
                className="text-sm"
                style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-muted)' }}
              >
                {formatEventDate(event.event_date, event.end_date)}
                {event.location !== null && ` · ${event.location}`}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
