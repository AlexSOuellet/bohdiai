/**
 * Archetype test route — renders the broadsheet archetype with content
 * authored by Bohdi via scripts/test-broadsheet-archetype.ts.
 *
 * The fixture at app/archetype-test/broadsheet-fixture.json is the harness
 * output. The route imports the archetype, hands it the fixture's content
 * and theme pick, and renders. No design decisions live here — this is the
 * smallest possible test harness, end to end.
 */
import { broadsheetArchetype, type BroadsheetContent } from '@/lib/archetypes/broadsheet';
import fixture from '../broadsheet-fixture.json';

interface Fixture {
  content: BroadsheetContent;
  themeKey: string;
}

export default function BroadsheetTestPage() {
  const f = fixture as Fixture;
  const theme = broadsheetArchetype.resolveTheme({ themeKey: f.themeKey });
  const Render = broadsheetArchetype.render;
  return <Render content={f.content} theme={theme} />;
}
