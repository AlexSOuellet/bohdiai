import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// Storefront pages are rendered per request (they read the tenant from request
// headers), so there is no incremental cache to persist yet. Add an R2-backed
// incremental cache here if a statically-regenerated route ever appears.
export default defineCloudflareConfig({});
