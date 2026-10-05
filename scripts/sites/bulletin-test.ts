/**
 * A hidden test copy of Rustic Rhody in the bulletin board design, for checking
 * the design locally before it goes live (bulletin board plan). Never linked
 * anywhere; delete the tenant once Rustic Rhody itself is switched over.
 */
import type { CardSiteModule } from '../build-card-site';
import { SITE as RUSTIC, PROFILE, PHOTOS } from './rustic-rhody';

export const SITE: CardSiteModule['SITE'] = { ...RUSTIC, subdomain: 'bulletin-test', design: 'bulletin' };
export { PROFILE, PHOTOS };
